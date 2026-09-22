// Real browser verification of the built app. Test data and the accelerated clock
// exist only in this script; no fixture route or bypass is shipped in the UI.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'dist');
const output = resolve(process.env.OUTPUT_DIR || join(app, 'studio-review'));
await mkdir(output, { recursive: true });
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(dist, '.' + pathname);
    if (path !== dist && !path.startsWith(dist + sep)) throw Error('Outside build');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless:true, ...(process.env.STUDIO_BROWSER_PATH ? { executablePath:process.env.STUDIO_BROWSER_PATH } : {}), args:['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport:{width:1200,height:900}, reducedMotion:'reduce' });
// No external model, tracking, image or sound request is needed for this review.
await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = []; const checks = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept());
const check = (name, value) => { assert(value, name); checks.push(name); };
const action = async name => page.locator(`[data-do="${name}"]`).first().click();
const screen = async name => page.locator(`.studio[data-screen="${name}"]`).waitFor();
const sizes = [[1200,900],[1440,1000],[900,700],[390,844],[375,667],[320,568],[430,932],[844,390]];
async function layout(name, shots=true) {
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    await page.locator('.st-main').evaluate(e=>{e.scrollTop=0;});
    const v = await page.evaluate(() => {
      const shell=document.querySelector('.studio'); const r=shell.getBoundingClientRect();
      const m=document.querySelector('.st-main');
      const buttons=[...document.querySelectorAll('.st-actions > button,.st-actions > a')].filter(e=>e.getBoundingClientRect().height);
      return { width:r.width,height:r.height,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,innerOverflow:m.scrollWidth>m.clientWidth+1,
        footerFits:buttons.every(e=>{const b=e.getBoundingClientRect();return b.left>=r.left-1 && b.right<=r.right+1 && b.top>=r.top && b.bottom<=r.bottom+1 && b.bottom<=innerHeight+1;}),
        shortHeadlines:[...document.querySelectorAll('.st-main h2')].every(e=>e.textContent.length<100) };
    });
    check(`${name}: no page overflow ${width}x${height}`, !v.pageOverflow);
    check(`${name}: no inner horizontal overflow ${width}x${height}`, !v.innerOverflow);
    check(`${name}: action footer reachable ${width}x${height}`, v.footerFits);
    check(`${name}: short headline ${width}x${height}`, v.shortHeadlines);
    if(width>720)check(`${name}: desktop square ${width}x${height}`,Math.abs(v.width-v.height)<1);
    else check(`${name}: full phone viewport ${width}x${height}`, Math.abs(v.width-width)<1 && Math.abs(v.height-height)<1);
    if(shots && width===1200) await page.locator('.studio').screenshot({path:join(output,`desktop-${name}.png`)});
    if(shots && width===390) await page.screenshot({path:join(output,`mobile-${name}.png`)});
  }
  await page.setViewportSize({width:1200,height:900});
}
// Controls stay in one location throughout a trial, including pause/feedback.
const controlPositions = new Map();
const checkedStages = new Set();
async function responseLayout(stage, enabled) {
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    const result = await page.evaluate(() => {
      const controls=[...document.querySelectorAll('.attention-response [data-relation]')];
      const host=document.querySelector('#studio-game-host').getBoundingClientRect();
      const feedback=document.querySelector('.attention-feedback')?.getBoundingClientRect();
      return controls.map(button=>{
        const r=button.getBoundingClientRect(), style=getComputedStyle(button);
        const topElement=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return {left:r.left,top:r.top,width:r.width,height:r.height,disabled:button.disabled,
          visible:style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0,
          fits:r.left>=host.left-1&&r.right<=host.right+1&&r.top>=host.top-1&&r.bottom<=host.bottom+1&&r.bottom<=innerHeight+1,
          unobscured:topElement===button||button.contains(topElement),
          feedbackClear:!feedback||feedback.bottom<=r.top};
      });
    });
    check(`${stage}: both response controls present ${width}x${height}`,result.length===2);
    check(`${stage}: both response controls visible/reachable ${width}x${height}`,result.every(b=>b.visible&&b.fits&&b.unobscured&&b.height>=44));
    check(`${stage}: response availability follows timing ${width}x${height}`,result.every(b=>b.disabled===!enabled));
    check(`${stage}: feedback does not cover responses ${width}x${height}`,result.every(b=>b.feedbackClear));
    const key=`${width}x${height}`,old=controlPositions.get(key);
    if(old)check(`${stage}: no moving response targets ${key}`,result.every((b,i)=>['left','top','width','height'].every(k=>Math.abs(b[k]-old[i][k])<1)));
    else controlPositions.set(key,result);
    if(stage==='stimulus'&&width===1200)await page.locator('.studio').screenshot({path:join(output,'desktop-persistent-controls.png')});
    if(stage==='stimulus'&&width===390)await page.screenshot({path:join(output,'mobile-persistent-controls.png')});
  }
  await page.setViewportSize({width:1200,height:900});
}
try {
  await page.goto(origin+'/?attention-qa=1'); await screen('welcome');
  await page.evaluate(async()=>{const image=new Image();image.src='/art/signal-waves.svg';await image.decode();});
  await layout('welcome');
  await action('begin'); await screen('chapter'); await layout('chapter');
  await action('chapter-begin'); await screen('briefing'); await layout('briefing');
  // Freeze and advance the task clock, not the production task implementation.
  const time=new Date('2026-09-22T12:00:00Z');
  await page.clock.install({time}); await page.clock.pauseAt(time);
  await action('start'); await screen('training');
  check('global navigation hidden during training', await page.locator('.st-nav').count()===0);
  await responseLayout('ready',false);checkedStages.add('ready');
  await action('pause');check('task pauses', await page.getByText('Paused',{exact:true}).isVisible());
  await responseLayout('paused',false);
  await action('pause');
  let iterations=0, responses=0, captured=false, checkedPauseDuringResponse=false;
  while(await page.locator('[data-screen="training"]').count()) {
    assert(++iterations<2000,'QA session must finish');
    const stage=await page.locator('.attention-task-stage').getAttribute('class');
    const name=stage.split('is-')[1];
    if(!checkedStages.has(name)) {
      await responseLayout(name,name==='response');checkedStages.add(name);
      if(name!=='response') {
        await page.locator('[data-relation]').first().evaluate(el=>el.click());
        await page.keyboard.press('f');
        check(`${name}: premature/repeated responses ignored`,await page.locator('.attention-task-stage').getAttribute('class')===stage);
      }
    }
    const response=page.locator('[data-relation]:enabled');
    if(await response.count()) {
      if(!checkedPauseDuringResponse) {
        checkedPauseDuringResponse=true;
        await action('pause');await responseLayout('paused-from-response',false);
        await page.keyboard.press('f');await page.keyboard.press('j');await page.clock.runFor(100);
        check('paused response window rejects keyboard input',await page.locator('.attention-task-stage.is-paused').count()===1);
        await action('pause');continue;
      }
      await page.clock.runFor(200);
      await response.nth(responses++%2).click();
    } else {
      if(!captured && await page.locator('.attention-task-stage.is-stimulus').count()) {
        captured=true;await page.locator('.studio').screenshot({path:join(output,'desktop-training.png')});
      }
      await page.clock.runFor(100);
    }
  }
  await screen('result');
  check('completed actual QA runtime',responses===24);
  check('all trial stages retain response controls',['ready','fixation','stimulus','mask','response','feedback'].every(s=>checkedStages.has(s)));
  const receipts=await page.evaluate(()=>JSON.parse(localStorage.getItem('iqm-platform:studio:v1:qa-preview')).receipts);
  check('one real session receipt, no invented metric fixture', receipts.length===1 && receipts[0].summary.validTrials===24);
  await layout('result');
  await action('move');await screen('move');await layout('move');
  await action('examples');await screen('examples');await layout('example');
  while(await page.locator('[data-do="example-next"]').count())await action('example-next');
  await action('strategy-done');await screen('contexts');await layout('contexts');
  await action('context:work');await screen('scenario');
  for(const id of ['a','c','d'])await action('evidence:'+id);
  await action('check-case');check('context relevance exercise scores correctly',await page.getByText('You selected the relevant information.',{exact:true}).isVisible());
  await layout('scenario');
  await action('contexts');await action('context:ai');await screen('ai');await layout('ai-human');
  for(const id of ['a','c','e'])await page.locator(`[data-list="human"][data-signal-id="${id}"]`).click();
  await page.locator('[data-ai-action="show-ai"]').click();
  for(const id of ['b','c'])await page.locator(`[data-list="review"][data-signal-id="${id}"]`).click();
  await page.locator('[data-ai-action="review"]').click();
  await page.locator('[data-ai-action="start-check"]').click();
  for(const id of ['a','c','d'])await page.locator(`[data-list="check"][data-signal-id="${id}"]`).click();
  await page.locator('[data-ai-action="finish"]').click();
  check('AI exercise reaches unaided outcome',await page.getByText(/INDEPENDENT CHECK/).count()>0);
  await action('mission');await screen('mission');
  await page.locator('[name="context"]').fill('One focused research task');
  await page.locator('[name="goal"]').fill('Choose the result that answers my question');
  await page.locator('[name="prediction"]').fill('I expect to find the useful comparison before opening another source.');
  await layout('mission-goal');
  await page.locator('[form="studio-mission"]').click();
  await page.locator('[name="policy"]').fill('Restate the question and highlight the result that could change my conclusion.');
  await page.locator('[name="nicheNote"]').fill('Keep the question visible; mute one notification.');
  await layout('mission-action');
  await page.locator('[form="studio-mission"]').click();await screen('mission-saved');await layout('mission-saved');
  await action('home');await screen('home');
  check('future mission does not force immediate feedback', !(await page.locator('.st-next-card').innerText()).includes('Review your mission'));
  await layout('home');
  await page.locator('[data-do^="review:"]').click();await screen('checkin');
  await page.locator('[name="opportunity"]').selectOption('no');await page.locator('[form="studio-checkin"]').click();await screen('home');
  check('no opportunity is not treated as failure',await page.getByText(/No opportunity is not a failure/).isVisible());
  await page.locator('[data-do^="review:"]').click();await screen('checkin');
  await page.locator('[name="opportunity"]').selectOption('yes');await page.locator('[name="use"]').selectOption('partly');
  await layout('checkin');
  await page.locator('[form="studio-checkin"]').click();
  await page.locator('[name="effect"]').selectOption('no-clear-difference');
  await page.locator('[name="environment"]').selectOption('yes');
  await page.locator('[name="barrier"]').selectOption('environment-got-in-way');
  await page.locator('[name="note"]').fill('A useful cue, but the result was uncertain. Test again in a quieter setting.');
  await page.locator('[form="studio-checkin"]').click();await screen('bank');await layout('bank');
  check('uncertain result remains provisional',await page.getByText(/The outcome was uncertain/).isVisible());
  await page.locator('[form="studio-bank"]').click();await screen('rules');await layout('rules');
  const rulesBefore=await page.evaluate(()=>localStorage.getItem('iqm-platform:banked-rules:v1:qa-preview:attention'));
  check('rule saved in existing namespace',JSON.parse(rulesBefore).length===1);
  await action('network');await screen('network');
  check('seven indexed nodes',await page.locator('.st-node').count()===7);
  await layout('network');
  for(const n of ['attention','relational-memory','binding-memory','path-horizon','knowledge-access','generative-search','reasoning']){
    await action('node:'+n);
    check('node palette selection '+n,await page.locator('.studio').getAttribute('data-node')===n);
    if(n!=='attention')check('no false training launch for unavailable node '+n,await page.locator('.st-world-card [data-do="chapter"]').count()===0);
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:join(output,`world-${n}.png`)});
  }
  await action('node:attention');await action('home');await page.reload();await screen('home');
  check('saved learning survives reload',await page.evaluate(()=>localStorage.getItem('iqm-platform:banked-rules:v1:qa-preview:attention'))===rulesBefore);
  await action('more');await screen('more');await layout('more');
  // Asset failure must leave a readable and actionable screen.
  await context.route('**/art/**',route=>route.abort());
  await action('chapter');await screen('chapter');check('chapter action survives artwork failure',await page.getByRole('button',{name:'Begin the chapter'}).isVisible());
  check('no uncaught browser errors',errors.length===0);
  await writeFile(join(output,'qa-results.json'),JSON.stringify({passed:checks.length,checks,errors,screenshots:'Actual built application; QA interactions and clock only. Not participant data or evidence of efficacy.'},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,output}));
} finally {
  await context.close();await browser.close();await new Promise(r=>server.close(r));
}
