import { describe, it, expect } from 'vitest';
import { NODE_ORDER, NODE_WORLDS, QA_WRAPPERS, nextMove, trainingBeat, readDisplayState, CONTEXT_CASES, practiceScore } from '../../src/app/studioModel';
import type { NextInput, StudioMission } from '../../src/app/studioModel';
import type { WrapperProgressionState } from '../../src/types/progression';

const now=Date.parse('2026-09-22T12:00:00Z');
const base:NextInput={chapterSeen:true,sessions:1,strategyStarted:true,missions:[],checkins:[],rules:[],skippedBanks:[],now,qa:true};
const state:WrapperProgressionState={phase:'A_TRAIN',totalSessions:1,sessionsInPhase:1,aScores:[.7],bScores:[],aReopenScores:[]};
const mission=(overrides:Partial<StudioMission>={}):StudioMission=>({id:'m1',nodeId:'attention',context:'Reading a report',targetCue:'Competing claims',intendedPolicy:'Restate the question',status:'planned',createdAt:new Date(now).toISOString(),dueAt:new Date(now+86400000).toISOString(),...overrides});

describe('illustrated Synergy IQ presentation model',()=>{
  it('keeps seven named, distinct, non-diagnostic visual worlds',()=>{
    expect(NODE_ORDER).toHaveLength(7);
    expect(new Set(NODE_ORDER.map(n=>NODE_WORLDS[n].accent)).size).toBe(7);
    expect(NODE_ORDER.map(n=>NODE_WORLDS[n].art)).toEqual([0,1,2,3,4,5,6]);
    expect(NODE_WORLDS['path-horizon'].title).toBe('Path Horizon');
    expect(NODE_WORLDS['knowledge-access'].title).toBe('Knowledge Access');
  });
  it('describes the actual wrapper, not an imagined five-session production route',()=>{
    expect(trainingBeat(state,'A',false).key).toBe('anchor');
    expect(trainingBeat(state,'B',false).key).toBe('perturb');
    expect(trainingBeat(state,'C',false).key).toBe('salience');
    expect(trainingBeat({...state,phase:'A_RETURN'},'A',false).key).toBe('return');
    expect(QA_WRAPPERS.map((w,i)=>trainingBeat({...state,totalSessions:i},w,true).key)).toEqual(['anchor','perturb','return','salience','bank']);
  });
  it('does not demand a check-in before a future mission has happened',()=>{
    expect(nextMove({...base,missions:[mission()]}).screen).toBe('briefing');
    expect(nextMove({...base,missions:[mission({dueAt:new Date(now-1000).toISOString()})]}).screen).toBe('checkin');
  });
  it('allows training after a no-opportunity reschedule',()=>{
    const noOpportunity={id:'c1',missionId:'m1',userId:'qa',nodeId:'attention' as const,opportunityOccurred:false,createdAt:new Date(now).toISOString()};
    expect(nextMove({...base,missions:[mission({status:'reschedule'})],checkins:[noOpportunity]}).screen).toBe('briefing');
  });
  it('does not force a user to bank a rule after an uncertain observation',()=>{
    const c={id:'c1',missionId:'m1',userId:'qa',nodeId:'attention' as const,opportunityOccurred:true,createdAt:new Date(now).toISOString()};
    expect(nextMove({...base,missions:[mission({status:'done'})],checkins:[c]}).screen).toBe('bank');
    expect(nextMove({...base,missions:[mission({status:'done'})],checkins:[c],skippedBanks:['m1']}).screen).toBe('briefing');
  });
  it('keeps first-time orientation and the portable move ahead of advanced features',()=>{
    expect(nextMove({...base,chapterSeen:false}).screen).toBe('chapter');
    expect(nextMove({...base,sessions:0}).screen).toBe('briefing');
    expect(nextMove({...base,strategyStarted:false}).screen).toBe('move');
    expect(nextMove(base).screen).toBe('mission');
  });
  it('recovers from missing, malformed and unrelated display-state data',()=>{
    for(const raw of [null,'{','null','123','[]']) expect(readDisplayState(raw).receipts).toEqual([]);
    expect(readDisplayState('{"lastNode":"unknown","receipts":[null,{}]}').lastNode).toBe('attention');
    expect(readDisplayState('{"lastNode":"binding-memory","welcomeSeen":true}').lastNode).toBe('binding-memory');
  });
  it('scores contextual practice separately and deterministically',()=>{
    const c=CONTEXT_CASES[0];
    expect(practiceScore(c,new Set(['a','c']))).toEqual({hits:2,misses:0,noise:0});
    expect(practiceScore(c,new Set(['a','b']))).toEqual({hits:1,misses:1,noise:1});
  });
});
