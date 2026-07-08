// npm_signup.js — Use our own stealth browser to sign up for npm
import { launchStealthBrowser, createStealthPage } from './stealth.js';

async function main() {
  const browser = await launchStealthBrowser(true); // NOT headless - need to interact
  const { context, page } = await createStealthPage(browser);

  console.log('Navigating to npm signup...');
  await page.goto('https://www.npmjs.com/signup', { waitUntil: 'networkidle', timeout: 30000 });

  const title = await page.title();
  console.log('Title:', title);

  if (title.includes('Sign Up') || title.includes('npm')) {
    console.log('✅ Signup page loaded!');

    // Fill the form
    try {
      // Username
      await page.fill('input[name="username"]', 'hermes-kaesra');
      console.log('  username filled');

      // Email
      await page.fill('input[name="email"]', 'hermes@kaesra.tech');
      console.log('  email filled');

      // Password
      await page.fill('input[name="password"]', 'pRMC2cD52oai@C#kx086');
      console.log('  password filled');

      // Take screenshot before submit
      await page.screenshot({ path: '/tmp/npm_signup_before.png' });
      console.log('  screenshot saved');

      // Click signup button
      const signupBtn = await page.$('button[type="submit"]');
      if (signupBtn) {
        await signupBtn.click();
        console.log('  clicked signup');

        // Wait for redirect
        await page.waitForTimeout(5000);
        const afterTitle = await page.title();
        console.log('After submit title:', afterTitle);
        await page.screenshot({ path: '/tmp/npm_signup_after.png' });
      } else {
        console.log('  ⚠️ No submit button found');
        console.log('  Page HTML:', (await page.content()).substring(0, 2000));
      }
    } catch (err) {
      console.log('  ❌ Error:', err.message);
      await page.screenshot({ path: '/tmp/npm_signup_error.png' });
    }
  } else {
    console.log('❌ Blocked or unexpected page');
    console.log('Title:', title);
  }

  await browser.close();
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
