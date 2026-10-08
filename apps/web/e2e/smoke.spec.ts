import { test, expect } from '@playwright/test';

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
  await expect(page.locator('.comparison-panel')).toContainText(/não residência dos eleitores/i);
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
