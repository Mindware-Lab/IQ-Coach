// Verify the actual website-aligned presentation, not a generated mock-up.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const app=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dist=join(app,'dist');
const output=resolve(process.env.OUTPUT_DIR||join(app,'studio-review'));
await mkdir(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{try{
  let p=resolve(dist,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(p!==dist&&!p.startsWith(dist+sep))throw Error('Outside build');
  if((await stat(p)).isDirectory())p=join(p,'index.html');
  res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(await readFile(p));
}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER_PATH?{executablePath:process.env.STUDIO_BROWSER_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});
await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
const page=await context.newPage(),checks=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,value)=>{assert(value,name);checks.push(name);};
const act=async(name)=>page.locator(`[data-do="${name}"]`).first().click();
const at=async(name)=>page.locator(`.studio[data-screen="${name}"]`).waitFor();
const sizes=[[1200,900],[900,700],[390,844],[375,667],[320,568],[430,932],[844,390]];
const luminance=rgb=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(hi+.05)/(lo+.05);};
async function inspect(name,expected){
 await at(name);await page.locator('.st-main h2[data-brand-heading]').first().waitFor();
 const text=await page.locator('.st-main h2').first().textContent();check(name+': exact title wording',text===expected);
 const style=await page.locator('.st-main h2').first().evaluate(e=>({family:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight,accent:!!e.querySelector('.st-heading-accent'),gradient:e.querySelector('.st-heading-accent')?getComputedStyle(e.querySelector('.st-heading-accent')).backgroundImage:''}));
 check(name+': website display font stack',style.family.startsWith('ui-rounded')&&style.family.includes('Trebuchet MS'));
 check(name+': display weight',Number(style.weight)===850);
 check(name+': deliberate coloured phrase',style.accent&&style.gradient.includes('linear-gradient'));
 for(const [width,height]of sizes){
   await page.setViewportSize({width,height});
   await page.locator('.st-main').evaluate(e=>e.scrollTop=0);
   const layout=await page.evaluate(()=>{
     const shell=document.querySelector('.studio').getBoundingClientRect(),main=document.querySelector('.st-main');
     const buttons=[...document.querySelectorAll('.st-actions>button,.st-actions>a')];
     const accent=document.querySelector('.st-main h2 .st-heading-accent');
     return{overflow:document.documentElement.scrollWidth>innerWidth+1||main.scrollWidth>main.clientWidth+1,
       footer:buttons.every(e=>{const b=e.getBoundingClientRect();return b.x>=shell.x-1&&b.right<=shell.right+1&&b.bottom<=shell.bottom+1&&b.bottom<=innerHeight+1;}),
       text:accent.getBoundingClientRect().width>0};
   });
   check(`${name}: no overflow ${width}x${height}`,!layout.overflow);
   check(`${name}: action reachable ${width}x${height}`,layout.footer);
   check(`${name}: accent visible ${width}x${height}`,layout.text);
   if(width===1200)await page.locator('.studio').screenshot({path:join(output,`brand-desktop-${name}.png`)});
   if(width===390)await page.screenshot({path:join(output,`brand-mobile-${name}.png`)});
 }
 await page.setViewportSize({width:1200,height:900});
}
try{
 await page.goto(origin+'/?attention-qa=1');
 await inspect('welcome','Navigate possibility. Build intelligence.');
 check('welcome: second brand line separated',await page.locator('h2 .st-heading-line').count()===1);
 check('welcome: white primary action',await page.locator('.st-actions .st-button').first().evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(255, 255, 255)'));
 await act('begin');await inspect('chapter','What matters now?');
 const buttonStyle=await page.locator('.st-actions .st-button').first().evaluate(e=>({image:getComputedStyle(e).backgroundImage,colour:getComputedStyle(e).color}));
 check('chapter: lighter blue/cyan action',buttonStyle.image.includes('rgb(34, 170, 255)')&&buttonStyle.image.includes('rgb(94, 219, 250)'));
 check('chapter: readable navy action label',buttonStyle.colour==='rgb(10, 37, 80)');
 check('button text contrast throughout gradient',contrast([34,170,255],[10,37,80])>=4.5&&contrast([94,219,250],[10,37,80])>=4.5);
 check('white button contrast',contrast([255,255,255],[14,84,139])>=4.5);
 check('large light-surface heading contrast',[[11,127,238],[19,143,205],[70,156,38]].every(c=>contrast(c,[255,255,255])>=3));
 await act('chapter-begin');await inspect('briefing','Find the signal.');
 check('actual instruction renderer retained',await page.locator('.st-briefing-visual .stimulus-svg').count()>0);
 await act('home');await inspect('home','Your next move.');
 await act('network');await inspect('network','Your thinking network.');
 await act('node:relational-memory');
 check('violet node remains violet',await page.locator('.st-world-card .st-heading-accent').evaluate(e=>getComputedStyle(e).backgroundImage.includes('rgb(101, 64, 198)')));
 await act('node:attention');await act('more');await inspect('more','Keep the useful things close.');
 await act('contexts');await inspect('contexts','Try it here.');
 await act('context:ai');await at('ai');
 await page.locator('.st-ai h2[data-brand-heading]').waitFor();
 check('separately mounted AI exercise receives title styling',await page.locator('.st-ai h2 .st-heading-accent').count()===1);
 await act('mission');await inspect('mission','Choose something that matters.');
 // Forced-colour fallback must not leave transparent text or invisible controls.
 await page.emulateMedia({forcedColors:'active'});
 const forced=await page.locator('.st-main h2 .st-heading-accent').evaluate(e=>({fill:getComputedStyle(e).webkitTextFillColor,bg:getComputedStyle(e).backgroundImage}));
 check('forced-colour heading has opaque fallback',forced.fill!=='rgba(0, 0, 0, 0)'&&forced.fill!=='transparent'&&forced.bg==='none');
 await page.emulateMedia({forcedColors:'none',reducedMotion:'reduce'});
 check('reduced motion suppresses title entrance',await page.locator('.st-main h2').evaluate(e=>getComputedStyle(e).animationName==='none'));
 await act('home');await act('more');await act('briefing');
 await page.clock.install({time:new Date('2026-09-22T12:00:00Z')});await page.clock.pauseAt(new Date('2026-09-22T12:00:00Z'));
 await act('start');await at('training');
 check('active game not decorated',await page.locator('.st-training .st-heading-accent,.st-training [data-brand-heading]').count()===0);
 check('persistent controls remain present',await page.locator('[data-relation]').count()===2);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:join(output,'brand-mobile-game.png')});
 check('no uncaught browser errors',errors.length===0);
 await writeFile(join(output,'brand-qa-results.json'),JSON.stringify({passed:checks.length,checks,errors},null,2));
 console.log(JSON.stringify({passed:checks.length,errors,output}));
}finally{await context.close();await browser.close();await new Promise(r=>server.close(r));}
