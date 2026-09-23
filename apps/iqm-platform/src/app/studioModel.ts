import type { NodeId } from '../types/node';
import type { Mission, MissionCheckin } from '../types/mission';
import type { BankedRule } from '../types/learning';
import type { TrainingSummary, WrapperMode } from '../types/game';
import type { WrapperProgressionState } from '../types/progression';

export const STUDIO_VERSION = 'illustrated-journey-v1';
export const QA_WRAPPERS: readonly WrapperMode[] = ['A', 'B', 'A', 'C', 'A'];
export interface NodeWorld {
  title: string; short: string; chapter: string; question: string; description: string;
  accent: string; action: string; soft: string; art: number; icon: string;
}
export const NODE_WORLDS: Record<NodeId, NodeWorld> = {
  attention: {title:'Attention Control',short:'Attention',chapter:'Signal',question:'What matters now?',description:'Learn to separate what grabs attention from what matters for your goal.',accent:'#22AAFF',action:'#1266B5',soft:'#EAF6FF',art:0,icon:'signal'},
  'relational-memory': {title:'Relational Memory',short:'Relations',chapter:'Structure',question:'What is connected to what?',description:'Hold the important relationships as the details around them change.',accent:'#9B7AFF',action:'#6441C6',soft:'#F1ECFF',art:1,icon:'relations'},
  'binding-memory': {title:'Binding Memory',short:'Binding',chapter:'Context',question:'What belongs with what?',description:'Keep an item, its source and its context connected.',accent:'#ED74AB',action:'#A82E68',soft:'#FFF0F7',art:2,icon:'binding'},
  'path-horizon': {title:'Path Horizon',short:'Path',chapter:'Consequence',question:'Where might this lead?',description:'Consider what happens next, and which changes would justify a new direction.',accent:'#FFAB63',action:'#A74E0B',soft:'#FFF2E5',art:3,icon:'path'},
  'knowledge-access': {title:'Knowledge Access',short:'Knowledge',chapter:'Retrieval',question:'What do I already know?',description:'Bring useful concepts and rules back when a new problem needs them.',accent:'#F6C64B',action:'#795900',soft:'#FFF8DA',art:4,icon:'book'},
  'generative-search': {title:'Generative Search',short:'Ideas',chapter:'Possibility',question:'What else could be true?',description:'Open the space deliberately. Explore genuinely different alternatives before choosing.',accent:'#31C89B',action:'#08785A',soft:'#E7FAF3',art:5,icon:'leaf'},
  reasoning: {title:'Reasoning',short:'Reasoning',chapter:'Constraint',question:'What actually follows?',description:'Test ideas against relationships, evidence and counterexamples.',accent:'#40BEC7',action:'#08707A',soft:'#E9F8F8',art:6,icon:'reason'},
};
export const NODE_ORDER = Object.keys(NODE_WORLDS) as NodeId[];
export type StudioScreen = 'welcome'|'home'|'network'|'chapter'|'briefing'|'training'|'result'|'move'|'examples'|'contexts'|'scenario'|'ai'|'mission'|'mission-saved'|'checkin'|'bank'|'rules'|'more'|'signin'|'setup';
export interface StudioMission extends Mission { goal?:string; prediction?:string; competingSignal?:string; reviewDecision?:string; }
export interface SessionReceipt { nodeId:NodeId; takenAt:string; wrapper:WrapperMode; summary:TrainingSummary; }
export interface DisplayState { version:1; welcomeSeen:boolean; lastNode:NodeId; receipts:SessionReceipt[]; skippedBanks:string[]; }
export const initialDisplayState = ():DisplayState => ({version:1,welcomeSeen:false,lastNode:'attention',receipts:[],skippedBanks:[]});
export function readDisplayState(raw:string|null):DisplayState {
  try {
    const p:unknown = JSON.parse(raw || 'null');
    if (!p || typeof p!=='object') return initialDisplayState();
    const o=p as Record<string,unknown>;
    const receipts=Array.isArray(o.receipts)?o.receipts.filter((v):v is SessionReceipt => {
      if(!v || typeof v!=='object') return false;
      const r=v as SessionReceipt;
      return NODE_ORDER.includes(r.nodeId) && ['A','B','C','AB_MIXED'].includes(r.wrapper) && Number.isFinite(Date.parse(r.takenAt)) && !!r.summary && Number.isFinite(r.summary.validTrials) && Number.isFinite(r.summary.progressionScore);
    }).slice(-30):[];
    return {version:1,welcomeSeen:o.welcomeSeen===true,lastNode:NODE_ORDER.includes(o.lastNode as NodeId)?o.lastNode as NodeId:'attention',receipts,skippedBanks:Array.isArray(o.skippedBanks)?o.skippedBanks.filter((v):v is string=>typeof v==='string'):[]};
  } catch {return initialDisplayState();}
}
export interface Beat { key:string; title:string; copy:string; short:string; }
export function trainingBeat(progress:WrapperProgressionState, wrapper:WrapperMode, qa:boolean):Beat {
  if(wrapper==='C') return {key:'salience',short:'Relevance',title:'Vivid is not always useful.',copy:'The face is a distraction in this task. Keep using the arrows to find the IN / OUT majority.'};
  if(wrapper==='B') return {key:'perturb',short:'New surface',title:'Same skill. New surface.',copy:'Motion replaces static arrows. The useful relation stays the same: do most signals move IN or OUT?'};
  if(wrapper==='AB_MIXED') return {key:'mix',short:'Mixed practice',title:'Find the relation across change.',copy:'The surface can change. Keep returning to the information that determines the answer.'};
  if(qa && progress.totalSessions===4) return {key:'bank',short:'Return',title:'Return. Keep what survives.',copy:'Come back to the original task after the salience challenge. Recover the same majority relation.'};
  if((qa && progress.totalSessions===2) || ['A_RETURN','A_REOPEN'].includes(progress.phase)) return {key:'return',short:'Recover',title:'Can you recover the signal?',copy:'You are back on the original task. Return to the same operation after a change of surface.'};
  return {key:'anchor',short:'Find the signal',title:'Find the signal.',copy:'Use the five signals to decide whether the majority points IN or OUT. Practise the operation before using it elsewhere.'};
}
export interface NextInput {
  chapterSeen:boolean; sessions:number; strategyStarted:boolean; missions:StudioMission[];
  checkins:MissionCheckin[]; rules:BankedRule[]; skippedBanks:string[]; now:number; qa:boolean;
}
export interface NextMove { screen:StudioScreen; title:string; label:string; note:string; missionId?:string; }
export function nextMove(s:NextInput):NextMove {
  if(!s.chapterSeen) return {screen:'chapter',title:'Start with the signal.',label:'Begin your chapter',note:'What matters now? A short introduction to Attention Control.'};
  const due=[...s.missions].reverse().find(m=>['planned','reschedule'].includes(m.status) && !!m.dueAt && Number.isFinite(Date.parse(m.dueAt)) && Date.parse(m.dueAt)<=s.now);
  if(due) return {screen:'checkin',title:'What did reality say?',label:'Review your mission',note:due.goal||due.context,missionId:due.id};
  const unbanked=[...s.missions].reverse().find(m=>m.status==='done' && s.checkins.some(c=>c.missionId===m.id&&c.opportunityOccurred) && !s.rules.some(r=>r.sourceMissionId===m.id) && !s.skippedBanks.includes(m.id));
  if(unbanked) return {screen:'bank',title:'Keep a useful lesson.',label:'Review the learning',note:'Save a rule, revise it, or leave it unbanked for now.',missionId:unbanked.id};
  if(s.sessions===0) return {screen:'briefing',title:'Find the signal.',label:'Start training',note:'Begin with the original Attention task.'};
  if(!s.strategyStarted) return {screen:'move',title:'The move behind the game.',label:'Learn the move',note:'Pause. Find the signal. Commit.'};
  if(s.missions.length===0) return {screen:'mission',title:'Take it outside.',label:'Choose a real task',note:'Put the strategy to work in one small, real situation.'};
  if(s.qa && s.sessions>=QA_WRAPPERS.length) return {screen:'contexts',title:'A new context. The same move.',label:'Try a short scenario',note:'Practise relevance in a feed, a workspace or a simulated AI answer.'};
  return {screen:'briefing',title:'Continue your Attention journey.',label:'Continue training',note:'You can train while waiting for your real-world review point.'};
}
export interface PracticeCase {id:string;title:string;goal:string;rows:{id:string;text:string;relevant:boolean}[];explanation:string;}
export const CONTEXT_CASES:PracticeCase[] = [
  {id:'feed',title:'A feed with a purpose.',goal:'Find a live online workshop you can attend this week to learn a specific research method.',rows:[{id:'a',text:'An expert posts the workshop topic, date and registration details.',relevant:true},{id:'b',text:'A popular creator calls this “the one skill everyone needs”.',relevant:false},{id:'c',text:'The organiser lists the prerequisites and whether a recording is available.',relevant:true},{id:'d',text:'A dramatic headline describes a completely different method.',relevant:false}],explanation:'For this goal, topic, timing and entry requirements matter. Popularity or drama alone do not tell you whether the workshop fits.'},
  {id:'work',title:'A busy workspace.',goal:'Decide whether a new project tool reduces total effort without lowering quality.',rows:[{id:'a',text:'Time spent on the main task fell during the pilot.',relevant:true},{id:'b',text:'The new dashboard has a much more attractive colour scheme.',relevant:false},{id:'c',text:'Verification and correction time increased.',relevant:true},{id:'d',text:'Independent checks found more unresolved errors.',relevant:true}],explanation:'Time saved is only part of the picture. Checking costs and quality also matter for the stated goal.'},
];
export function practiceScore(c:PracticeCase, selected:ReadonlySet<string>) {
  return {hits:c.rows.filter(r=>r.relevant&&selected.has(r.id)).length,misses:c.rows.filter(r=>r.relevant&&!selected.has(r.id)).length,noise:c.rows.filter(r=>!r.relevant&&selected.has(r.id)).length};
}
