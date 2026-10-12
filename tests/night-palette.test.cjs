'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const palette=require('../PRIMAL_RUN_Game/palette.json').colors.map(c=>c.slice(1));
const C=require('../PRIMAL_RUN_Game/src/core.js');
test('night ramp covers the fixed palette without introducing colours',()=>{
  assert.deepEqual(Object.keys(C.NIGHT_PALETTE).sort(),palette.slice().sort());
  for(const value of Object.values(C.NIGHT_PALETTE)) assert.ok(palette.includes(value));
  assert.equal(C.NIGHT_PALETTE['151b19'],'151b19');
  assert.notEqual(C.NIGHT_PALETTE['e8ece1'],C.NIGHT_PALETTE['151b19']);
  const manifest=require('../PRIMAL_RUN_Game/night_palette_manifest.json');
  assert.deepEqual(manifest.mapping,C.NIGHT_PALETTE);
});
