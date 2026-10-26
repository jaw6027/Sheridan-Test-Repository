import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { scryptSync } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
const dir=mkdtempSync(path.join(os.tmpdir(),'plum-browser-'));
const base='http://127.0.0.1:3001';
// Throwaway test credentials; never used by the running preview or a deployment.
const env={...process.env,PORT:'3001',DATA_DIR:dir,NODE_ENV:'development',PUBLIC_URL:base,RESEND_API_KEY:'',EMAIL_FROM:'',SESSION_SECRET:'isolated-browser-test-session',OWNER_PASSWORD_HASH:'browser-test-salt:'+scryptSync('browser-only-test-password','browser-test-salt',64).toString('hex')};
let child,browser;
async function start(){child=spawn(process.execPath,['server.js'],{env,stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(d.toString().includes('running on port'))resolve();});child.once('exit',()=>reject(Error('Server stopped before readiness')));});}
async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done;}}
try{
 await start();browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 mkdirSync('/tmp/plum-preview',{recursive:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/owner/login');await page.getByLabel('Owner password').fill('browser-only-test-password');await page.getByRole('button',{name:'Enter your studio'}).click();
 await page.getByRole('button',{name:'New design'}).click();
 await page.getByLabel('Design title').fill('Rose garden browser test');await page.getByLabel('Description',{exact:true}).fill('An isolated test of the owner’s complete publishing workflow.');await page.getByLabel('Color',{exact:true}).fill('Pink');await page.getByLabel('Style',{exact:true}).fill('Floral');await page.getByRole('button',{name:'Save draft'}).click();
 const img=await sharp({create:{width:800,height:1000,channels:3,background:'#b7829a'}}).jpeg().toBuffer();
 await page.getByLabel('Choose photos').setInputFiles({name:'test-photo.jpg',mimeType:'image/jpeg',buffer:img});await page.getByRole('button',{name:'Upload photos'}).click();
 await page.getByLabel('Image description',{exact:true}).fill('Pink placeholder used only for automated testing');await page.getByRole('button',{name:'Save photo'}).click();
 await page.getByText('＋ Add a supply',{exact:true}).click();await page.getByLabel('Product name',{exact:true}).fill('Test polish');await page.getByLabel('Brand',{exact:true}).fill('Test brand');await page.getByLabel('Shade or color').fill('Rose');await page.getByLabel('Retailer purchase address').fill('https://example.test/product');await page.getByRole('button',{name:'Add supply',exact:true}).click();
 await page.screenshot({path:'/tmp/plum-preview/owner-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Owner mobile overflow');await page.screenshot({path:'/tmp/plum-preview/owner-mobile.png',fullPage:true});
 await page.getByRole('link',{name:'Preview',exact:true}).click();await page.getByRole('heading',{name:'Rose garden browser test'}).waitFor();await page.getByRole('link',{name:'Return to editor'}).click();
 await page.getByRole('button',{name:'Publish design'}).click();
 await page.goto(base+'/gallery?color=Pink&style=Floral');await page.getByRole('link',{name:'Rose garden browser test',exact:true}).click();
 const address=page.url();const photo=await page.locator('.photo-button img').getAttribute('src');
 if((await page.request.get(base+photo)).status()!==200)throw Error('Published upload unavailable');
 if(!await page.getByRole('link',{name:/Buy from retailer/}).isVisible())throw Error('Supply link missing');
 await stop();await start();await page.goto(address);await page.getByRole('heading',{name:'Rose garden browser test'}).waitFor();
 if((await page.request.get(base+photo)).status()!==200)throw Error('Photo did not persist after restart');
 await page.goto(base+'/owner');if(page.url().endsWith('/owner/login'))throw Error('Session did not survive restart');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Owner browser workflow passed: login, draft, upload, alt text, supplies, private preview, mobile editor, publish, persistent post/photo/session after restart.');
}finally{await browser?.close();await stop();rmSync(dir,{recursive:true,force:true});}
