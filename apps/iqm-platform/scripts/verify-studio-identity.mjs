import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const app=resolve(dirname(fileURLToPath(import.meta.url)),'..'), dist=join(app,'dist');
const output=resolve(process.env.OUTPUT_DIR||join(app,'studio-review'));
await mkdir(output,{recursive:true});
const palette=JSON.parse(await readFile(join(app,'src/theme/synergy-node-palette.json'),'utf8'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{let f=resolve(dist,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(f!==dist&&!f.startsWith(dist+sep))throw Error('outside build');if((await stat(f)).isDirectory())f=join(f,'index.html');res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream'});res.end(await readFile(f));}catch{res.writeHead(404);res.end('not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER_PATH?{executablePath:process.env.STUDIO_BROWSER_PATH}:{}),args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});
await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
const page=await context.newPage(), checks=[], errors=[];
page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
const check=(name,ok)=>{assert(ok,name);checks.push(name);};
const action=async id=>{await page.locator(`[data-do="${id}"]`).first().click();await page.locator('.studio[data-identity-ready="true"]').waitFor();};
const sizes=[[1200,900],[1440,1000],[900,700],[390,844],[375,667],[320,568],[430,932],[844,390]];
async function inspect(label,nodeBand) {
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.locator('.st-main').evaluate(e=>e.scrollTop=0);
    const details=await page.evaluate(()=>{
      const s=document.querySelector('.studio'),r=s.getBoundingClientRect(),m=document.querySelector('.st-main'),bar=document.querySelector('.st-topbar');
      const band=document.querySelector('.st-node-identity'),brand=document.querySelector('.st-brand');
      const a=brand.getBoundingClientRect(),context=document.querySelector('.st-top-context'),c=context.getBoundingClientRect();
      return {dots:[...document.querySelectorAll('.st-brand .st-collection-mark circle')].map(x=>x.getAttribute('fill')),bandCount:document.querySelectorAll('.st-node-identity').length,
        title:band?.querySelector('.st-node-title')?.textContent,number:band?.querySelector('.st-node-number')?.textContent,tagline:band?.querySelector('.st-node-tagline')?.textContent,
        target:!!band?.querySelector('[data-capacity-icon="attention"]'),
        bodyFits:document.documentElement.scrollWidth<=innerWidth+1&&m.scrollWidth<=m.clientWidth+1,
        headerFits:bar.scrollWidth<=bar.clientWidth+1&&(c.width===0||a.right<=c.left+1),
        bandFits:!band||band.scrollWidth<=band.clientWidth+1,
        footerFits:[...document.querySelectorAll('.st-actions>button,.st-actions>a')].every(x=>{const b=x.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.bottom<=r.bottom+1;}),
        compactTarget:!!document.querySelector('.st-training-node [data-capacity-icon="attention"]'),
        trainingTitle:document.querySelector('.st-training-node strong')?.textContent,
      };
    });
    check(`${label} ${width}: exactly seven brand dots`,details.dots.length===7);
    check(`${label} ${width}: exact approved dot order`,JSON.stringify(details.dots)===JSON.stringify(palette.nodes.map(n=>n.identity)));
    check(`${label} ${width}: one appropriate node band`,details.bandCount===(nodeBand?1:0));
    check(`${label} ${width}: content fits`,details.bodyFits);
    check(`${label} ${width}: brand and context fit`,details.headerFits);
    check(`${label} ${width}: node identity fits`,details.bandFits);
    check(`${label} ${width}: actions reachable`,details.footerFits);
    if(nodeBand){check(`${label} ${width}: full capacity name`,details.title==='Attention Control');check(`${label} ${width}: Node 01`,details.number==='Node 01');check(`${label} ${width}: approved tagline`,details.tagline==='Find the signal.');check(`${label} ${width}: target not arrow`,details.target);}
    if(label==='training')check(`${label} ${width}: compact named capacity`,details.trainingTitle==='Attention Control'&&details.compactTarget);
    if(width===1200||width===390)await page.locator('.studio').screenshot({path:join(output,`identity-${width===1200?'desktop':'mobile'}-${label}.png`)});
  }
  await page.setViewportSize({width:1200,height:900});
}
try{
  await page.goto(origin+'/?attention-qa=1');await page.locator('.studio[data-identity-ready="true"]').waitFor();
  await inspect('welcome',false);
  await action('begin');await inspect('node-introduction',true);
  check('node CTA replaces chapter',await page.locator('[data-do="chapter-begin"]').innerText()==='Begin the node');
  await action('chapter-begin');await action('home');await inspect('home',true);
  check('home card has node number',/Node 01/.test(await page.locator('.st-card-overline').innerText()));
  check('home does not present chapter as capacity label',!(/\bchapter\b/i.test(await page.locator('.studio').innerText())));
  await action('network');await inspect('network',false);
  for(const n of palette.nodes){
    await action('node:'+n.appId);
    check(`${n.title}: collection mark unchanged`,(await page.locator('.st-collection-mark circle').count())===7);
    check(`${n.title}: selected glyph matches node`,await page.locator(`.st-node.is-selected [data-capacity-icon="${n.appId}"]`).count()===1);
    const accent=await page.locator('.studio').evaluate(e=>getComputedStyle(e).getPropertyValue('--accent').trim().toUpperCase());
    check(`${n.title}: approved selected identity`,accent===n.identity);
  }
  await action('node:attention');await action('home');await action('more');await inspect('tools',true);
  check('replay is now a node introduction',await page.locator('[data-do="chapter"]').innerText().then(t=>t.includes('Replay node introduction')));
  await action('briefing');await inspect('briefing',true);
  check('actual instructional renderer retained',await page.locator('.st-attention-example svg').count()>0);
  await action('start');await inspect('training',false);
  check('no uncaught errors',errors.length===0);
  await writeFile(join(output,'identity-review.json'),JSON.stringify({checks:checks.length,errors,assertions:checks},null,2));
  console.log(`${checks.length} identity assertions passed; ${errors.length} browser errors.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
