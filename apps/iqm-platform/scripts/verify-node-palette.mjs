// Verify actual rendered node identities, including selection and responsive cards.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const app=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dist=join(app,'dist'), output=resolve(process.env.OUTPUT_DIR||join(app,'studio-review'));
await mkdir(output,{recursive:true});
const palette=JSON.parse(await readFile(join(app,'src/theme/synergy-node-palette.json'),'utf8'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{try{let p=resolve(dist,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(p!==dist&&!p.startsWith(dist+sep))throw Error('Outside root');if((await stat(p)).isDirectory())p=join(p,'index.html');res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER_PATH?{executablePath:process.env.STUDIO_BROWSER_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({reducedMotion:'reduce'});
await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,value)=>{assert(value,name);checks.push(name);};
const rgb=h=>`rgb(${[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(', ')})`;
try {
 await page.goto(origin+'/?attention-qa=1');
 await page.locator('[data-do="explore"]').click();
 for(const [width,height] of [[1200,900],[390,844]]) {
  await page.setViewportSize({width,height});
  check('seven nodes '+width,await page.locator('.st-node').count()===7);
  for(const n of palette.nodes) {
   await page.locator(`[data-do="node:${n.appId}"]`).click();
   const actual=await page.evaluate(()=>{
    const el=document.querySelector('.studio'),s=getComputedStyle(el),card=document.querySelector('.st-world-card');
    return {accent:s.getPropertyValue('--accent').trim().toUpperCase(),border:getComputedStyle(card).borderTopColor,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   check(n.id+' chapter identity '+width,actual.accent===n.identity);
   check(n.id+' card accent '+width,actual.border===rgb(n.identity));
   check(n.id+' no horizontal overflow '+width,!actual.overflow);
   for(const expected of palette.nodes) {
    const v=await page.locator(`[data-do="node:${expected.appId}"] > span`).evaluate(el=>{const s=getComputedStyle(el);return {fill:s.backgroundColor,ink:s.color};});
    check(n.id+' selection retains '+expected.id+' identity '+width,v.fill===rgb(expected.identity));
    check(n.id+' selection retains '+expected.id+' navy label '+width,v.ink===rgb(palette.brand.ink));
   }
   await page.locator('.studio').screenshot({path:join(output,`palette-${width>720?'desktop':'mobile'}-${n.appId}.png`)});
  }
 }
 check('no uncaught errors',errors.length===0);
 await writeFile(join(output,'palette-results.json'),JSON.stringify({version:palette.version,passed:checks.length,checks,errors},null,2));
 console.log(JSON.stringify({passed:checks.length,errors,output}));
} finally {await context.close();await browser.close();await new Promise(r=>server.close(r));}
