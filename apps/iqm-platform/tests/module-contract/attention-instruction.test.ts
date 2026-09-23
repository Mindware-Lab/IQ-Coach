import { describe, expect, it } from 'vitest';
import studioSource from '../../src/app/studio.ts?raw';
import { attentionInstructionTrial, renderAttentionInstruction } from '../../src/modules/attention/instruction';
import { renderAttentionStimulus } from '../../src/modules/attention/game/stimulus';
import { generateAttentionTrial } from '../../src/modules/attention/game/trial';

const wrappers = ['A', 'B', 'C'] as const;
const directions = ['in', 'out'] as const;

describe('instructional diagrams use actual Attention trial geometry', () => {
  for (const wrapper of wrappers) {
    for (const answer of directions) {
      it(`${wrapper}: ${answer} exemplar has five radial signals and the correct 4:1 majority`, () => {
        const trial = attentionInstructionTrial(wrapper, answer);
        expect(trial.frame).toBe('relational');
        expect(trial.correctResponse).toBe(answer);
        expect(trial.items).toHaveLength(5);
        expect(new Set(trial.items.map(i => i.positionIndex)).size).toBe(5);
        expect(trial.items.filter(i => i.relation === answer)).toHaveLength(4);
        for (const item of trial.items) {
          const dx = item.position.x - 50, dy = item.position.y - 50;
          const cross = dx * item.vector.y - dy * item.vector.x;
          const dot = dx * item.vector.x + dy * item.vector.y;
          expect(cross).toBeCloseTo(0, 10);
          expect(Math.hypot(item.vector.x, item.vector.y)).toBeCloseTo(1, 10);
          expect(item.relation === 'out' ? dot > 0 : dot < 0).toBe(true);
        }
        if (wrapper !== 'B') {
          const html = renderAttentionStimulus(trial, 'stimulus');
          const arrows = [...html.matchAll(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/g)];
          expect(arrows).toHaveLength(5);
          arrows.forEach((arrow, index) => {
            const i = trial.items[index];
            const angle = Number(arrow[3]) * Math.PI / 180;
            expect(Number(arrow[1])).toBe(i.position.x);
            expect(Number(arrow[2])).toBe(i.position.y);
            expect(Math.cos(angle)).toBeCloseTo(i.vector.x, 10);
            expect(Math.sin(angle)).toBeCloseTo(i.vector.y, 10);
          });
        }
      });
    }
    it(`${wrapper}: briefing embeds the unmodified real renderer and truthful caption`, () => {
      const trial = attentionInstructionTrial(wrapper, wrapper === 'B' ? 'in' : 'out');
      const html = renderAttentionInstruction(wrapper);
      const out = trial.items.filter(i => i.relation === 'out').length;
      expect(html).toContain(renderAttentionStimulus(trial, 'stimulus'));
      expect(html).toContain(`${out} OUT · ${5-out} IN — answer: ${trial.correctResponse.toUpperCase()}`);
      expect(html).toContain('Untimed example.');
      if (wrapper === 'B') {
        expect(html.match(/class="optic-dot"/g)).toHaveLength(80);
        expect(html).not.toContain('class="stimulus-arrows"');
      }
      if (wrapper === 'C') {
        expect(html).toContain('class="emotion-face"');
        expect(html).toContain('The face does not determine the answer.');
      }
    });
  }
  it('mixed briefing previews both the static and flow carriers, not an arbitrary arrow icon', () => {
    const html = renderAttentionInstruction('AB_MIXED');
    expect(html).toContain('data-attention-example="A"');
    expect(html).toContain('data-attention-example="B"');
    expect(html.match(/<figure /g)).toHaveLength(2);
  });
  it('generation is deterministic and does not alter the scored trial stream', () => {
    const input = {sessionId:'scored-control',trialIndex:3,wrapper:'A',frame:'relational'} as const;
    const before = generateAttentionTrial(input);
    for (const w of wrappers) renderAttentionInstruction(w);
    expect(generateAttentionTrial(input)).toEqual(before);
    expect(attentionInstructionTrial('A')).toEqual(attentionInstructionTrial('A'));
  });
  it('the active briefing delegates to the shared example helper for Attention only', () => {
    const source = studioSource;
    expect(source).toContain("node==='attention'?renderAttentionInstruction(wr)");
    expect(source).not.toContain('st-signal-orbit');
    expect(source).not.toContain('Illustrative cue only');
  });
});
