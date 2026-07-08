// tools.js — MCP tool definitions and handlers

import { createStealthPage, humanClick, humanType } from './stealth.js';

let browser = null;
let currentPage = null;
let currentContext = null;

export function getBrowser() { return browser; }
export function getPage() { return currentPage; }

export const toolDefinitions = [
  {
    name: 'browser_launch',
    description: 'Launch a stealth-configured browser. Call before other browser tools.',
    inputSchema: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', description: 'Run in headless mode (default: true)' },
        proxy: { type: 'string', description: 'Proxy URL (e.g., http://user:pass@host:port)' },
      },
    },
  },
  {
    name: 'browser_close',
    description: 'Close the browser and cleanup.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'browser_navigate',
    description: 'Navigate to a URL. Automatically waits for page load.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to navigate to' },
        wait_until: { type: 'string', enum: ['load', 'networkidle', 'domcontentloaded'], description: 'Wait condition (default: networkidle)' },
        timeout: { type: 'integer', description: 'Timeout in ms (default: 30000)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page. Returns base64 image.',
    inputSchema: {
      type: 'object',
      properties: {
        full_page: { type: 'boolean', description: 'Capture full page (default: false)' },
      },
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Get the page content as text (accessibility tree or body text).',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to extract text from (default: body)' },
        max_length: { type: 'integer', description: 'Max chars to return (default: 10000)' },
      },
    },
  },
  {
    name: 'browser_click',
    description: 'Click an element by CSS selector or text content.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to click' },
        text: { type: 'string', description: 'Click element containing this text (alternative to selector)' },
        humanlike: { type: 'boolean', description: 'Use human-like mouse movement (default: true)' },
      },
    },
  },
  {
    name: 'browser_type',
    description: 'Type text into an input element.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the input element' },
        text: { type: 'string', description: 'Text to type' },
        humanlike: { type: 'boolean', description: 'Use human-like typing with delays (default: true)' },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript in the page context and return the result.',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript code to execute' },
      },
      required: ['script'],
    },
  },
  {
    name: 'browser_select',
    description: 'Select an option from a dropdown by CSS selector.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the select element' },
        value: { type: 'string', description: 'Option value to select' },
        label: { type: 'string', description: 'Option label to select (alternative to value)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'browser_press',
    description: 'Press a keyboard key.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Key to press (e.g., Enter, Tab, Escape, ArrowDown)' },
      },
      required: ['key'],
    },
  },
  {
    name: 'browser_wait',
    description: 'Wait for a condition or duration.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Wait for this CSS selector to appear' },
        timeout: { type: 'integer', description: 'Max wait time in ms (default: 10000)' },
        duration: { type: 'integer', description: 'Wait for duration in ms (alternative to selector)' },
      },
    },
  },
];

export async function handleToolCall(name, args) {
  if (!browser && name !== 'browser_launch') {
    throw new Error('Browser not launched. Call browser_launch first.');
  }

  switch (name) {
    case 'browser_launch': {
      const { launchStealthBrowser } = await import('./stealth.js');
      browser = await launchStealthBrowser(args.headless !== false, args.proxy || null);
      const { context, page } = await createStealthPage(browser);
      currentContext = context;
      currentPage = page;
      return { text: 'Browser launched in stealth mode.' };
    }

    case 'browser_close': {
      if (currentContext) await currentContext.close().catch(() => { });
      if (browser) await browser.close().catch(() => { });
      browser = null;
      currentPage = null;
      currentContext = null;
      return { text: 'Browser closed.' };
    }

    case 'browser_navigate': {
      await currentPage.goto(args.url, {
        waitUntil: args.wait_until || 'networkidle',
        timeout: args.timeout || 30000,
      });
      const title = await currentPage.title();
      const url = currentPage.url();
      return { text: `Navigated to: ${url}\nTitle: ${title}` };
    }

    case 'browser_screenshot': {
      const screenshot = await currentPage.screenshot({
        fullPage: args.full_page || false,
        type: 'png',
      });
      return {
        text: 'Screenshot captured.',
        data: screenshot.toString('base64'),
        mimeType: 'image/png',
      };
    }

    case 'browser_snapshot': {
      const sel = args.selector || 'body';
      const maxLen = args.max_length || 10000;
      const text = await currentPage.$eval(sel, el => el.innerText || el.textContent, { timeout: 5000 }).catch(() => '');
      return { text: text.substring(0, maxLen) };
    }

    case 'browser_click': {
      if (args.text) {
        await currentPage.click(`text="${args.text}"`, { timeout: 10000 });
      } else if (args.selector) {
        if (args.humanlike !== false) {
          const box = await currentPage.locator(args.selector).boundingBox({ timeout: 10000 });
          if (box) {
            await humanClick(currentPage, box.x + box.width / 2, box.y + box.height / 2);
          }
        } else {
          await currentPage.click(args.selector, { timeout: 10000 });
        }
      } else {
        throw new Error('Provide selector or text');
      }
      return { text: 'Clicked.' };
    }

    case 'browser_type': {
      if (args.humanlike !== false) {
        await humanType(currentPage, args.selector, args.text);
      } else {
        await currentPage.fill(args.selector, args.text);
      }
      return { text: `Typed: ${args.text}` };
    }

    case 'browser_evaluate': {
      const result = await currentPage.evaluate(args.script);
      return { text: JSON.stringify(result, null, 2) };
    }

    case 'browser_select': {
      if (args.label) {
        await currentPage.selectOption(args.selector, { label: args.label });
      } else if (args.value) {
        await currentPage.selectOption(args.selector, args.value);
      }
      return { text: 'Option selected.' };
    }

    case 'browser_press': {
      await currentPage.keyboard.press(args.key);
      return { text: `Pressed: ${args.key}` };
    }

    case 'browser_wait': {
      if (args.selector) {
        await currentPage.waitForSelector(args.selector, { timeout: args.timeout || 10000 });
        return { text: `Element found: ${args.selector}` };
      } else if (args.duration) {
        await new Promise(r => setTimeout(r, args.duration));
        return { text: `Waited ${args.duration}ms` };
      }
      throw new Error('Provide selector or duration');
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
