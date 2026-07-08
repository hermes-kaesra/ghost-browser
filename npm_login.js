// npm_login.js — Full login flow
import { launchStealthBrowser, createStealthPage } from './stealth.js';

async function main() {
  const browser = await launchStealthBrowser(true);
  const { context, page } = await createStealthPage(browser);

  // First try login
  await page.goto('https://www.npmjs.com/login', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page:', await page.title());

  // Fill login
  await page.fill('input[name="username"]', 'hermes-kaesra');
  console.log('✓ username');
  await page.fill('input[name="password"]', 'pRMC2cD52oai@C#kx086');
  console.log('✓ password');
  
  await page.screenshot({ path: '/tmp/npm_login_before.png' });
  
  await page.click('button[type="submit"]');
  console.log('✓ submitted');
  await page.waitForTimeout(5000);
  
  const afterTitle = await page.title();
  const afterUrl = page.url();
  console.log('After:', afterTitle, afterUrl);

  // Check if OTP page
  if (afterUrl.includes('otp') || afterUrl.includes('2fa')) {
    console.log('OTP required!');
    const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(e => ({type:e.type, name:e.name, id:e.id})));
    console.log('Inputs:', JSON.stringify(inputs));
    
    const otpInput = await page.$('input[type="text"]') || await page.$('input:not([type="hidden"]):not([type="submit"])');
    if (otpInput) {
      await otpInput.fill('09043381');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      console.log('OTP submitted, title:', await page.title(), 'url:', page.url());
    }
  }

  await page.screenshot({ path: '/tmp/npm_login_result.png' });
  
  // Try to go to tokens page
  await page.goto('https://www.npmjs.com/settings/hermes-kaesra/tokens', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('Tokens page:', await page.title());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Text:', text);

  await browser.close();
}

main().catch(err => { console.error(err.message); process.exit(1); });
