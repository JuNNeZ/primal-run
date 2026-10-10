'use strict';
// Run CLI scenarios separately so each report retains target, biome and policy.
const {spawnSync}=require('node:child_process'),path=require('node:path');
for(const [target,stage]of [['carnotaurus',0],['deinosuchus',1],['tyrannosaurus',3]])for(const policy of ['cautious','aggressive']){
 const out=path.join(__dirname,'../PRIMAL_RUN_Game/balance_runs/evolution_duel_'+target+'_'+policy);
 const r=spawnSync(process.execPath,[path.join(__dirname,'simulate_balance.cjs'),'--species','all','--profiles','baseline,tradeoff,species,legendary','--runs','3','--seconds','90','--seed','7300','--mode','duel','--boss','true','--target',target,'--stage',String(stage),'--policy',policy,'--out',out],{stdio:['ignore','ignore','inherit']});
 if(r.status!==0)process.exit(r.status||1);
}
