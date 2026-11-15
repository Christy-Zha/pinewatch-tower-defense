(() => {
  "use strict";
  const {chapters,items}=PineCampaign;
  const key="pinewatch.chronicle.v1",fields=["gold","health","wave","kills","phase","towers","enemies","queue","time","spawnIn","defeated","serial","waveSize","speed","ranger"];
  const fresh=()=>({version:1,chapter:0,unlocked:0,bank:80,cards:{hail:1,blaze:0,mend:0},skins:["pine"],skin:"pine",records:{},run:null});
  function load(){
    try{const p=JSON.parse(localStorage.getItem(key));if(p?.version===1&&Number.isInteger(p.chapter)&&chapters[p.chapter]&&Number.isInteger(p.unlocked)&&p.unlocked>=p.chapter&&p.unlocked<chapters.length&&p.cards&&Array.isArray(p.skins)&&p.skins.includes(p.skin)&&Number.isSafeInteger(p.bank)&&p.bank>=0&&p.records){if(p.records[7]&&p.unlocked===7)p.unlocked=8;return p}}catch{}return fresh()
  }
  function restore(p,g){
    const r=p.run;if(!r||r.chapter!==p.chapter||!r.state)return false;const s=r.state;
    const extra=s.customSites??[];
    if(!Array.isArray(extra)||extra.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))return false;
    if(!Number.isInteger(s.wave)||s.wave<0||s.wave>g.waves.length||!Array.isArray(s.towers)||!(s.towers.length===g.fixedSites+extra.length||(!extra.length&&s.towers.length===g.baseSites))||!["fight","ready","lost","won"].includes(s.phase))return false;
    g.pads=g.pads.slice(0,g.fixedSites).concat(extra);
    g.cleared=new Set(Array.isArray(s.cleared)?s.cleared:[]);
    for(const f of fields)if(s[f]!==undefined)g[f]=s[f];
    const c=s.camp;
    if(c&&["wood","stone","people","loggers","level","shortfall"].every(k=>Number.isSafeInteger(c[k])&&c[k]>=0)&&
        c.people>=3&&c.people<=6&&c.loggers<=c.people&&c.level>=1&&c.level<=3)g.camp={...c};
    g.towers=Array.from({length:g.pads.length},(_,i)=>s.towers[i]||null);
    g.supplyHealth=g.supplies.map((c,i)=>Number.isFinite(s.supplyHealth?.[i])?Math.max(0,Math.min(c.hp,s.supplyHealth[i])):c.hp);
    g.markedSupply=g.supplyHealth[s.markedSupply]>0?s.markedSupply:null;
    g.paused=s.phase==="fight";return true;
  }
  function save(p,g){
    const state={camp:g.camp,supplyHealth:g.supplyHealth,markedSupply:g.markedSupply,customSites:g.pads.slice(g.fixedSites),cleared:[...g.cleared]};for(const f of fields)state[f]=g[f];
    p.run={chapter:p.chapter,state,payout:p.run?.payout||null};
    try{
      const raw=localStorage.getItem(key);let stored;
      try{stored=JSON.parse(raw)}catch{}
      if(stored?.resetId&&stored.resetId!==p.resetId)return true;
      localStorage.setItem(key,JSON.stringify(p));return true;
    }catch{return false}
  }
  function resetCampaign(p){
    const next={...fresh(),resetId:Date.now().toString(36)+Math.random().toString(36).slice(2)};
    try{localStorage.setItem(key,JSON.stringify(next))}catch{return false}
    Object.assign(p,next);return true;
  }
  function purchase(p,id){
    const i=items[id];if(!i)return false;
    if(i.kind==="skin"&&p.skins.includes(id)){p.skin=id;return true}if(p.bank<i.price)return false;p.bank-=i.price;
    if(i.kind==="skin"){p.skins.push(id);p.skin=id}else p.cards[id]=(p.cards[id]||0)+1;return true;
  }
  function allowed(g,id){return !g.ended&&(id==="mend"?g.health>0&&g.health<20:g.phase==="fight"&&g.enemies.some(e=>e.hp>0))}
  function use(p,g,id){
    if(!p.cards[id]||!allowed(g,id))return false;p.cards[id]--;
    if(id==="mend")g.health=Math.min(20,g.health+5);
    else for(const e of g.enemies)if(id==="hail")e.frozen=4;else if(id==="blaze")e.hp-=e.type==="boss"?36:72;
    return true;
  }
  function settle(p,g){
    if(g.phase!=="won"||p.run?.payout)return null;
    const first=!p.records[p.chapter],bonus=first?45+p.chapter*10:0,earned=g.gold+bonus;
    p.bank+=earned;const previous=p.records[p.chapter];p.records[p.chapter]={health:Math.max(previous?.health||0,g.health),wins:(previous?.wins||0)+1,salvaged:!!previous?.salvaged||(g.supplies.length>0&&g.clearedSupplies===g.supplies.length)};
    p.unlocked=Math.min(chapters.length-1,Math.max(p.unlocked,p.chapter+1));p.run=p.run||{};p.run.payout={earned,bonus};return p.run.payout;
  }
  window.PineProgress={key,load,save,restore,resetCampaign,purchase,allowed,use,settle};
})();
