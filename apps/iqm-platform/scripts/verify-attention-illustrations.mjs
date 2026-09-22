// Read the real built UI. Seeded progress exists only in this test, never in the app.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'dist');
const output = resolve(process.env.OUTPUT_DIR || join(app, 'studio-review'));
await mkdir(output, {recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server = createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let path = resolve(dist, '.'+pathname);
    if(path!==dist && !path.startsWith(dist+sep))throw Error('Outside build');
    if((await stat(path)).isDirectory())path=join(path,'index.html');
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});
    res.end(await readFile(path));
  } catch {res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_BROWSER_PATH?{executablePath:process.env.STUDIO_BROWSER_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const checks=[],errors=[];
const check=(name,ok)=>{assert(ok,name);checks.push(name);};
const sizes=[[1200,900],[1440,1000],[900,700],[390,844],[375,667],[320,568],[430,932],[844,390]];
const cases=[['A',0,'A_TRAIN',true],['B',1,'A_TRAIN',true],['C',3,'A_TRAIN',true],['AB_MIXED',8,'AB_MIXED',false]];
try {
  for(const [mode,total,phase,qa] of cases){
    const context=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});
    await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    await context.addInitScript(({total,phase,qa})=>{
      const user=qa?'qa-preview':'local-preview';
      localStorage.setItem(`iqm-platform:studio:v1:${user}`,JSON.stringify({version:1,welcomeSeen:true,lastNode:'attention',receipts:[],skippedBanks:[]}));
      localStorage.setItem(`iqm-platform:chapter-seen:v1:${user}:attention`,'seen');
      localStorage.setItem(`iqm-platform:node-progress:v1:${user}:attention`,JSON.stringify({phase,sessionsInPhase:0,totalSessions:total,aScores:[],bScores:[],aReopenScores:[]}));
    },{total,phase,qa});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+(qa?'/?attention-qa=1':'/'));
    await page.locator('[data-do="more"]').click();
    await page.locator('[data-do="briefing"]').click();
    await page.locator('.studio[data-screen="briefing"]').waitFor();
    check(`${mode}: expected preview count`,await page.locator('[data-attention-example]').count()===(mode==='AB_MIXED'?2:1));
    for(const [width,height] of sizes){
      await page.setViewportSize({width,height});
      await page.locator('.st-main').evaluate(e=>{e.scrollTop=0;});
      const figures=await page.locator('[data-attention-example]').evaluateAll(elements=>elements.map(el=>{
        const svg=el.querySelector('svg');const box=svg.getBoundingClientRect();
        const center=new DOMPoint(50,50).matrixTransform(svg.getCTM());
        const arrows=[...el.querySelectorAll('.stimulus-arrows > g')].map(g=>{
          const m=g.getCTM(),p=new DOMPoint(0,0).matrixTransform(m),tip=new DOMPoint(5,0).matrixTransform(m);
          const rx=p.x-center.x,ry=p.y-center.y,dx=tip.x-p.x,dy=tip.y-p.y;
          return {cross:Math.abs(rx*dy-ry*dx)/(Math.hypot(rx,ry)*Math.hypot(dx,dy)),out:rx*dx+ry*dy>0};
        });
        const patches=[...el.querySelectorAll('.optic-dot-group')].map(g=>[...g.querySelectorAll('.optic-dot')].map(dot=>{
          const xs=dot.querySelector('animate[attributeName="cx"]').getAttribute('values').split(';').map(Number);
          const ys=dot.querySelector('animate[attributeName="cy"]').getAttribute('values').split(';').map(Number);
          const rx=Number(dot.getAttribute('cx'))-50,ry=Number(dot.getAttribute('cy'))-50,dx=xs[1]-xs[0],dy=ys[1]-ys[0];
          return {cross:Math.abs(rx*dy-ry*dx)/(Math.hypot(rx,ry)*Math.hypot(dx,dy)),out:rx*dx+ry*dy>0};
        }));
        return {wrapper:el.dataset.attentionExample,answer:el.dataset.exampleAnswer,caption:el.querySelector('figcaption strong').textContent,arrows,patches,width:box.width,height:box.height,face:!!el.querySelector('img.emotion-face')};
      }));
      for(const f of figures){
        const label=`${mode}/${f.wrapper} ${width}x${height}`;
        check(`${label}: no SVG squashing`,Math.abs(f.width-f.height)<1 && f.width>=100);
        let out;
        if(f.wrapper==='B'){
          check(`${label}: five motion patches`,f.patches.length===5 && f.arrows.length===0);
          check(`${label}: all motion is radial`,f.patches.every(p=>p.length===16&&p.every(d=>d.cross<.01&&d.out===p[0].out)));
          out=f.patches.filter(p=>p[0].out).length;
        }else{
          check(`${label}: five actual arrows`,f.arrows.length===5 && f.patches.length===0);
          check(`${label}: every arrow points IN or OUT`,f.arrows.every(a=>a.cross<.00001));
          out=f.arrows.filter(a=>a.out).length;
          if(f.wrapper==='C')check(`${label}: emotional wrapper retains face layer`,f.face);
        }
        check(`${label}: caption matches visible majority`,f.caption===`${out} OUT · ${5-out} IN — answer: ${out>2?'OUT':'IN'}`);
      }
      check(`${mode} ${width}x${height}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector('.st-main').scrollWidth<=document.querySelector('.st-main').clientWidth+1));
      const button=await page.locator('[data-do="start"]').boundingBox();
      check(`${mode} ${width}x${height}: start action reachable`,!!button&&button.y>=0&&button.y+button.height<=height+1);
      // The C face request is deliberately blocked with all other external resources.
      // Record A/B as review screenshots; C is checked structurally, not presented as full artwork.
      if(mode==='A'||mode==='B'){
        if(width===1200)await page.locator('.studio').screenshot({path:join(output,`desktop-instruction-${mode}.png`)});
        if(width===390){await page.locator('[data-attention-example]').first().scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`mobile-instruction-${mode}.png`)});}
      }
    }
    await context.close();
  }
  check('no uncaught page errors',errors.length===0);
  await writeFile(join(output,'instruction-audit.json'),JSON.stringify({passed:checks.length,checks,errors,note:'Built app geometry checks. Seeded progress is test-only. No participant or efficacy data.'},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,output}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
