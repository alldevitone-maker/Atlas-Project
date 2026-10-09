import {test,expect} from '@playwright/test';

test('published exploratory palette preserves provenance and pair state',async({page})=>{
 await page.goto('./?mapMode=legacy-pair');
 await expect(page.getByText('108.628')).toBeVisible();
 await expect(page.getByLabel('Legenda exploratória do par')).toContainText('Candidato azul:');
 await expect(page.getByText(/Cores de rótulos do legado: não são resultados oficiais/)).toBeVisible();
 await expect(page.locator('.maplibregl-canvas')).toBeVisible();
 await page.reload();await expect(page).toHaveURL(/mapMode=legacy-pair/);
 await expect(page.getByLabel('Legenda exploratória do par')).toBeVisible();
});

test('published application renders verified assets and neutral map',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('./');
 await expect(page.getByText('108.628')).toBeVisible();
 await expect(page.locator('.data-status')).toContainText(/legado não verificado/i);
 await expect(page.locator('.maplibregl-canvas')).toBeVisible();
 const select=page.getByLabel('Selecionar território');await select.selectOption('Centro');
 await page.reload();await expect(select).toHaveValue('Centro');
 await expect(page.locator('.summary-grid article').last().locator('small')).toBeEmpty();
 expect(await page.locator('body').evaluate(node=>node.scrollWidth)).toBe(await page.evaluate(()=>document.documentElement.clientWidth));
 expect(errors).toEqual([]);
 await testInfo.attach('published-site',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});

test('published BU keeps provisional semantics and source section inspector',async({page})=>{
 await page.goto('./?dataset=elections-presidential-2026-r1-bu&theme=light');
 await expect(page.getByText('108.638')).toBeVisible();
 await expect(page.locator('.summary-grid article').first()).toContainText('Votos nominais nos boletins');
 await page.getByText('Inspecionar seções da fonte').click();
 await page.getByLabel('Seção eleitoral').selectOption({index:1});
 await expect(page.getByText(/Local de votação:/)).toBeVisible();
 if(test.info().project.name.includes('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByRole('checkbox',{name:'Comparar municípios'}).check();
 await expect(page.locator('.comparison-panel')).toContainText('Extração provisória');
 expect(await page.locator('#atlas-sidebar').evaluate(node=>node.scrollWidth)).toBe(await page.locator('#atlas-sidebar').evaluate(node=>node.clientWidth));
});

test('published captured 2022 data and catalog load with matching hashes',async({page})=>{
 await page.goto('./?dataset=elections-presidential-2022-r1-bu');
 await expect(page.getByText('102.563')).toBeVisible();
 await expect(page.locator('.candidate-row')).toHaveCount(11);
 await expect(page.locator('.data-status')).toContainText(/provisório/i);
 await expect(page.locator('.summary-grid article').first()).toContainText('Votos nominais nos boletins');
});
