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

test('WebKit panel arrows expand and collapse with keyboard and mouse drag',async({page})=>{
 await page.goto('/');
 for(const [selector,axis] of [['.sidebar-handle','x'],['.sheet-handle','y']] as const){
  const control=page.locator(selector);await expect(control).toBeVisible();
  await control.click();const state=await control.getAttribute('aria-expanded');
  await control.focus();await page.keyboard.press('Enter');
  await expect(control).toHaveAttribute('aria-expanded',state==='true'?'false':'true');
  for(const open of [true,false]){
   await control.click({trial:true});
   const box=await control.boundingBox();if(!box)throw new Error('missing handle');
   const x=box.x+box.width/2,y=box.y+box.height/2,delta=(axis==='x'?1:-1)*(open?65:-65);
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+(axis==='x'?delta:0),y+(axis==='y'?delta:0),{steps:8});await page.mouse.up();
   await expect(control).toHaveAttribute('aria-expanded',String(open));
  }
 }
});
