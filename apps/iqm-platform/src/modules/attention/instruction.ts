import { generateAttentionTrial, type AttentionTrial } from './game/trial';
import { renderAttentionStimulus } from './game/stimulus';
import type { WrapperMode } from '../../types/game';
import './instruction.css';

/** An untimed teaching example, generated independently of scored sessions. */
export function attentionInstructionTrial(
  wrapper: 'A' | 'B' | 'C',
  answer: 'in' | 'out' = 'out',
): AttentionTrial {
  // Use the real generator, not hand-positioned glyphs or illustrative compass arrows.
  // A local deterministic seed cannot advance or reveal a participant's trial stream.
  for (let trialIndex = 0; trialIndex < 64; trialIndex += 1) {
    const trial = generateAttentionTrial({
      sessionId: `instruction-${wrapper}-${answer}`,
      trialIndex,
      wrapper,
      frame: 'relational',
      ratio: '4:1',
      exposureMs: 700,
    });
    if (trial.correctResponse === answer) return trial;
  }
  throw new Error('Unable to generate the requested Attention teaching example.');
}

export function renderAttentionInstruction(mode: WrapperMode): string {
  const wrappers: ('A' | 'B' | 'C')[] = mode === 'AB_MIXED' ? ['A', 'B'] : [mode];
  const figures = wrappers.map(wrapper => {
    const trial = attentionInstructionTrial(wrapper, wrapper === 'B' ? 'in' : 'out');
    const outCount = trial.items.filter(item => item.relation === 'out').length;
    const inCount = trial.items.length - outCount;
    const answer = trial.correctResponse.toUpperCase();
    const carrier = wrapper === 'B' ? 'Optic Flow' : wrapper === 'C' ? 'Emotional Distractor' : 'Static / Polar';
    const operation = wrapper === 'B'
      ? 'Each patch moves towards or away from the centre. Follow the motion, not an arrow icon.'
      : 'Every arrow points towards or away from the centre. Count the majority, not the compass direction.';
    return `<figure class="st-attention-example" data-attention-example="${wrapper}" data-example-answer="${answer}" role="img" aria-label="${carrier} worked example: ${outCount} OUT, ${inCount} IN. The majority answer is ${answer}.">
      ${renderAttentionStimulus(trial, 'stimulus')}
      <figcaption>
        <span class="st-example-kicker">${carrier} · worked example</span>
        <strong>${outCount} OUT · ${inCount} IN — answer: ${answer}</strong>
        <p>${operation}${wrapper === 'C' ? ' The face does not determine the answer.' : ''}</p>
        <small>Untimed example. The game uses brief displays and new trials.</small>
      </figcaption>
    </figure>`;
  }).join('');
  return `<div class="st-attention-examples${wrappers.length > 1 ? ' is-mixed' : ''}">${figures}</div>`;
}
