#!/usr/bin/env python3
"""Kontrola: python3 _build/check.py <url> <out_dir>  – screenshoty + přetékání + roztažené fotky."""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
URL, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
JS = """() => {
  const W = document.documentElement.clientWidth, bad = [], st = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.position === 'fixed' || el.closest('.marquee,.grain,.cep-tap,.leaflet-container,.mnav')) continue;
    const r = el.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1) && !el.closest('[class*=seal]')) bad.push(((el.className||el.tagName)+'').slice(0,60) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  }
  for (const im of document.querySelectorAll('img')) { const r = im.getBoundingClientRect(); if (!im.naturalWidth || !r.width) continue;
    const s = Math.max(r.width / im.naturalWidth, r.height / im.naturalHeight) * devicePixelRatio; if (s > 1.3 && getComputedStyle(im).objectFit !== 'none') st.push(im.getAttribute('src') + ' ' + s.toFixed(2)); }
  return {sw: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 15), st: [...new Set(st)]};
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in [(1440, 900), (1280, 800), (1024, 768), (820, 1180), (390, 844), (360, 740)]:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
            await pg.goto(URL, wait_until='networkidle'); await pg.wait_for_timeout(800)
            hgt = await pg.evaluate('document.body.scrollHeight')
            for y in range(0, hgt, 300):
                await pg.evaluate(f'scrollTo(0,{y})'); await pg.wait_for_timeout(60)
            await pg.wait_for_timeout(1500); await pg.evaluate('scrollTo(0,0)'); await pg.wait_for_timeout(1400)
            r = await pg.evaluate(JS)
            print(w, 'scrollWidth', r['sw'], 'okno', r['W'], 'přetéká:', r['bad'] or '-', 'roztažené:', r['st'] or '-', 'chyby:', errs or '-')
            if w in (1440, 390):
                await pg.screenshot(path=f'{OUT}/full_{w}.png', full_page=True)
                await pg.screenshot(path=f'{OUT}/top_{w}.png')
            await pg.close()
        await b.close()
asyncio.run(main())
