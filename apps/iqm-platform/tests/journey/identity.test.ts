import { describe, expect, it } from 'vitest';
import { COLLECTION_LINKS, TARGET_PATH, collectionMarkMarkup, nodeGlyphMarkup, nodeIdentity, nodeIdentityMarkup, publicNodeLabel } from '../../src/app/studioIdentity';
import { NODE_ORDER, NODE_WORLDS } from '../../src/app/studioModel';

describe('approved collection and capacity identities', () => {
  it('uses exactly seven approved colours, without an eighth centre node', () => {
    const mark = collectionMarkMarkup();
    expect((mark.match(/<circle /g) ?? []).length).toBe(7);
    for (const id of NODE_ORDER) {
      expect(mark).toContain(`data-capacity="${id}"`);
      expect((mark.match(new RegExp(NODE_WORLDS[id].accent, 'g')) ?? []).length).toBe(1);
    }
    expect(mark).not.toContain(TARGET_PATH);
    expect(mark).toContain('aria-hidden="true"');
  });
  it('retains the approved orbital connections, not a causal score', () => {
    expect(COLLECTION_LINKS).toHaveLength(11);
    expect(COLLECTION_LINKS.every(([a,b]) => a !== b && a >= 0 && b >= 0 && a < 7 && b < 7)).toBe(true);
    expect(new Set(COLLECTION_LINKS.map(([a,b]) => [a,b].sort().join(':'))).size).toBe(11);
  });
  it.each(NODE_ORDER)('indexes %s separately from the collection', id => {
    const identity = nodeIdentity(id), markup = nodeIdentityMarkup(id);
    expect(identity.identity).toBe(NODE_WORLDS[id].accent);
    expect(identity.number).toBe(String(NODE_ORDER.indexOf(id)+1).padStart(2,'0'));
    expect(markup).toContain(NODE_WORLDS[id].title);
    expect(markup).toContain(`Node ${identity.number}`);
    expect(markup).toContain(identity.tagline);
    expect(markup).not.toContain('Chapter');
  });
  it('gives Attention the approved target, not the former up arrow', () => {
    expect(nodeGlyphMarkup('attention')).toContain(TARGET_PATH);
    expect(nodeIdentity('attention').tagline).toBe('Find the signal.');
    expect(nodeGlyphMarkup('attention')).not.toContain('M12 20V4');
  });
  it('renames only exact authored labels, not user text or persistence identifiers', () => {
    expect(publicNodeLabel('Begin the chapter')).toBe('Begin the node');
    expect(publicNodeLabel('Replay this chapter')).toBe('Replay node introduction');
    for (const untouched of ['chapter','chapter-begin','My chapter about work','<script>chapter</script>','iqm-platform:chapter-seen:v1']) expect(publicNodeLabel(untouched)).toBe(untouched);
  });
});
