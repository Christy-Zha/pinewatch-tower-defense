const assert=require('node:assert/strict');global.window=global;global.localStorage={getItem(){return this.value||null},setItem(k,v){this.value=v}};
for(const f of ['campaign','opening','engine','progress','scenery'])require('../'+f+'.js');
const {Battle,levelStats}=PineGame,P=PineProgress,profile=P.load(),solutions=[];
function make(chapter){const s=PineCampaign.chapters[chapter],g=new Battle(s.path,s.pads,()=>{},s),m={vertices:[],face(){},box(){},frustum(){}};g.terrain=PineScenery.build(m,s,chapter,'pine',true);return g}
assert.deepEqual(PineCampaign.chapters.slice(0,3).map(s=>s.waves),[5,6,7]);
for(let chapter=0;chapter<3;chapter++){
 let won=false;
 for(let strategy=0;strategy<24&&!won;strategy++){
  const g=make(chapter);P.applyMastery(profile,g);let rages=0,casts=0;g.onEvent=e=>{if(e==='rage')rages++};
  const samples=Array.from({length:Math.ceil(g.length/4)},(_,j)=>g.point(j*4)),radius=62-Math.floor(strategy%12/4)*5,weight=Math.floor(strategy/12)*.35;
  const cells=PineGame.gridCells.filter(c=>!g.placementError(c.x,c.z)).map(c=>({...c,score:samples.reduce((n,p,j)=>n+(Math.hypot(c.x-p.x,c.z-p.y)<radius?1+weight*j/samples.length:0),0)})).sort((a,b)=>b.score-a.score);
  const order=[[0,'arrow'],[1,'cannon'],[2,'frost'],[0,'up'],[1,'up'],[0,'up'],[3,'arrow'],[1,'up'],[2,'up'],[3,'up']];
  for(let j=4;j<cells.length;j++)order.push([j,j%3?'arrow':'cannon'],[j,'up'],[j,'up']);
  const indices={};let step=0;
  function buy(){while(step<order.length){const [j,type]=order[step],c=cells[j];if(type==='up'){if(!g.upgrade(indices[j]))break}else{if(!g.buildAt(c.x,c.z,type))break;indices[j]=g.pads.length-1}step++}}
  while(!g.ended){if(g.wave>=2&&!g.doctrine)assert(g.chooseDoctrine(strategy%2?'siege':'rapid'));buy();assert(g.start());for(let t=0;g.phase==='fight'&&t<16000;t++){if(t%50===0)buy();if(g.canVolley&&(g.enemies.filter(e=>e.hp>0).length>=6||g.enemies.some(e=>e.enraged))){g.volley();casts++}g.step(.05)}assert.notEqual(g.phase,'fight')}
  won=g.phase==='won';if(won){assert(casts>0);if(chapter===2)assert.equal(rages,1);console.log({chapter:chapter+1,health:g.health,seconds:Math.round(g.time),casts,rages,strategy,bestCombo:g.bestCombo});
   profile.chapter=chapter;profile.run=null;const paid=P.settle(profile,g),cards=profile.cards.hail;assert.equal(P.settle(profile,g),null);assert.equal(profile.cards.hail,cards);P.save(profile,g);
   const restored=make(chapter);assert(P.restore(P.load(),restored));assert.equal(restored.doctrine,g.doctrine);assert.equal(restored.volleyCharge,g.volleyCharge);assert.equal(restored.waves.length,g.waves.length);
   solutions.push({cells,order,doctrine:g.doctrine});
  }
 }
 assert(won,'Chapter '+(chapter+1)+' must be winnable');
}
const g=make(0);P.applyMastery(profile,g);assert.deepEqual(g.mastery,{volley:true,shatter:true,banner:true});
g.wave=2;assert(g.chooseDoctrine('rapid'));assert(!g.chooseDoctrine('siege'));assert(g.towerStats({type:'arrow',level:1}).delay<levelStats('arrow',1).delay);
g.phase='fight';g.enemies=[{id:1,type:'boss',hp:1000,maxHp:1000,x:100,y:100,d:20,slow:0,frozen:0}];assert(g.volley());assert.equal(g.bannerTime,6);assert.equal(g.enemies[0].hp,965);assert(!g.volley());
g.paused=true;g.volleyCharge=100;assert(!g.volley());g.paused=false;
const legacy=make(2),legacyProfile=P.load();legacyProfile.chapter=2;legacy.wave=8;P.save(legacyProfile,legacy);const old=P.load();delete old.run.state.encounterVersion;const restored=make(2);assert(P.restore(old,restored));assert.equal(restored.waves.length,9);assert.equal(restored.stage.opening,null);
for(let chapter=0;chapter<3;chapter++){const empty=make(chapter);while(!empty.ended){empty.start();for(let j=0;empty.phase==='fight'&&j<16000;j++)empty.step(.05)}assert.equal(empty.phase,'lost')}
// Verify the permanent frost/cannon interaction independently of the campaign strategy.
const frost=make(0);frost.mastery.shatter=true;frost.pads.push([100,100]);const enemy={type:'brute',hp:1000,x:100,y:100,slow:1};frost.enemies=[enemy];frost.fire(frost.pads.length-1,{type:'cannon'},enemy,levelStats('cannon',1));assert.equal(enemy.hp,1000-31*1.3);
const siege=make(0);assert(!siege.chooseDoctrine('siege'));siege.wave=2;assert(siege.chooseDoctrine('siege'));assert.equal(siege.towerStats({type:'cannon',level:1}).damage,Math.round(31*1.3));
const rage=make(2);rage.wave=6;rage.start();rage.queue=[];rage.enemies=[{id:1,type:'boss',hp:499,maxHp:1000,d:100,slow:0,frozen:0,...rage.point(100)}];rage.step(.05);assert.equal(rage.queue.length,6);profile.chapter=2;profile.run=null;P.save(profile,rage);
const resumed=make(2);assert(P.restore(P.load(),resumed));resumed.paused=false;resumed.step(.05);assert.equal(resumed.queue.length+resumed.enemies.filter(e=>e.type==='runner').length,6,'Reload must not summon a second reinforcement group');

console.log('Opening campaign, boss reinforcement, charge rules, doctrines, rewards, persistence, legacy saves and empty-defense loss passed.');
