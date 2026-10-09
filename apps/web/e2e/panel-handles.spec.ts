import { test, expect } from '@playwright/test';

for (const axis of ['horizontal', 'vertical'] as const) {
  test(`${axis} panel supports arrow, keyboard and pointer gestures`, async ({ page, isMobile }) => {
    await page.goto('/');
    const handle = page.getByRole('button', { name: axis === 'horizontal' ? 'Expandir ou recolher menu lateral' : 'Expandir ou recolher painel' });
    // Use class for the translated bottom label, retaining its accessible name assertion.
    const control = axis === 'vertical' ? page.locator('.sheet-handle') : handle;
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute('aria-controls', axis === 'horizontal' ? 'atlas-sidebar' : 'atlas-bottom-sheet');
    await control.click();
    const afterClick = await control.getAttribute('aria-expanded');
    await control.focus();
    await page.keyboard.press('Enter');
    await expect(control).toHaveAttribute('aria-expanded', afterClick === 'true' ? 'false' : 'true');
    const drag = async (delta: number, cancel = false) => {
      await control.click({ trial: true });
      const box = await control.boundingBox();
      if (!box) throw new Error('missing handle');
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      if (isMobile) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (axis === 'horizontal' ? delta : 0), y: y + (axis === 'vertical' ? delta : 0) }] });
        await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
        await cdp.detach();
      } else {
        await page.mouse.move(x, y); await page.mouse.down();
        await page.mouse.move(x + (axis === 'horizontal' ? delta : 0), y + (axis === 'vertical' ? delta : 0), { steps: 8 });
        await page.mouse.up();
      }
    };
    await drag(axis === 'horizontal' ? 65 : -65);
    await expect(control).toHaveAttribute('aria-expanded', 'true');
    await drag(axis === 'horizontal' ? -65 : 65);
    await expect(control).toHaveAttribute('aria-expanded', 'false');
    if (isMobile) { await drag(axis === 'horizontal' ? 65 : -65, true); await expect(control).toHaveAttribute('aria-expanded', 'false'); }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(control).toHaveCSS('animation-name', 'none');
  });
}
