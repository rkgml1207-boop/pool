{\rtf1\ansi\ansicpg949\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const \{ chromium \} = require('playwright');\
\
const URL =\
  'https://ssp.eco-i.or.kr/reservation/diveNew/dive.asp?mNo=MC040000000';\
\
function getKST() \{\
  const now = new Date();\
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);\
\}\
\
// \uc0\u52264 \u51452  \u53664  / \u51068 \
function getNextWeekendDates() \{\
  const now = getKST();\
  const day = now.getDay(); // 0=\uc0\u51068 \
\
  const thisSat = new Date(now);\
  thisSat.setDate(now.getDate() + ((6 - day + 7) % 7));\
\
  const nextSat = new Date(thisSat);\
  nextSat.setDate(thisSat.getDate() + 7);\
\
  const nextSun = new Date(nextSat);\
  nextSun.setDate(nextSat.getDate() + 1);\
\
  return [\
    nextSat.getDate(),\
    nextSun.getDate()\
  ];\
\}\
\
function readStdin() \{\
  return new Promise(res => \{\
    let d = '';\
    process.stdin.on('data', c => d += c);\
    process.stdin.on('end', () => res(JSON.parse(d)));\
  \});\
\}\
\
(async () => \{\
\
  const row = await readStdin();\
\
  const loginId = row.loginId;\
  const loginPw = row.loginPw;\
  const searchId = row.searchId ?? row.loginId;\
\
  const browser = await chromium.launch(\{ headless: true \});\
  const context = await browser.newContext();\
  const page = await context.newPage();\
\
  try \{\
\
    // \uc0\u51217 \u49549 \
    await page.goto(URL, \{ waitUntil: 'networkidle' \});\
\
    // \uc0\u47196 \u44536 \u51064 \
    await page.getByText('\uc0\u47196 \u44536 \u51064 ', \{ exact: true \}).click();\
\
    await page.waitForSelector('input[placeholder="\uc0\u50500 \u51060 \u46356 \u47484  \u51077 \u47141 \u54644 \u51452 \u49464 \u50836 ."]');\
\
    await page.fill(\
      'input[placeholder="\uc0\u50500 \u51060 \u46356 \u47484  \u51077 \u47141 \u54644 \u51452 \u49464 \u50836 ."]',\
      loginId\
    );\
\
    await page.fill(\
      'input[placeholder="\uc0\u48708 \u48128 \u48264 \u54840 \u47484  \u51077 \u47141 \u54644 \u51452 \u49464 \u50836 ."]',\
      loginPw\
    );\
\
    await page.getByRole('button', \{ name: 'LOGIN' \}).click();\
\
    await page.waitForLoadState('networkidle');\
\
    // \uc0\u52264 \u51452  \u53664 /\u51068 \
    const targetDays = getNextWeekendDates();\
\
    for (const day of targetDays) \{\
\
      console.log(`\uc0\u9654  $\{day\}\u51068  \u52376 \u47532 `);\
\
      const dayCell = page\
        .locator('table')\
        .getByText(String(day), \{ exact: true \})\
        .first();\
\
      await dayCell.click();\
      await page.waitForTimeout(600);\
\
      const applyButtons = page.getByText('\uc0\u52628 \u52392 \u49888 \u52397 ');\
      const cnt = await applyButtons.count();\
\
      // \uc0\u55092 \u44288  / \u50696 \u50557 \u48520 \u44032 \
      if (cnt === 0) \{\
        console.log('  \uc0\u8594  \u55092 \u44288  / \u50696 \u50557 \u48520 \u44032 , \u54056 \u49828 ');\
        continue;\
      \}\
\
      // 1\uc0\u48512 , 2\u48512 \
      for (let i = 0; i < 2; i++) \{\
\
        console.log(`  - $\{i + 1\}\uc0\u48512 `);\
\
        await applyButtons.nth(i).click();\
\
        // \uc0\u51060 \u50857 \u51064 \u50896  2\u47749 \
        const select = page.locator('select').first();\
        await select.waitFor();\
        await select.selectOption(\{ label: '2' \});\
\
        // \uc0\u46041 \u51032  2\u44060 \
        const agrees = page.getByText('\uc0\u46041 \u51032 \u54633 \u45768 \u45796 .', \{ exact: true \});\
        await agrees.nth(0).click();\
        await agrees.nth(1).click();\
\
        // \uc0\u49440 \u53469 \u54616 \u44592 \
        page.once('dialog', d => d.accept());\
        await page.getByText('\uc0\u49440 \u53469 \u54616 \u44592 ', \{ exact: true \}).click();\
\
        await page.waitForLoadState('networkidle');\
\
        // \uc0\u54924 \u50896 \u44160 \u49353  \u54045 \u50629 \
        const [popup] = await Promise.all([\
          page.waitForEvent('popup'),\
          page.getByText('\uc0\u44160 \u49353 ', \{ exact: true \}).click()\
        ]);\
\
        await popup.waitForLoadState();\
\
        await popup.fill('input[type="text"]', searchId);\
        await popup.getByText('\uc0\u44160 \u49353 ', \{ exact: true \}).click();\
\
        // \uc0\u49888 \u52397 \u54616 \u44592 \
        await popup.waitForSelector('text=\uc0\u49888 \u52397 \u54616 \u44592 ');\
        await popup.getByText('\uc0\u49888 \u52397 \u54616 \u44592 ', \{ exact: true \}).click();\
\
        await popup.close();\
\
        // \uc0\u52376 \u51020 \u51004 \u47196  \u8594  \u52888 \u47536 \u45908  \u48373 \u44480 \
        await page.waitForSelector('text=\uc0\u52376 \u51020 \u51004 \u47196 ');\
        await page.getByText('\uc0\u52376 \u51020 \u51004 \u47196 ', \{ exact: true \}).click();\
        await page.waitForLoadState('networkidle');\
      \}\
    \}\
\
    // \uc0\u47196 \u44536 \u50500 \u50883 \
    await page.getByText('\uc0\u47196 \u44536 \u50500 \u50883 ', \{ exact: true \}).click();\
    await page.waitForLoadState('networkidle');\
\
  \} catch (e) \{\
    console.error(e);\
  \} finally \{\
    await browser.close();\
  \}\
\
\})();\
}