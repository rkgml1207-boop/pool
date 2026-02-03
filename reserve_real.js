const { chromium } = require('playwright');

const URL =
  'https://ssp.eco-i.or.kr/reservation/diveNew/dive.asp?mNo=MC040000000';

function getKST() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

// 차주 토 / 일
function getNextWeekendDates() {
  const now = getKST();
  const day = now.getDay(); // 0 = 일요일

  const thisSat = new Date(now);
  thisSat.setDate(now.getDate() + ((6 - day + 7) % 7));

  const nextSat = new Date(thisSat);
  nextSat.setDate(thisSat.getDate() + 7);

  const nextSun = new Date(nextSat);
  nextSun.setDate(nextSat.getDate() + 1);

  return [nextSat.getDate(), nextSun.getDate()];
}

(async () => {
  // ✅ GitHub Actions 에서 전달된 계정 정보
  const row = JSON.parse(process.env.ACCOUNT_JSON);

  const loginId = row.loginId;
  const loginPw = row.loginPw;
  const searchId = row.searchId ?? row.loginId;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 접속
    await page.goto(URL, { waitUntil: 'networkidle' });

    // 로그인
    await page.getByText('로그인', { exact: true }).click();

    await page.waitForSelector(
      'input[placeholder="아이디를 입력해주세요."]'
    );

    await page.fill(
      'input[placeholder="아이디를 입력해주세요."]',
      loginId
    );

    await page.fill(
      'input[placeholder="비밀번호를 입력해주세요."]',
      loginPw
    );

    await page.getByRole('button', { name: 'LOGIN' }).click();

    await page.waitForLoadState('networkidle');

    // 차주 토 / 일
    const targetDays = getNextWeekendDates();

    for (const day of targetDays) {
      console.log(`▶ ${day}일 처리`);

      const dayCell = page
        .locator('table')
        .getByText(String(day), { exact: true })
        .first();

      await dayCell.click();
      await page.waitForTimeout(600);

      const applyButtons = page.getByText('추첨신청');
      const cnt = await applyButtons.count();

      // 휴관 / 예약불가
      if (cnt === 0) {
        console.log('  → 휴관 / 예약불가, 패스');
        continue;
      }

      // 1부, 2부
      for (let i = 0; i < 2; i++) {
        console.log(`  - ${i + 1}부`);

        await applyButtons.nth(i).click();

        // 이용인원 2명
        const select = page.locator('select').first();
        await select.waitFor();
        await select.selectOption({ label: '2' });

        // 동의 2개
        const agrees = page.getByText('동의합니다.', { exact: true });
        await agrees.nth(0).click();
        await agrees.nth(1).click();

        // 선택하기
        page.once('dialog', (d) => d.accept());
        await page.getByText('선택하기', { exact: true }).click();

        await page.waitForLoadState('networkidle');

        // 회원검색 팝업
        const [popup] = await Promise.all([
          page.waitForEvent('popup'),
          page.getByText('검색', { exact: true }).click(),
        ]);

        await popup.waitForLoadState();

        await popup.fill('input[type="text"]', searchId);
        await popup.getByText('검색', { exact: true }).click();

        // 신청하기
        await popup.waitForSelector('text=신청하기');
        await popup.getByText('신청하기', { exact: true }).click();

        await popup.close();

        // 처음으로 → 캘린더 복귀
        await page.waitForSelector('text=처음으로');
        await page.getByText('처음으로', { exact: true }).click();
        await page.waitForLoadState('networkidle');
      }
    }

    // 로그아웃
    await page.getByText('로그아웃', { exact: true }).click();
    await page.waitForLoadState('networkidle');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
