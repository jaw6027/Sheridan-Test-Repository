import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
mkdirSync('/tmp/plum-preview',{recursive:true});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000');await page.locator('img').evaluateAll(images=>images.forEach(i=>i.loading='eager'));await page.waitForFunction(()=>[...document.images].filter(i=>i.getAttribute('src')).every(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:`/tmp/plum-preview/${name}.png`,fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(name+' horizontal overflow');
 await page.getByRole('link',{name:'Find your inspiration'}).click();await page.getByLabel('Color',{exact:true}).selectOption('Plum');await page.getByRole('button',{name:'Find designs'}).click();
 if(await page.locator('.design-card').count()!==1)throw Error('Gallery filter');
 await page.locator('.card-image').click();await page.getByRole('button',{name:/Enlarge photo/}).first().click();
 if(!await page.locator('dialog').evaluate(d=>d.open))throw Error('Viewer did not open');
 await page.keyboard.press('Escape');if(await page.locator('dialog').evaluate(d=>d.open))throw Error('Viewer did not close');
 await page.goto('http://127.0.0.1:3000/owner/login');
 if(!await page.getByText('Owner login is not configured.').isVisible())throw Error('Missing safe setup state');
 if(errors.length)throw Error(errors.join('\n'));
 console.log(name+': no overflow; gallery filtering, design detail, keyboard photo viewer, and safe owner setup passed.');await page.close();
}
await browser.close();
