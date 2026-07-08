// stealth.js — Anti-detection patches for Playwright
// Ported from puppeteer-real-browser techniques

/**
 * Apply all stealth patches to a Playwright page
 * Must be called BEFORE navigating to the target site
 */
export async function applyStealth(page) {
  // 1. Remove webdriver property
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // 2. Fake chrome.runtime
  await page.addInitScript(() => {
    window.chrome = {
      runtime: {},
      loadTimes: function () { },
      csi: function () { },
      app: {},
    };
  });

  // 3. Spoof plugins
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
      ],
    });
  });

  // 4. Spoof languages
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'tr'],
    });
  });

  // 5. Fix screen coordinates for mouse events
  await page.addInitScript(() => {
    Object.defineProperty(MouseEvent.prototype, 'screenX', {
      get: function () { return this.clientX + window.screenX; },
    });
    Object.defineProperty(MouseEvent.prototype, 'screenY', {
      get: function () { return this.clientY + window.screenY; },
    });
  });

  // 6. Hardware concurrency (realistic)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });
  });

  // 7. Device memory
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });
  });

  // 8. Permissions faking
  await page.addInitScript(() => {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: 'prompt', onchange: null }) :
        originalQuery(parameters)
    );
  });
}

/**
 * Human-like mouse movement helper
 * Moves the mouse in a natural-looking curve
 */
export async function humanClick(page, x, y) {
  // Get current mouse position
  const box = await page.evaluate(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }));

  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = box.x + (x - box.x) * t + Math.sin(t * Math.PI) * (Math.random() * 20 - 10);
    const cy = box.y + (y - box.y) * t + Math.sin(t * Math.PI) * (Math.random() * 10 - 5);
    await page.mouse.move(cx, cy);
    await new Promise(r => setTimeout(r, 20 + Math.random() * 30));
  }
  await page.mouse.click(x, y, { delay: 50 + Math.random() * 100 });
}

/**
 * Human-like typing with random delays
 */
export async function humanType(page, selector, text) {
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: 50 + Math.random() * 100 });
  }
}

/**
 * Launch a stealth-configured browser
 */
export async function launchStealthBrowser(headless = false, proxy = null) {
  const { chromium } = await import('playwright');

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-site-isolation-trials',
    '--disable-web-security',
    '--disable-features=BlockInsecurePrivateNetworkRequests',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-infobars',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-translate',
    '--disable-default-apps',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-zygote',
    ...(proxy ? [`--proxy-server=${proxy}`] : []),
  ];

  const browser = await chromium.launch({
    headless,
    args,
    ignoreDefaultArgs: ['--enable-automation'],
  });

  return browser;
}

/**
 * Auto-solve Cloudflare Turnstile challenges
 * Polls for the iframe and clicks it
 */
export async function solveTurnstile(page, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      // Check for Turnstile iframe
      const frame = page.frame({ url: /turnstile/ }) || page.frame({ url: /challenges\.cloudflare/ });
      if (frame) {
        // Try clicking inside the challenge iframe
        await frame.click('body', { timeout: 3000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
      }

      // Check if Turnstile is solved (hidden input with cf-turnstile-response)
      const solved = await page.$('[name="cf-turnstile-response"]');
      if (solved) {
        const value = await solved.evaluate(el => el.value);
        if (value && value.length > 10) {
          console.log('  ✓ Turnstile solved');
          return true;
        }
      }

      // Check if challenge disappeared (form inputs now visible)
      const inputs = await page.$$('input:not([type="hidden"])');
      if (inputs.length > 0) {
        console.log('  ✓ Turnstile passed (form visible)');
        return true;
      }

      // Try clicking the iframe wrapper
      const wrappers = await page.$$('div');
      for (const div of wrappers) {
        try {
          const box = await div.boundingBox();
          if (box && box.width > 290 && box.width <= 310 && box.height > 60 && box.height < 80) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            break;
          }
        } catch {}
      }
    } catch {}
    await page.waitForTimeout(1000);
  }
  console.log('  ⚠️ Turnstile timeout');
  return false;
}

/**
 * Create a stealth-configured context and page
 */
export async function createStealthPage(browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    permissions: [],
    geolocation: { latitude: 41.0082, longitude: 28.9784 },
  });

  const page = await context.newPage();
  await applyStealth(page);

  return { context, page };
}
