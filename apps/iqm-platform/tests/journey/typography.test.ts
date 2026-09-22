import { describe, expect, it } from 'vitest';
import { headingAccent, headingSegments } from '../../src/app/studioTypography';

describe('website-aligned editorial title treatment', () => {
  it.each([
    'Navigate possibility. Build intelligence.',
    'What matters now?',
    'Find the signal.',
    'Same skill. New surface.',
    'A simple rule. A deliberate choice.',
    'What did reality say?',
    'What would you keep?',
    'My adaptive rules.',
    'AI expands the search. You keep the goal.',
  ])('preserves the exact wording of %s', text => {
    const p=headingSegments(text)!;
    expect(p).not.toBeNull();
    expect(p.before+p.accent+p.after).toBe(text);
    expect(p.accent.length).toBeGreaterThan(0);
  });
  it('gives the two-part brand heading its own second line and underline', () => {
    expect(headingAccent('Navigate possibility. Build intelligence.')).toEqual({phrase:'Build intelligence.',newLine:true,underline:true});
  });
  it('does not guess formatting for user text, HTML or game results', () => {
    for(const text of ['<img src=x onerror=alert(1)>','Accuracy 91%','Out','constructor','__proto__','My private note']) {
      expect(headingAccent(text)).toBeNull();
      expect(headingSegments(text)).toBeNull();
    }
  });
});
