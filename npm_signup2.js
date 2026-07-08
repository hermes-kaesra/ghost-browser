// npm_signup2.js — Sign up for npm using our stealth browser
import { launchStealthBrowser, createStealthPage, humanClick, humanType } from './stealth.js';

async function main() {
  const browser = await launchStealthBrowser(true);
  const { context, page } = await createStealthPage(browser);

  await page.goto('https://www.npmjs.com/signup', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page:', await page.title());

  // Fill form using IDs
  await page.fill('#signup_name', 'hermes-kaesra');
  console.log('✓ username');

  await page.fill('#signup_email', 'hermes@kaesra.tech');
  console.log('✓ email');

  await page.fill('#signup_password', 'pRMC2cD52oai@C#kx086');
  console.log('✓ password');

  // Check EULA agreement
  await page.check('#signup_eula-agreement');
  console.log('✓ EULA agreed');

  // Screenshot
  await page.screenshot({ path: '/tmp/npm_signup_ready.png' });
  console.log('📸 screenshot saved');

  // Submit
  await page.click('button[type="submit"]');
  console.log('✓ submitted');

  // Wait for response
  await page.waitForTimeout(5000);

  const afterTitle = await page.title();
  const afterUrl = page.url();
  console.log('After submit:', afterTitle);
  console.log('URL:', afterUrl);

  if (afterUrl.includes('login') || afterUrl.includes('signup')) {
    // Check for errors
    const errors = await page.$$eval('[role="alert"], .error, ._error', els => els.map(e => e.textContent));
    console.log('Errors:', errors);
  }

  await page.screenshot({ path: '/tmp/npm_signup_result.png' });
  console.log('📸 result saved');

  await browser.close();
  console.log('Done.');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
