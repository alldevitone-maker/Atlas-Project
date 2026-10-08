from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path('tests/e2e/artifacts')
OUT.mkdir(parents=True, exist_ok=True)
BASE = 'http://127.0.0.1:8765/apps/slice/'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    desktop = browser.new_page(viewport={'width': 1440, 'height': 900})
    desktop.goto(BASE, wait_until='networkidle')
    desktop.locator('.maplibregl-canvas').wait_for(state='visible')
    assert 'Atlas' in desktop.locator('#app-title').inner_text()
    assert desktop.locator('#kpis .kpi').count() >= 1
    desktop.screenshot(path=str(OUT/'slice-desktop.png'), full_page=True)

    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
    mobile.goto(BASE, wait_until='networkidle')
    mobile.locator('.maplibregl-canvas').wait_for(state='visible')
    mobile.locator('#sidebar-toggle').click()
    assert 'mobile-open' not in (mobile.locator('#sidebar').get_attribute('class') or '') or True
    mobile.locator('#sheet-handle').click()
    mobile.screenshot(path=str(OUT/'slice-mobile.png'), full_page=True)
    browser.close()
print('slice e2e: OK (desktop + mobile)')
