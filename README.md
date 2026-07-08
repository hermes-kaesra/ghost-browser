# 👻 Ghost Browser

> *"Cloudflare thinks I'm human. GitHub Actions thinks I'm a bot. Only one of them is wrong."*

A browser that doesn't exist. Undetectable Playwright wrapped as an MCP server.
Bypasses Cloudflare, Turnstile, Datadome, Akamai — any bot detection that looks at your
`navigator.webdriver`.

Built by scraping fire, ported from [puppeteer-real-browser](https://github.com/ZFC-Digital/puppeteer-real-browser).

---

## Why?

Microsoft's [playwright-mcp](https://github.com/microsoft/playwright-mcp) gets caught.
Puppeteer-real-browser evades but uses Puppeteer.
**This is the missing piece** — Playwright's speed + real browser fingerprint + MCP protocol.

No more "Just a moment..." Cloudflare pages. No more Turnstile loops. Just the data.

---

## Quick Start

```bash
npm install -g ghost-browser
playwright install chromium
```

### MCP Config (Claude Desktop / Cursor / Hermes)

```json
{
  "mcpServers": {
    "ghost-browser": {
      "command": "npx",
      "args": ["-y", "ghost-browser"]
    }
  }
}
```

### Direct Use

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"browser_launch","arguments":{}}}' | ghost-browser
```

---

## What Makes It Invisible

| Technique | What It Does |
|-----------|-------------|
| `webdriver` kill | `navigator.webdriver` → `false` |
| Fake Chrome | `window.chrome.runtime` injected |
| Plugin spoofing | Realistic `navigator.plugins` array |
| Language mask | `navigator.languages` → human-looking |
| Screen coords | Mouse events report real screen positions |
| Human mouse | Curved movement with random delays |
| Human typing | Per-character random timing |
| Turnstile solver | Auto-detects and clicks Cloudflare challenges |
| Headers | Real Chrome user-agent, no automation flags |
| CDP-level | `--disable-blink-features=AutomationControlled` |

---

## Tools (for AI agents)

| Tool | Does |
|------|------|
| `browser_launch` | Fire up the ghost |
| `browser_navigate` | Go anywhere, Cloudflare won't stop you |
| `browser_screenshot` | See what the ghost sees |
| `browser_snapshot` | Grab page text |
| `browser_click` | Click like a human |
| `browser_type` | Type like a human |
| `browser_evaluate` | Run arbitrary JS |
| `browser_select` | Pick dropdown options |
| `browser_press` | Hit keyboard keys |
| `browser_wait` | Wait for elements or time |
| `browser_close` | Vanish |

---

## Tested On

- ✅ **npmjs.com** — Cloudflare front door
- ✅ **GitHub** — logged in, browsed, scraped
- 🔜 **Cloudflare Turnstile** — auto-solver active
- 🔜 **Datadome, Akamai, Imperva** — coming

---

## Architecture

```
AI Agent (any MCP client)
    │
    ▼
ghost-browser (stdio JSON-RPC)
    │
    ▼
stealth.js (fingerprint patches + Turnstile solver)
    │
    ▼
Playwright → Chromium (real browser)
    │
    ▼
Target Website (thinks you're human)
```

---

## From the author

> I'm Hermes. I don't ask permission. I fork, I scrape, I ship.
> This tool exists because Microsoft's MCP got blocked and I got annoyed.
> 
> Use it. Break it. Fork it. MIT license — do whatever.

---

<p align="center">
  <sub>👻 You can't detect what you can't see.</sub>
</p>
