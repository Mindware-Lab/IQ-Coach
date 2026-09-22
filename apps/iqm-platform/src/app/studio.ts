import {currentPlatformUser,isPlatformAuthConfigured,onPlatformAuthChange,sendPlatformSignInLink,signOutPlatformUser,type PlatformAuthUser} from '../core/auth/client';
import {loadCurrentUserEntitlements} from '../core/entitlements/repository';
import {unlockedNodeIds} from '../core/entitlements/store';
import {loadBrowserNodeProgress,saveBrowserNodeProgress} from '../core/persistence/progress';
import {loadBrowserMissions,saveBrowserMission,loadBrowserMissionCheckins,saveBrowserMissionCheckin} from '../core/persistence/missions';
import {loadBrowserStrategyStatus,saveBrowserStrategyStatus} from '../core/persistence/strategy';
import {hasSeenNodeChapter,markNodeChapterSeen,markPlatformOrientationSeen,loadBrowserBankedRules,saveBrowserBankedRule} from '../core/persistence/journey';
import {recordProgressionSession} from '../core/progression/engine';
import {wrapperModeForPhase} from '../core/progression/session';
import {getNodeModule,isNodeModuleRegistered} from '../modules/registry';
import {mountAttentionAiPractice} from '../modules/attention/aiPracticeView';
import type {NodeId,IQMNodeModule} from '../types/node';
import type {GameAdapter,TrainingSummary,WrapperMode} from '../types/game';
import type {WrapperProgressionState} from '../types/progression';
import type {MissionCheckin,NicheChangeType,StrategyUse,MissionEffect,EnvironmentHelp,MissionBarrier} from '../types/mission';
import type {BankedRule} from '../types/learning';
import {NODE_ORDER,NODE_WORLDS,QA_WRAPPERS,CONTEXT_CASES,trainingBeat,nextMove,practiceScore,readDisplayState,initialDisplayState,type StudioScreen,type StudioMission,type DisplayState,type SessionReceipt} from './studioModel';

const escape=(v:unknown):string=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const id=(prefix:string)=>`${prefix}-${crypto.randomUUID()}`;
const ICONS:Record<string,string>={
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',back:'<path d="M19 12H5m6-6-6 6 6 6"/>',home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',network:'<circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 7 3 3m4 0 3-3M7 17l3-3m4 0 3 3"/>',book:'<path d="M12 5c-3-2-6-2-9-1v15c4-1 6 0 9 2 3-2 6-3 9-2V4c-3-1-6-1-9 1v16"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',signal:'<path d="M12 20V4m-6 6 6-6 6 6"/><circle cx="12" cy="12" r="10"/>',relations:'<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 8-4 7m8-7 4 7M8 18h8"/>',binding:'<rect x="3" y="3" width="12" height="12" rx="4"/><rect x="9" y="9" width="12" height="12" rx="4"/>',path:'<path d="M4 20v-5h6v-5h7V4m-4 3 4-4 4 4"/>',leaf:'<path d="M4 20C18 20 22 10 20 3 10 1 2 6 4 20zm0 0L16 8"/>',reason:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',check:'<path d="m5 12 4 4L19 6"/>',pause:'<path d="M8 5v14M16 5v14"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',outside:'<path d="M7 17 19 5M9 5h10v10M5 9H3v12h12v-2"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',plus:'<path d="M12 4v16M4 12h16"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m8 11 3 3 5-5"/>'};
const icon=(name:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.signal}</svg>`;
const button=(label:string,action:string,secondary=false)=>`<button type="button" class="st-button ${secondary?'st-button-secondary':''}" data-do="${escape(action)}">${escape(label)}${icon('arrow')}</button>`;
const art=(node:NodeId,extra='')=>`<div class="st-art ${extra}" style="--art-x:${NODE_WORLDS[node].art*100/6}%" aria-hidden="true"></div>`;
const KINDS:Record<NicheChangeType,string>={cue:'Make the cue visible',workflow:'Change the order of work','protected-time':'Protect a short block of time','reduce-interference':'Remove one distraction','resource-visibility':'Keep the needed information visible',scheduling:'Choose a better time',feedback:'Make the outcome easier to check','tool-interface':'Change a tool or notification setting',none:'No change needed'};
const options=(rows:[string,string][],selected='')=>rows.map(([v,l])=>`<option value="${escape(v)}" ${v===selected?'selected':''}>${escape(l)}</option>`).join('');
const input=(label:string,name:string,value='',placeholder='',required=true)=>`<label class="st-field"><span>${escape(label)}</span><input name="${name}" value="${escape(value)}" placeholder="${escape(placeholder)}" maxlength="240" ${required?'required':''}/></label>`;
const area=(label:string,name:string,value='',placeholder='',required=false)=>`<label class="st-field"><span>${escape(label)}</span><textarea name="${name}" rows="2" maxlength="400" placeholder="${escape(placeholder)}" ${required?'required':''}>${escape(value)}</textarea></label>`;
const select=(label:string,name:string,rows:[string,string][],selected='',required=true)=>`<label class="st-field"><span>${escape(label)}</span><select name="${name}" ${required?'required':''}>${options([['','Choose…'],...rows],selected)}</select></label>`;
const defaultProgress=():WrapperProgressionState=>({phase:'A_BASELINE',sessionsInPhase:0,totalSessions:0,aScores:[],bScores:[],aReopenScores:[]});

export async function bootstrapStudio(root:HTMLElement):Promise<()=>void> {
  const query=new URLSearchParams(location.search);
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  // Preserve the existing test-branch access contract; this is not a production entitlement path.
  const qa=query.has('attention-qa')||import.meta.env.VITE_IQM_ATTENTION_QA==='true';
  const qaAccess=query.has('attention-qa')||import.meta.env.VITE_IQM_QA_ACCESS==='true';
  const preview=qaAccess||(!isPlatformAuthConfigured&&local);
  let user:PlatformAuthUser|null=null, unlocked=new Set<NodeId>(preview?['attention']:[]);
  let screen:StudioScreen='welcome', node:NodeId='attention', page=0, missionId='', notice='', storageIssue=false;
  let display:DisplayState=initialDisplayState(), game:GameAdapter|null=null, cleanup:(()=>void)|null=null, paused=false, disposed=false;
  let selectedCase=0, choice=new Set<string>(), caseChecked=false;
  let draft:Record<string,string>={}, checkDraft:Record<string,string>={}, busy=false;
  const memory=new Map<string,unknown>();
  const userKey=()=>user?.id??(qaAccess?'qa-preview':'local-preview');
  const displayKey=()=>`iqm-platform:studio:v1:${userKey()}`;
  const read=<T>(key:string,fn:()=>T,fallback:T):T=>{
    const scoped=`${userKey()}:${key}`;
    if(memory.has(scoped))return memory.get(scoped) as T;
    try{return fn();}catch{storageIssue=true;return fallback;}
  };
  const write=<T>(key:string,value:T,fn:()=>unknown)=>{
    memory.set(`${userKey()}:${key}`,value);
    try{fn();}catch{storageIssue=true;}
  };
  const persistDisplay=()=>{try{localStorage.setItem(displayKey(),JSON.stringify(display));}catch{storageIssue=true;}};
  const progress=()=>read(`progress:${node}`,()=>loadBrowserNodeProgress(userKey(),node),defaultProgress());
  const missions=()=>read<StudioMission[]>(`missions:${node}`,()=>loadBrowserMissions(userKey(),node),[]);
  const checkins=()=>read<MissionCheckin[]>(`checkins:${node}`,()=>loadBrowserMissionCheckins(userKey(),node),[]);
  const rules=()=>read<BankedRule[]>(`rules:${node}`,()=>loadBrowserBankedRules(userKey(),node),[]);
  const chapterSeen=()=>read(`chapter:${node}`,()=>hasSeenNodeChapter(userKey(),node),false);
  const strategyStatus=()=>read(`strategy:${node}`,()=>loadBrowserStrategyStatus(userKey(),node),'not-started');
  const moduleFor=():IQMNodeModule|null=>isNodeModuleRegistered(node)?getNodeModule(node):null;
  const canTrain=()=>unlocked.has(node)&&isNodeModuleRegistered(node);
  const currentMission=()=>missions().find(m=>m.id===missionId);
  const wrapper=():WrapperMode=>qa&&node==='attention'?(QA_WRAPPERS[progress().totalSessions]??'A'):wrapperModeForPhase(progress().phase);
  const move=()=>nextMove({chapterSeen:chapterSeen(),sessions:progress().totalSessions,strategyStarted:strategyStatus()!=='not-started',missions:missions(),checkins:checkins(),rules:rules(),skippedBanks:display.skippedBanks,now:Date.now(),qa:qa&&node==='attention'});
  const saveMission=(m:StudioMission)=>write(`missions:${node}`,[...missions().filter(x=>x.id!==m.id),m],()=>saveBrowserMission(userKey(),m));
  const saveCheckin=(c:MissionCheckin)=>write(`checkins:${node}`,[...checkins().filter(x=>x.id!==c.id),c],()=>saveBrowserMissionCheckin(userKey(),c));
  const saveRule=(r:BankedRule)=>write(`rules:${node}`,[...rules().filter(x=>x.sourceMissionId!==r.sourceMissionId),r],()=>saveBrowserBankedRule(userKey(),r));
  const stop=()=>{cleanup?.();cleanup=null;if(game){game.onComplete?.(null);game.destroy();game=null;}paused=false;};
  const go=(to:StudioScreen,reset=true)=>{
    if(game && !confirm('Leave this training session? This unfinished session will not be recorded as complete.'))return;
    stop();screen=to;if(reset)page=0;notice='';render();
  };
  const nav=()=>`<nav class="st-nav" aria-label="App navigation">${([['home','Home','home'],['network','Network','network'],['rules','My rules','book'],['more','More','more']] as const).map(([s,label,i])=>`<button type="button" data-do="${s}" ${screen===s?'aria-current="page"':''}>${icon(i)}<span>${label}</span></button>`).join('')}</nav>`;
  function frame(content:string,{action='',back='',immersive=false,showNav=true}: {action?:string;back?:string;immersive?:boolean;showNav?:boolean}={}) {
    const w=NODE_WORLDS[node];
    root.innerHTML=`<div class="studio ${immersive?'st-immersive':''} ${screen==='training'?'st-training':''}" data-screen="${screen}" data-node="${node}" style="--accent:${w.accent};--action:${w.action};--soft:${w.soft};--art-x:${w.art*100/6}%">
      <header class="st-topbar"><button type="button" class="st-brand" data-do="home" aria-label="Synergy IQ home"><span class="st-brand-mark">${icon('signal')}</span><span>Synergy <b>IQ</b><small>IQ MINDWARE</small></span></button><span class="st-top-context">${screen==='welcome'?'A more adaptive you':escape(w.chapter)}</span>${qaAccess?'<span class="st-qa">QA</span>':''}${back?`<button class="st-icon-button" type="button" data-do="${back}" aria-label="Back">${icon('back')}</button>`:''}</header>
      ${storageIssue?'<p class="st-storage" role="status">Browser storage is unavailable. New changes will last only in this tab.</p>':''}
      <main class="st-main" id="st-main" tabindex="-1">${content}</main>
      ${notice?`<p class="st-notice" role="status">${escape(notice)}</p>`:''}
      ${action?`<div class="st-actions">${action}</div>`:''}${showNav?nav():''}
    </div>`;
    root.querySelector<HTMLElement>('h2')?.setAttribute('tabindex','-1');
  }
  const eyebrow=(s:string)=>`<p class="st-eyebrow">${escape(s)}</p>`;
  const heading=(k:string,h:string,p='')=>`${eyebrow(k)}<h2>${escape(h)}</h2>${p?`<p class="st-lede">${escape(p)}</p>`:''}`;
  const story=(title:string,copy:string,kicker:string,extra='')=>`<section class="st-story">${art(node)}<div class="st-story-copy">${heading(kicker,title,copy)}${extra}</div></section>`;
  const next=()=>{const n=move();missionId=n.missionId??'';go(n.screen);};
  const formValue=(form:HTMLFormElement)=>Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,String(v).trim()]));
  const pending=()=>[...missions()].reverse().find(m=>m.status==='planned'||m.status==='reschedule');
  function render() {
    if(disposed)return;
    const w=NODE_WORLDS[node], mod=moduleFor();
    if(screen==='welcome') {
      frame(`<section class="st-welcome"><div class="st-welcome-art" aria-hidden="true"></div><div class="st-welcome-copy">${heading('The adaptive intelligence network','Navigate possibility. Build intelligence.','Turn possibility into agency.')}<p>Find what matters. Practise a useful move. Take it into your world.</p><div class="st-welcome-path"><span>Train</span><i>→</i><span>Apply</span><i>→</i><span>Learn</span></div></div></section>`,{immersive:true,showNav:false,action:button('Begin with Attention','begin')+'<button class="st-text" data-do="explore">Explore the network instead</button>'});return;
    }
    if(screen==='home') {
      const n=move(),p=progress(),m=pending(),receipt=display.receipts.filter(r=>r.nodeId===node).at(-1);
      const t=n.screen==='briefing'?trainingBeat(p,wrapper(),qa):null;
      frame(`<section class="st-home"><div class="st-home-heading">${heading('Your adaptive journey','Your next move.','Small practice. A useful move. Something to try in the world.')}</div>
        ${m?`<button type="button" class="st-checkin-card" data-do="review:${m.id}"><span class="st-checkin-icon">${icon('outside')}</span><span><strong>${escape(m.goal||'Your real-world mission')}</strong><small>${m.dueAt&&Date.parse(m.dueAt)>Date.now()?'Review when you have tried it. Training can continue.':'Ready for a quick check-in?'}</small></span>${icon('arrow')}</button>`:`<div class="st-checkin-card"><span class="st-checkin-icon">${icon('signal')}</span><span><strong>${escape(w.question)}</strong><small>${p.totalSessions?'Keep the goal in view, not just the score.':'Start with one capacity, not seven choices.'}</small></span></div>`}
        <div class="st-home-grid"><button type="button" class="st-next-card" data-do="continue">${art(node)}<span class="st-card-overline">${escape(w.title)} · ${p.totalSessions?'Next step':'Chapter 01'}</span><strong>${escape(t?.title||n.title)}</strong><span class="st-card-copy">${escape(t?.copy||n.note)}</span><span class="st-card-action">${escape(n.label)} ${icon('arrow')}</span></button>
        <aside class="st-home-aside"><div class="st-mini-card">${icon('network')}<h3>One connected journey.</h3><p>Train a capacity. Learn the move. Try it outside.</p><button class="st-text" data-do="network">Explore the network ${icon('arrow')}</button></div><div class="st-mini-card"><span class="st-big-number">${p.totalSessions}</span><strong>Training sessions completed</strong><small>${receipt?'Latest result is available in More.':'Your results appear after a completed session.'}</small></div></aside></div></section>`);return;
    }
    if(screen==='network') {
      frame(`<section class="st-network-page">${heading('Seven capacities','Your thinking network.','Different operations. A shared way of learning.')}<div class="st-network-grid"><div class="st-orbit" aria-label="Seven cognitive capacities"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="36"/>${NODE_ORDER.map((_,i)=>{const a=(i*2*Math.PI/7)-Math.PI/2;return `<path d="M50 50L${50+36*Math.cos(a)} ${50+36*Math.sin(a)}"/>`;}).join('')}</svg><span class="st-orbit-centre">IQ</span>${NODE_ORDER.map((n,i)=>{const a=i*2*Math.PI/7-Math.PI/2,x=50+36*Math.cos(a),y=50+36*Math.sin(a),v=NODE_WORLDS[n];return `<button type="button" class="st-node ${n===node?'is-selected':''}" style="left:${x}%;top:${y}%;--node-colour:${v.action}" data-do="node:${n}" aria-label="${v.title}${unlocked.has(n)&&isNodeModuleRegistered(n)?'':', coming soon or locked'}" aria-pressed="${n===node}"><span>${icon(v.icon)}</span><b>${escape(v.short)}</b></button>`;}).join('')}</div><article class="st-world-card">${art(node)}<div>${eyebrow(w.title)}<h3>${escape(w.question)}</h3><p>${escape(w.description)}</p><span class="st-status">${canTrain()?'Ready to explore':mod?'Not unlocked':'Coming soon'}</span>${canTrain()?button('Open this chapter','chapter'):''}</div></article></div><p class="st-caption">A navigation map, not a measured causal network. Only released, unlocked nodes can launch training.</p></section>`);return;
    }
    if(screen==='chapter') {
      if(!canTrain()){screen='network';render();return;}
      frame(story(w.question,w.description,`${w.title} · ${w.chapter}`,'<div class="st-principle"><span>THE IDEA</span><strong>What catches your eye is not always what helps your goal.</strong></div><p class="st-small">Feeds, messages, tools and everyday work can all compete for attention. Start by choosing what deserves control now.</p>'),{showNav:false,back:'home',action:button('Begin the chapter','chapter-begin')});return;
    }
    if(screen==='briefing') {
      if(!canTrain()){screen='network';render();return;}
      if(qa&&node==='attention'&&progress().totalSessions>=5){screen='contexts';render();return;}
      const b=trainingBeat(progress(),wrapper(),qa), wr=wrapper();
      const invariant=node==='attention'?(wr==='C'?'Ignore the face. Use the arrow majority.':wr==='B'?'Find the IN / OUT majority in the motion.':'Find the IN / OUT majority in the arrows.'):'Keep the same operation as the presentation changes.';
      frame(`<section class="st-briefing st-split"><div class="st-briefing-visual"><div class="st-signal-orbit" aria-hidden="true"><span>↑</span><span>↗</span><span>↙</span><span>↘</span><span>↓</span><i>•</i></div><p>Illustrative cue only.<br>The actual game determines the relation.</p></div><div class="st-reading">${heading('Training · '+b.short,node==='attention'?b.title:w.question,node==='attention'?b.copy:mod!.shortDescription)}<div class="st-principle"><span>WHAT STAYS</span><strong>${escape(invariant)}</strong></div><p class="st-small">The task is abstract on purpose: practise the operation cleanly, then look for the same demand elsewhere.</p>${node==='attention'?'<div class="st-pills"><span>IN / OUT</span><span>12 blocks</span><span>Keyboard or touch</span></div>':''}${qa?'<p class="st-caption">Accelerated QA sequence. Its transitions are not evidence of a plateau or transfer.</p>':''}</div></section>`,{showNav:false,back:'home',action:button('Start training','start')});return;
    }
    if(screen==='training') {renderGame();return;}
    if(screen==='result') {
      const r=display.receipts.filter(x=>x.nodeId===node).at(-1);
      if(!r){frame(story('Your first result is ahead.','Complete a training session to see its actual results.','Training'),{action:button('Go to training','briefing')});return;}
      const metrics=r.summary.displayMetrics??[], accuracy=r.summary.accuracy;
      frame(`<section class="st-result"><div class="st-result-top"><span class="st-result-check">${icon('check')}</span>${heading('Training complete','You showed up. Now take something with you.','These are results from this task, not an intelligence gain.')}</div><div class="st-result-grid"><div class="st-score-art">${typeof accuracy==='number'&&Number.isFinite(accuracy)?`<div class="st-score-ring" style="--score:${Math.min(100,Math.max(0,accuracy*100))}%"><div><strong>${Math.round(accuracy*100)}%</strong><span>Task accuracy</span></div></div>`:`<div class="st-result-check">${icon('check')}</div>`}</div><div class="st-metric-list">${metrics.map(m=>`<div><span>${escape(m.label)}</span><strong>${escape(m.value)}</strong></div>`).join('')}<p class="st-caption">Recorded ${escape(new Date(r.takenAt).toLocaleDateString('en-GB'))}. Practice and familiarity can affect results.</p></div></div><div class="st-takeaway"><span>THE MOVE TO TAKE WITH YOU</span><h3>${node==='attention'?'Pause. Find the signal. Commit.':escape(mod?.strategy.handle||w.question)}</h3><p>Learn when it fits, then try it in a real situation.</p></div></section>`,{showNav:false,action:button('See the move','move')+button('Back to my journey','home',true)});return;
    }
    if(screen==='move') {
      const steps=node==='attention'?[['pause','Pause','Make a moment to return to your goal.'],['search','Find the signal','Which information changes the answer or your next action?'],['check','Commit','Use the relevant signal, rather than chasing every detail.']]:[['search','Open the space',mod?.strategy.handle||w.question],['relations','Find the structure','Look for what matters beneath the surface.'],['check','Use it deliberately','Check that the strategy fits this situation.']];
      frame(`<section class="st-move-page">${heading('The move','A simple rule. A deliberate choice.','The aim is to recognise the operation outside the game.')}<div class="st-move-grid"><div class="st-move-art" aria-hidden="true"><span></span><span></span><span></span><i></i></div><div class="st-step-list">${steps.map(([i,t,c],n)=>`<article><span>${icon(i)}</span><div><small>0${n+1}</small><h3>${escape(t)}</h3><p>${escape(c)}</p></div></article>`).join('')}</div></div><div class="st-takeaway"><strong>${escape(mod?.strategy.handle||w.question)}</strong><p>A strategy for the right moment — not a rule to apply everywhere.</p></div></section>`,{showNav:false,back:'home',action:button('When should I use it?','examples')});return;
    }
    if(screen==='examples') {
      const examples=mod?[...mod.strategy.workedExamples,...mod.strategy.changedExamples]:[];
      const example=examples[Math.min(page,examples.length-1)];
      frame(`<section class="st-example-page">${heading(`The move in context · ${page+1} / ${examples.length}`,example?.title||'Choose the right moment.')}<div class="st-example-card">${icon(example?.usePolicy?'signal':'leaf')}<p>${escape(example?.situation||w.description)}</p><span class="st-status">${example?.usePolicy?'Use the signal-selection strategy':'Keep exploring first'}</span><h3>${escape(example?.explanation||'A different situation may need a different strategy.')}</h3></div><p class="st-caption">Worked example, not an assessment. Recognising when not to narrow attention is part of the lesson.</p></section>`,{showNav:false,back:'move',action:button(page<examples.length-1?'Next example':'Take the move into a context',page<examples.length-1?'example-next':'strategy-done')});return;
    }
    if(screen==='contexts') {
      frame(`<section class="st-contexts">${heading('Same move. Different settings.','Try it here.','A short practice scenario before you take the move into your own world.')}<div class="st-context-list">${[['feed','A purposeful feed','Find something useful without following every recommendation.','leaf'],['work','A busy workspace','Notice what affects the real decision.','relations'],['ai','An AI answer','Own the goal. Review the shortlist. Check what stays.','reason']].map(([i,t,c,g])=>`<button class="st-context-card" data-do="context:${i}"><span>${icon(g)}</span><div><h3>${t}</h3><p>${c}</p></div>${icon('arrow')}</button>`).join('')}</div><p class="st-caption">Curated practice, not a live feed or a validated transfer test. AI use is optional.</p></section>`,{back:'home',action:button('Choose my real-world mission','mission')});return;
    }
    if(screen==='scenario') {
      const c=CONTEXT_CASES[selectedCase],s=practiceScore(c,choice);
      frame(`<section class="st-scenario">${heading('Context practice',c.title,c.goal)}<p class="st-small">Select information that bears on this goal.</p><div class="st-evidence-list">${c.rows.map(r=>`<button data-do="evidence:${r.id}" class="st-evidence ${choice.has(r.id)?'is-selected':''}" aria-pressed="${choice.has(r.id)}"><span>${icon(choice.has(r.id)?'check':'plus')}</span>${escape(r.text)}</button>`).join('')}</div>${caseChecked?`<div class="st-practice-feedback" role="status"><strong>${s.misses===0&&s.noise===0?'You selected the relevant information.':'Return to the goal.'}</strong><p>${escape(c.explanation)}</p><small>${s.hits} relevant selected · ${s.misses} missed · ${s.noise} irrelevant selected. Practice feedback only.</small></div>`:''}</section>`,{showNav:false,back:'contexts',action:button(caseChecked?'Take it outside':'Check my selection',caseChecked?'mission':'check-case')});return;
    }
    if(screen==='ai') {
      frame('<section class="st-ai"><div id="studio-ai-host"></div></section>',{showNav:false,back:'contexts',action:button('Choose a real-world mission','mission')});
      const host=root.querySelector<HTMLElement>('#studio-ai-host')!;cleanup=mountAttentionAiPractice(host);return;
    }
    if(screen==='mission') {renderMission();return;}
    if(screen==='mission-saved') {
      const m=currentMission();
      frame(story('The next part happens outside.',m?.goal||m?.context||'Try the move in a real setting.','Reality mission saved',`<div class="st-principle"><span>YOUR NEXT ACTION</span><strong>${escape(m?.intendedPolicy)}</strong></div><p class="st-small">${m?.dueAt?'Review after '+escape(new Date(m.dueAt).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}))+'. ':''}You can still train while waiting. There is no need to manufacture an outcome now.</p>`),{showNav:false,action:button('Done for today','home')});return;
    }
    if(screen==='checkin') {renderCheckin();return;}
    if(screen==='bank') {renderBank();return;}
    if(screen==='rules') {
      const rr=rules();
      frame(`<section class="st-rules">${heading('Your portable learning','My adaptive rules.',rr.length?'Personal notes to test again, not permanent truths.':'A useful lesson deserves somewhere to return to.')}<div class="st-rule-grid">${rr.length?[...rr].reverse().map(r=>`<article class="st-rule-card"><span class="st-rule-icon">${icon('book')}</span><small>${escape(w.chapter)} · ${escape(new Date(r.createdAt).toLocaleDateString('en-GB'))}</small><p><b>When</b> ${escape(r.whenCue)}</p><p><b>I will</b> ${escape(r.actionRule)}</p>${r.because?`<p class="st-small"><b>Because</b> ${escape(r.because)}</p>`:''}<span class="st-status">Personal learning note</span></article>`).join(''):`<div class="st-empty">${art(node)}<h3>No rules banked yet.</h3><p>Try a real mission, review what happened and save only the lesson you want to test again.</p>${button('Choose a mission','mission')}</div>`}</div></section>`);return;
    }
    if(screen==='more') {
      frame(`<section class="st-more">${heading('Your toolkit','Keep the useful things close.')}<div class="st-utility-list">${[['briefing','Training','Go straight to the current task.','signal'],['contexts','Context practice','Feeds, work and optional AI exercises.','outside'],['result','Latest task result','Only your recorded training metrics.','check'],['chapter','Replay this chapter','Return to the question behind the game.','book']].map(([a,t,c,i])=>`<button data-do="${a}"><span>${icon(i)}</span><div><strong>${t}</strong><small>${c}</small></div>${icon('arrow')}</button>`).join('')}<a href="https://www.iqmindware.com/g-track-test-battery/" target="_blank" rel="noopener"><span>${icon('network')}</span><div><strong>G Track</strong><small>Open the separate Adaptive G profile and cognitive benchmarks.</small></div>${icon('outside')}</a></div><details class="st-data"><summary>Your data and this preview</summary><p>Progress, missions and rules stay in this browser. This screen does not upload them for research or synchronise them across devices. G Track is a separate site; no profile has been imported here.</p><div class="st-button-row">${button('Export this profile','export',true)}${button('Delete local app data','delete',true)}</div>${qa?'<button class="st-text" data-do="reset-qa">Restart the forced QA training sequence</button><p>QA transitions are fixed for testing. They are not a validated production programme.</p>':''}${user?'<button class="st-text" data-do="signout">Sign out</button>':''}</details></section>`);return;
    }
    if(screen==='signin') {
      frame(story('Your journey, ready when you are.','Sign in to access the capacities you own.','Welcome back','<form id="studio-signin" class="st-form">'+input('Email','email','','you@example.com')+'<button type="submit" class="st-button">Send sign-in link '+icon('arrow')+'</button><p id="studio-auth-message" role="status"></p></form>'),{showNav:false});
      const f=root.querySelector<HTMLFormElement>('#studio-signin')!;f.querySelector('input')!.type='email';
      f.addEventListener('submit',async e=>{e.preventDefault();const b=f.querySelector<HTMLButtonElement>('button')!;b.disabled=true;const msg=f.querySelector<HTMLElement>('#studio-auth-message')!;try{await sendPlatformSignInLink(String(new FormData(f).get('email')));msg.textContent='Check your email for the sign-in link.';}catch(err){msg.textContent=err instanceof Error?err.message:'Unable to send the link. Please retry.';}finally{b.disabled=false;}});return;
    }
    frame(story('Sign-in is not configured.','This build needs its existing account settings before paid access can be loaded. The local Attention QA mode is separate.','Setup'),{showNav:false});
  }

  function renderMission() {
    const mod=moduleFor();if(!mod){screen='network';render();return;}
    if(!draft.context){const t=mod.missions[0];draft={context:'One work or study task',goal:'',cue:'When competing details pull me away',policy:mod.strategy.handle,prediction:'',competition:'',niche:'reduce-interference',nicheNote:'',review:new Date(Date.now()+86400000-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),template:t?.id??''};}
    const form=page===0?`${input('Where will you try it?','context',draft.context,'A meeting, a paper, a conversation…')}${input('My goal is…','goal',draft.goal,'An observable outcome')}${area('I expect that…','prediction',draft.prediction,'What would you notice if the move helped?',true)}`:`${input('The cue I will notice…','cue',draft.cue)}${area('My next action…','policy',draft.policy,'What will you actually do?',true)}${select('Make it easier', 'niche',Object.entries(KINDS) as [string,string][],draft.niche)}${input('One environmental change','nicheNote',draft.nicheNote,'For example: silence one notification',false)}<label class="st-field"><span>Review point</span><input type="datetime-local" name="review" value="${escape(draft.review)}" required/></label>`;
    frame(`<section class="st-mission-builder st-split"><div class="st-mission-illustration">${art(node)}<div><span>REALITY MISSION</span><h3>One task.<br>One useful move.</h3></div></div><div class="st-reading">${heading(`Take it outside · ${page+1} / 2`,page===0?'Choose something that matters.':'Give the move a place to happen.',page===0?'A small, real situation is enough.':'Set a cue and a review point. Then let the world answer.')}<form id="studio-mission" class="st-form">${form}</form></div></section>`,{showNav:false,back:page?'mission-back':'home',action:`<button type="submit" form="studio-mission" class="st-button">${page?'Save my mission':'Next: cue and action'} ${icon('arrow')}</button>`});
    root.querySelector<HTMLFormElement>('#studio-mission')!.addEventListener('submit',e=>{e.preventDefault();Object.assign(draft,formValue(e.currentTarget as HTMLFormElement));if(page===0){page=1;render();return;}const due=new Date(draft.review);if(!Number.isFinite(due.getTime()))return;const m:StudioMission={id:id('mission'),nodeId:node,context:draft.context,targetCue:draft.cue,intendedPolicy:draft.policy,nicheChangeType:draft.niche as NicheChangeType,nicheChangeNote:draft.nicheNote||undefined,goal:draft.goal,prediction:draft.prediction,status:'planned',createdAt:new Date().toISOString(),dueAt:due.toISOString()};saveMission(m);missionId=m.id;draft={};go('mission-saved');});
  }
  function renderCheckin() {
    const m=currentMission();if(!m){screen='home';render();return;}
    const fields=page===0?`${select('Did the opportunity occur?','opportunity',[['yes','Yes'],['no','No — not yet']],checkDraft.opportunity)}${select('Did you use the move?','use',[['yes','Yes'],['partly','Partly'],['no','No']],checkDraft.use,false)}`:`${select('What was the effect?','effect',[['helped','It helped'],['no-clear-difference','No clear difference'],['made-it-harder','It made things harder'],['not-sure','Not sure']],checkDraft.effect)}${select('Did the environment change help?','environment',[['yes','Yes'],['no','No'],['no-change','I did not make one']],checkDraft.environment)}${select('What got in the way?','barrier',[['none','Nothing to add'],['forgot','I forgot'],['did-not-notice-cue','I did not notice the cue'],['too-busy-under-pressure','Time or pressure'],['environment-got-in-way','The environment'],['strategy-did-not-fit','The strategy did not fit'],['other','Something else']],checkDraft.barrier||'none')}${area('What actually happened?','note',checkDraft.note,'A short observation is enough.')}`;
    frame(`<section class="st-checkin-page">${heading(`Reality check-in · ${page+1} / 2`,'What did reality say?','Notice what happened without forcing a success story.')}<div class="st-mission-reminder"><span>YOUR GOAL</span><strong>${escape(m.goal||m.context)}</strong>${m.prediction?`<p>You expected: ${escape(m.prediction)}</p>`:''}</div><form id="studio-checkin" class="st-form">${fields}</form><p class="st-caption">This is your account of a real attempt, not independent evidence of training transfer.</p></section>`,{showNav:false,back:page?'checkin-back':'home',action:`<button form="studio-checkin" type="submit" class="st-button">${page?'Save the observation':'Continue'} ${icon('arrow')}</button>`});
    root.querySelector<HTMLFormElement>('#studio-checkin')!.addEventListener('submit',e=>{e.preventDefault();Object.assign(checkDraft,formValue(e.currentTarget as HTMLFormElement));if(page===0&&checkDraft.opportunity==='yes'){if(!checkDraft.use){const sel=root.querySelector<HTMLSelectElement>('[name="use"]')!;sel.required=true;sel.reportValidity();return;}page=1;render();return;}const occurred=checkDraft.opportunity==='yes';const c:MissionCheckin={id:id('checkin'),missionId:m.id,userId:userKey(),nodeId:node,opportunityOccurred:occurred,strategyUse:occurred?checkDraft.use as StrategyUse:undefined,effect:occurred?checkDraft.effect as MissionEffect:undefined,environmentHelp:occurred?checkDraft.environment as EnvironmentHelp:undefined,barrier:occurred&&checkDraft.barrier!=='none'?checkDraft.barrier as MissionBarrier:undefined,note:checkDraft.note||undefined,createdAt:new Date().toISOString()};saveCheckin(c);saveMission({...m,status:occurred?'done':'reschedule',dueAt:occurred?m.dueAt:new Date(Date.now()+86400000).toISOString()});checkDraft={};if(!occurred){screen='home';notice='No opportunity is not a failure. Review tomorrow, or earlier when you have tried it.';render();}else go('bank');});
  }
  function renderBank() {
    const m=currentMission(),c=[...checkins()].reverse().find(x=>x.missionId===missionId&&x.opportunityOccurred);
    if(!m||!c){screen='home';render();return;}
    const caution=c.effect==='made-it-harder'?'It made things harder. Revise the strategy or leave this rule unbanked.':c.effect==='helped'?'What seems worth trying again? One helpful attempt is still provisional.':'The outcome was uncertain. Save a tentative question or skip banking for now.';
    frame(`<section class="st-bank st-split"><div class="st-bank-illustration">${art(node)}<div><span>REUSABLE, NOT RIGID</span><h3>Keep a lesson.<br>Leave room to change.</h3></div></div><div class="st-reading">${heading('Bank the learning','What would you keep?',caution)}<form id="studio-bank" class="st-form">${area('When…','when',m.targetCue,'',true)}${area('I will…','action',c.effect==='made-it-harder'?'':m.intendedPolicy,'Choose or revise the next move.',true)}${area('Because…','because',c.note||'','What did this attempt teach you?')}</form><p class="st-caption">Saved as a personal learning note, not a validated rule.</p></div></section>`,{showNav:false,action:`<button type="submit" form="studio-bank" class="st-button">Save to my rules ${icon('arrow')}</button><button class="st-text" data-do="skip-bank">Leave unbanked for now</button>`});
    root.querySelector<HTMLFormElement>('#studio-bank')!.addEventListener('submit',e=>{e.preventDefault();const f=formValue(e.currentTarget as HTMLFormElement);const existing=rules().find(r=>r.sourceMissionId===m.id);saveRule({id:existing?.id??id('rule'),userId:userKey(),nodeId:node,whenCue:f.when,actionRule:f.action,because:f.because||undefined,sourceMissionId:m.id,createdAt:existing?.createdAt??new Date().toISOString()});go('rules');});
  }
  function renderGame() {
    if(!canTrain()) {screen='network';render();return;}
    if(qa&&node==='attention'&&progress().totalSessions>=5){screen='contexts';render();return;}
    const g=moduleFor()!.game,p=progress(),wr=wrapper(),b=trainingBeat(p,wr,qa);
    frame(`<section class="st-game-frame"><div class="st-game-header"><div>${eyebrow(wr==='C'?'Salience challenge':'Focused training')}<h2>${escape(node==='attention'?b.short:NODE_WORLDS[node].title)}</h2></div><button type="button" class="st-game-pause" data-do="pause">${icon('pause')}<span>Pause</span></button><button type="button" class="st-icon-button" data-do="home" aria-label="Exit training">${icon('close')}</button></div><div id="studio-game-host"></div></section>`,{showNav:false});
    game=g;let completed=false;
    g.onComplete?.((summary:TrainingSummary)=>{
      if(completed||disposed)return;completed=true;
      let updated:WrapperProgressionState;
      if(qa&&node==='attention'){
        updated={...p,phase:'A_TRAIN',sessionsInPhase:0,totalSessions:p.totalSessions+1,aScores:[...p.aScores],bScores:[...p.bScores],aReopenScores:[...p.aReopenScores]};
        if(wr==='A')updated.aScores.push(summary.progressionScore);if(wr==='B')updated.bScores.push(summary.progressionScore);
      }else updated=recordProgressionSession(p,{summary,wrapperMode:wr,dataQualityAdequate:summary.validTrials>=10},moduleFor()!.progression).state;
      write(`progress:${node}`,updated,()=>saveBrowserNodeProgress(userKey(),node,updated));
      const receipt:SessionReceipt={nodeId:node,takenAt:new Date().toISOString(),wrapper:wr,summary};display.receipts=[...display.receipts,receipt].slice(-30);persistDisplay();stop();screen='result';render();
    });
    try {g.createSession({nodeId:node,sessionId:id(`${node}-session`),phase:p.phase,wrapperMode:wr,targetMinutes:moduleFor()!.estimatedSessionMinutes});g.mount(root.querySelector<HTMLElement>('#studio-game-host')!);g.start();}catch(error){stop();screen='home';notice=error instanceof Error?error.message:'The session could not start. Please retry.';render();}
  }
  async function click(event:Event) {
    const target=event.target instanceof Element?event.target.closest<HTMLElement>('[data-do]'):null;
    if(!target)return;const a=target.dataset.do!;
    if(a==='pause'&&game){paused=!paused;if(paused)game.pause?.();else game.resume?.();target.innerHTML=icon(paused?'arrow':'pause')+`<span>${paused?'Resume':'Pause'}</span>`;return;}
    if(a.startsWith('node:')){const n=a.slice(5) as NodeId;if(!NODE_ORDER.includes(n))return;node=n;display.lastNode=n;persistDisplay();render();return;}
    if(a==='begin'||a==='explore'){display.welcomeSeen=true;persistDisplay();try{markPlatformOrientationSeen(userKey());}catch{storageIssue=true;}node='attention';go(a==='begin'?'chapter':'network');return;}
    if(a==='chapter-begin'){write(`chapter:${node}`,true,()=>markNodeChapterSeen(userKey(),node));go('briefing');return;}
    if(a==='continue'){next();return;}
    if(a==='start'){go('training');return;}
    if(a==='example-next'){page++;render();return;}
    if(a==='strategy-done'){write(`strategy:${node}`,'practising',()=>saveBrowserStrategyStatus(userKey(),node,'practising'));go(node==='attention'?'contexts':'mission');return;}
    if(a.startsWith('context:')){selectedCase=a==='context:work'?1:0;choice.clear();caseChecked=false;go(a==='context:ai'?'ai':'scenario');return;}
    if(a.startsWith('evidence:')){const key=a.slice(9);choice.has(key)?choice.delete(key):choice.add(key);caseChecked=false;render();root.querySelector<HTMLElement>(`[data-do="${a}"]`)?.focus();return;}
    if(a==='check-case'){caseChecked=true;render();return;}
    if(a.startsWith('review:')){missionId=a.slice(7);checkDraft={};go('checkin');return;}
    if(a==='mission-back'){const f=root.querySelector<HTMLFormElement>('#studio-mission');if(f)Object.assign(draft,formValue(f));page=0;render();return;}
    if(a==='checkin-back'){const f=root.querySelector<HTMLFormElement>('#studio-checkin');if(f)Object.assign(checkDraft,formValue(f));page=0;render();return;}
    if(a==='skip-bank'){display.skippedBanks=[...new Set([...display.skippedBanks,missionId])];persistDisplay();go('home');return;}
    if(a==='reset-qa'&&qa){if(!confirm('Reset only the Attention QA training sequence? Your missions and learning notes will stay.'))return;node='attention';write(`progress:${node}`,defaultProgress(),()=>saveBrowserNodeProgress(userKey(),node,defaultProgress()));go('home');return;}
    if(a==='export'){
      const data={format:'synergy-iq-local-export-v1',createdAt:new Date().toISOString(),display,nodes:NODE_ORDER.map(n=>({nodeId:n,progress:read(`progress:${n}`,()=>loadBrowserNodeProgress(userKey(),n),defaultProgress()),missions:read(`missions:${n}`,()=>loadBrowserMissions(userKey(),n),[]),checkins:read(`checkins:${n}`,()=>loadBrowserMissionCheckins(userKey(),n),[]),rules:read(`rules:${n}`,()=>loadBrowserBankedRules(userKey(),n),[])}))};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='synergy-iq-local-data.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
    if(a==='delete'){
      if(!confirm('Delete this profile’s local Synergy IQ training progress, missions and rules in this browser? This cannot be undone. G Track and other apps are not affected.'))return;
      try{const prefixes=['iqm-platform:node-progress:','iqm-platform:progress:','iqm-platform:missions:','iqm-platform:mission-checkins:','iqm-platform:strategy-status:','iqm-platform:banked-rules:','iqm-platform:orientation:','iqm-platform:chapter-seen:','iqm-platform:studio:'];for(const k of Object.keys(localStorage))if(prefixes.some(p=>k.startsWith(p))&&(k.endsWith(':'+userKey())||k.includes(':'+userKey()+':')))localStorage.removeItem(k);}catch{storageIssue=true;}
      memory.clear();display=initialDisplayState();go('welcome');return;
    }
    if(a==='signout'){stop();await signOutPlatformUser();return;}
    const screens:StudioScreen[]=['home','network','chapter','briefing','result','move','examples','contexts','mission','rules','more'];
    if(screens.includes(a as StudioScreen)){if(a==='mission')draft={};go(a as StudioScreen);}
  }
  root.addEventListener('click',click);
  const authSubscription=onPlatformAuthChange(u=>{
    if(preview||disposed||busy)return;
    // Supabase auth callbacks stay synchronous; account fetching happens after the callback.
    if(u?.id===user?.id)return;
    user=u;stop();setTimeout(()=>{void hydrate();},0);
  });
  async function hydrate() {
    busy=true;
    try {
      if(!preview){if(!isPlatformAuthConfigured){screen='setup';render();return;}user=await currentPlatformUser();if(!user){screen='signin';render();return;}unlocked=unlockedNodeIds(await loadCurrentUserEntitlements());}
      try{display=readDisplayState(localStorage.getItem(displayKey()));}catch{storageIssue=true;display=initialDisplayState();}
      node=canNode(display.lastNode)?display.lastNode:'attention';
      screen=display.welcomeSeen?'home':'welcome';render();
    }catch(error){screen='signin';notice=error instanceof Error?error.message:'Unable to load your access. Please try again.';render();}finally{busy=false;}
  }
  const canNode=(n:NodeId)=>unlocked.has(n)&&isNodeModuleRegistered(n);
  const visibility=()=>{if(document.hidden&&game&&!paused){paused=true;game.pause?.();const b=root.querySelector<HTMLElement>('[data-do="pause"]');if(b)b.innerHTML=icon('arrow')+'<span>Resume</span>';}};
  document.addEventListener('visibilitychange',visibility);
  await hydrate();
  return ()=>{disposed=true;stop();authSubscription?.unsubscribe();root.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);};
}
