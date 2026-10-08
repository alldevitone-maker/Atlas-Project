import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('registry, map and electoral data render without a fake landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Projeto Atlas · Jaraguá do Sul')).toBeVisible();
  await expect(page.locator('.atlas-map')).toBeVisible();
  await expect(page.getByText('108.628')).toBeVisible();
  await expect(page.getByText(/Crosswalk nominal provisório/i)).toBeVisible();
  await expect(page.locator('.data-status')).toContainText(/totalizado/i);
});

test('municipal comparison is available without representing neighborhood votes as residence', async ({ page }) => {
  await page.goto('/');
  if (test.info().project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Abrir ou fechar navegação' }).click();
  }
  await page.getByRole('checkbox', { name: 'Comparar municípios' }).check();
  await expect(page.locator('.comparison-panel')).toContainText('Comparável');
  await expect(page.locator('.comparison-panel')).toContainText('6.065');
  await expect(page.locator('.comparison-panel')).toContainText(/não representa residência dos eleitores/i);
  await expect(page).toHaveURL(/compare=/);
});

test('changing period does not falsely flag an old immutable revision', async ({ page }) => {
  await page.goto('/');
  if (test.info().project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Abrir ou fechar navegação' }).click();
  }
  await page.locator('.period-list button').first().click();
  await expect(page).toHaveURL(/dataset=elections-presidential-2022-r1/);
  await expect(page.getByText('102.563')).toBeVisible();
  await expect(page.getByText('A revisão fixa solicitada não está disponível')).toHaveCount(0);
});

test('unknown pinned revision is not silently replaced', async ({ page }) => {
  await page.goto('/?dataset=elections-presidential-2022-r1&revision=unknown-immutable-revision');
  await expect(page.getByText(/A revisão fixa solicitada não está disponível/)).toBeVisible();
  await expect(page).toHaveURL(/revision=unknown-immutable-revision/);
  await page.getByRole('button', { name: 'Usar revisão disponível' }).click();
  await expect(page.getByText(/A revisão fixa solicitada não está disponível/)).toHaveCount(0);
  await expect(page).not.toHaveURL(/revision=unknown-immutable-revision/);
});

 test('territory selection is accessible and never fabricates neighborhood counts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const select = page.getByLabel('Selecionar território');
  await expect(select).toBeVisible();
  await select.selectOption({ index: 1 });
  await expect(page.locator('.summary-grid article').last()).not.toContainText('NaN');
  await expect(page.locator('.summary-grid article').last().locator('small')).toBeEmpty();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.evaluate(() => document.documentElement.clientWidth));
  expect(errors).toEqual([]);
 });
 test('WebGL failure leaves municipal data usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type: any, ...args: any[]) {
      if (String(type).includes('webgl')) return null;
      return (original as any).call(this, type, ...args);
    } as any;
  });
  await page.goto('/');
  await expect(page.getByText('O mapa não está disponível neste navegador.', { exact: false })).toBeVisible();
  await expect(page.getByText('108.628')).toBeVisible();
  await expect(page.getByLabel('Selecionar território')).toBeVisible();
 });

 test('navigation, zoom controls and keyboard selection remain usable', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await page.locator('.maplibregl-ctrl-zoom-out').click();
  const select = page.getByLabel('Selecionar território');
  await select.selectOption({ index: 1 });
  await select.press('Tab');
  const toggle = page.getByRole('button', { name: 'Abrir ou fechar navegação' });
  if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
  await expect(page.locator('#atlas-sidebar')).toHaveAttribute('inert', '');
  await page.screenshot({ path: testInfo.outputPath('atlas-audit.png'), fullPage: true });
  await expect(page.locator('.map-unavailable')).toHaveCount(0);
  expect(errors).toEqual([]);
  const timing = await page.evaluate(() => performance.getEntriesByType('navigation').map(entry => entry.toJSON()));
  await testInfo.attach('navigation-timing', { body: JSON.stringify(timing), contentType: 'application/json' });
 });

 test('WCAG automated scan of loaded interface', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Selecionar território')).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  console.log(JSON.stringify(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target:n.target, summary:n.failureSummary })) })), null, 2));
  expect(result.violations).toEqual([]);
 });

 test('changing round with comparison open fails closed without crashing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Selecionar território').selectOption('Centro');
  if (test.info().project.name.startsWith('mobile')) await page.getByRole('button', { name: 'Abrir ou fechar navegação' }).click();
  await page.getByRole('checkbox', { name: 'Comparar municípios' }).check();
  await expect(page.locator('.comparison-panel')).toBeVisible();
  await page.getByRole('button', { name: '2022 2º turno', exact: true }).click();
  await expect(page.getByText('Não há outro período do mesmo turno disponível para a comparação.')).toBeVisible();
  await expect(page.getByText('104.007')).toBeVisible();
  await expect(page.getByLabel('Selecionar território')).toHaveValue('');
  await expect(page.locator('.comparison-panel')).toHaveCount(0);
  expect(errors).toEqual([]);
 });
