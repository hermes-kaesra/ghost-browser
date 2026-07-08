// inspect_npm.js — Inspect npm signup form
import { launchStealthBrowser, createStealthPage } from './stealth.js';

async function main() {
  const browser = await launchStealthBrowser(true);
  const { context, page } = await createStealthPage(browser);

  await page.goto('https://www.npmjs.com/signup', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Title:', await page.title());

  // Find all form inputs
  const inputs = await page.evaluate(() => {
    const els = document.querySelectorAll('input, button');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      type: el.type,
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      ariaLabel: el.getAttribute('aria-label'),
      text: el.textContent?.substring(0, 30),
      class: el.className?.substring(0, 60),
    }));
  });
  console.log('Form elements:');
  inputs.forEach(i => console.log(JSON.stringify(i)));

  await browser.close();
}
main().catch(err => { console.error(err.message); process.exit(1); });
