import {test,expect} from '@playwright/test';

test('WebKit desktop and mobile preserve data, controls and shared state',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?theme=light');
 await expect(page.getByText('108.628')).toBeVisible();
 const select=page.getByLabel('Selecionar território');await select.selectOption({index:1});
 const selected=await select.inputValue();await page.reload();
 await expect(select).toHaveValue(selected);
 if(test.info().project.name.startsWith('mobile'))await page.getByRole('button',{name:'Abrir ou fechar navegação'}).click();
 await page.getByRole('checkbox',{name:'Comparar municípios'}).check();
 await expect(page.locator('.comparison-panel')).toContainText('6.065');
 expect(errors).toEqual([]);
 expect(await page.locator('body').evaluate(node=>node.scrollWidth)).toBe(await page.evaluate(()=>document.documentElement.clientWidth));
});
