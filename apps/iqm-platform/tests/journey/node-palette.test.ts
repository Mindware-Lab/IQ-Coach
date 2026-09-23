import { describe, expect, it } from 'vitest';
import manifestText from '../../src/theme/synergy-node-palette.json?raw';
import css from '../../src/theme/synergy-node-palette.css?raw';
import { NODE_WORLDS } from '../../src/app/studioModel';
import type { NodeId } from '../../src/types/node';
const palette = JSON.parse(manifestText);
const approved = ['#22AAFF','#9B7AFF','#ED74AB','#FFAB63','#F6C64B','#31C89B','#40BEC7'];
function luminance(hex: string) {
  const c = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function contrast(a: string,b: string) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
describe('approved cross-product capacity palette', () => {
  it('preserves the exact seven colours and their order', () => {
    expect(palette.nodes.map((n: {identity:string})=>n.identity)).toEqual(approved);
    expect(palette.brand).toEqual({blue:'#22AAFF',ink:'#0A2550',lime:'#CCFF66'});
  });
  for (const n of palette.nodes) {
    it(`keeps ${n.title} consistent between the model, shared tokens and chart`, () => {
      const w=NODE_WORLDS[n.appId as NodeId];
      expect(w.accent).toBe(n.identity);
      expect(w.action).toBe(n.deep);
      expect(w.soft).toBe(n.wash);
      expect(css).toContain(`--iqm-${n.id}-identity: ${n.identity};`);
      expect(contrast(n.identity,palette.brand.ink)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(n.wash,n.deep)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
