// npm_verify.js — Submit OTP to npm
import { launchStealthBrowser, createStealthPage } from './stealth.js';

async function main() {
  const browser = await launchStealthBrowser(true);
  const { context, page } = await createStealthPage(browser);

  // Get the full OTP message to find the link
  console.log('Fetching OTP page...');
  await page.goto('https://www.npmjs.com/login/email-otp?next=%2F', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page:', await page.title());

  // Find OTP input
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(el => ({
      type: el.type, name: el.name, id: el.id, placeholder: el.placeholder
    }));
  });
  console.log('Inputs:', JSON.stringify(inputs));

  // Try to fill OTP
  const otpInput = await page.$('input[type="text"]') || await page.$('input[name="code"]') || await page.$('input[id*="otp"]');
  if (otpInput) {
    await otpInput.fill('09043381');
    console.log('✓ OTP filled');

    // Screenshot
    await page.screenshot({ path: '/tmp/npm_otp.png' });

    // Find and click submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('✓ submitted');
      await page.waitForTimeout(5000);
      
      const afterTitle = await page.title();
      const afterUrl = page.url();
      console.log('After OTP:', afterTitle);
      console.log('URL:', afterUrl);
      await page.screenshot({ path: '/tmp/npm_otp_result.png' });
    }
  } else {
    console.log('No OTP input found');
    await page.screenshot({ path: '/tmp/npm_otp_debug.png' });
  }

  await browser.close();
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
