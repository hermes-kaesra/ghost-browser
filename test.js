// test.js — Quick test of stealth features
import { launchStealthBrowser, createStealthPage } from './stealth.js';

async function main() {
  console.log('Launching stealth browser...');
  const browser = await launchStealthBrowser(true); // headless
  const { context, page } = await createStealthPage(browser);

  console.log('Testing Cloudflare bypass on npmjs.com...');
  await page.goto('https://www.npmjs.com', { waitUntil: 'networkidle', timeout: 30000 });
  const title = await page.title();
  console.log('Title:', title);

  // Check if we got blocked
  if (title.includes('Just a moment') || title.includes('security')) {
    console.log('❌ BLOCKED by Cloudflare');
  } else {
    console.log('✅ PASSED Cloudflare!');
    // Check navigator.webdriver
    const webdriver = await page.evaluate(() => navigator.webdriver);
    console.log('navigator.webdriver:', webdriver, webdriver === false ? '✅' : '❌');
  }

  await context.close();
  await browser.close();
  console.log('Test complete.');
}

main().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
