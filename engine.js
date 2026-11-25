(()=> {
  "use strict";
  const towers={
    arrow:{name:"游侠箭塔",brief:"单体 · 快速射击",cost:60,range:65,damage:13,delay:.66,description:"射速最快，优先攻击最接近城门的敌人。"},
    cannon:{name:"重装炮塔",brief:"范围 · 爆炸伤害",cost:90,range:59,damage:31,delay:1.95,description:"炮弹对命中点周围 22 格内的敌人造成范围伤害。"},
    frost:{name:"寒霜法塔",brief:"控制 · 冻裂护甲",cost:75,range:57,damage:7,delay:.88,description:"命中后减速 45%，持续 2 秒。受寒或冻结时，重甲敌人的箭伤减免失效。"},
    storm:{name:"引雷塔",brief:"闪电 · 连锁三敌",cost:105,range:56,damage:18,delay:1.55,description:"闪电会从命中目标向附近 29 格内的敌人再跳两次，每跳保留七成伤害。"},
    venom:{name:"荆毒塔",brief:"毒刺 · 持续侵蚀",cost:85,range:61,damage:8,delay:1.12,description:"优先攻击未中毒的敌人。毒刺命中后持续 4 秒，每秒造成命中伤害一半的毒伤。"},
    ballista:{name:"破甲重弩",brief:"远射 · 狙击重甲",cost:120,range:89,damage:40,delay:2.7,description:"优先瞄准重甲兵和领主，命中重甲时造成 1.5 倍伤害。"}
  };
  const units={
    scout:{name:"林地斥候",hint:"轻装步兵，成群沿山道前进。",hp:32,speed:26,bounty:3,leak:1},
    runner:{name:"赤鬃疾狼",hint:"耐受炮火，受到的炮击伤害降低 40%。用箭塔截击。",hp:30,speed:41,bounty:5,leak:1},
    brute:{name:"铁甲兽人",hint:"护甲抵消 55% 箭伤。炮击可穿甲，寒霜可冻裂护甲。",hp:92,speed:19,bounty:10,leak:2},
    boss:{name:"赤岩领主",hint:"重甲首领，突破城门将扣除 8 点生命。",hp:600,speed:16,bounty:50,leak:8}
  };
  const waves=[
    {scout:8},{scout:8,runner:4},{runner:11,scout:4},{brute:3,scout:11},
    {runner:9,brute:4,scout:6},{brute:7,scout:12},{runner:15,brute:5},
    {brute:9,runner:8,scout:5},{brute:10,runner:12},{boss:1,brute:9,runner:10,scout:6}
  ];
  const levelStats=(type,level)=>{const t=towers[type];return {range:t.range+(level-1)*5,damage:Math.round(t.damage*(1+.65*(level-1))),delay:t.delay/(1+.12*(level-1))}};
  const upgradeCost=t=>Math.round(towers[t.type].cost*(t.level===1?.8:1.2));
  const waveReward=wave=>15+wave*2;
  const newCamp=()=>({wood:9,stone:0,people:3,loggers:2,level:1,shortfall:0});
  const buildGrid={size:22,x:30,z:36,columns:20,rows:10};
  const gridCells=Array.from({length:buildGrid.columns*buildGrid.rows},(_,i)=>({
    x:buildGrid.x+(i%buildGrid.columns)*buildGrid.size,
    z:buildGrid.z+Math.floor(i/buildGrid.columns)*buildGrid.size
  }));
  function snapSite(x,z){
    return [buildGrid.x+Math.round((x-buildGrid.x)/buildGrid.size)*buildGrid.size,
      buildGrid.z+Math.round((z-buildGrid.z)/buildGrid.size)*buildGrid.size];
  }
  function arrowDamage(enemy,damage){
    const armored=enemy.type==="brute"||enemy.type==="boss";
    return armored&&!enemy.slow&&!enemy.frozen?damage*.45:damage;
  }
  class Battle {
    constructor(path,pads,onEvent=()=>{},stage=null){
      this.path=path;this.baseSites=pads.length;this.supplies=stage?.supplies||[];
      this.pads=pads.concat(this.supplies.map(c=>[c.x,c.z]));this.onEvent=onEvent;this.stage=stage;this.waves=stage?.lineup||waves;this.sections=[];this.length=0;
      for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;this.sections.push({a,b,len,start:this.length});this.length+=len}
      const post=this.point(Math.min(67,this.length*.12));
      this.post=stage?.post||[post.x+Math.cos(post.yaw)*13,post.y-Math.sin(post.yaw)*13];this.reset();
    }
    reset(){this.encounterVersion=2;this.doctrine=null;this.mastery={};this.volleyCharge=100;this.bannerTime=0;this.impacts=[];this.floaters=[];this.deaths=[];this.combo=0;this.comboUntil=0;this.bestCombo=0;
      this.camp=newCamp();this.cleared=new Set();this.pads.length=this.fixedSites;this.supplyHealth=this.supplies.map(c=>c.hp);this.markedSupply=null;this.gold=(this.stage?.gold??180)+60;this.health=20;this.wave=0;this.kills=0;this.phase="ready";this.paused=false;this.speed=1;this.towers=this.pads.map(()=>null);this.enemies=[];this.shots=[];this.particles=[];this.queue=[];this.spawnIn=0;this.time=0;this.defeated=0;this.serial=0;this.waveSize=0;this.ranger={x:this.post[0],z:this.post[1],yaw:-.25,target:null,cycle:0,released:false}}
    chooseDoctrine(id){
      if(!this.stage?.opening||this.phase!=="ready"||this.wave<2||this.doctrine||!["rapid","siege"].includes(id))return false;
      this.doctrine=id;this.onEvent("doctrine");return true;
    }
    towerStats(t){
      const s=levelStats(t.type,t.level);
      if(this.doctrine==="rapid"&&t.type==="arrow")s.delay/=1.3;
      if(this.doctrine==="siege"&&t.type==="cannon")s.damage=Math.round(s.damage*1.3);
      if(this.bannerTime>0)s.delay/=1.3;
      return s;
    }
    get canVolley(){return (this.stage?.opening||this.mastery.volley)&&this.phase==="fight"&&!this.paused&&this.volleyCharge>=100&&this.enemies.some(e=>e.hp>0)}
    volley(){
      if(!this.canVolley)return false;
      this.volleyCharge=0;if(this.mastery.banner)this.bannerTime=6;
      for(const e of this.enemies){if(e.hp<=0)continue;this.hit(e,e.type==="boss"?35:65,"volley",e.x-12,e.y-8);e.slow=Math.max(e.slow||0,2);
        this.shots.push({x:e.x-12,y:e.y-8,tx:e.x,ty:e.y,type:"volley",ttl:.38,max:.38});this.impact(e.x,e.y,"#ffdf82",15);
      }
      this.onEvent("volley");return true;
    }
    impact(x,z,color,size,kind="ring"){
      const life=kind==="blast"?.8:kind==="death"?.7:.35;
      this.impacts.push({x,z,color,size,kind,ttl:life,max:life});if(this.impacts.length>40)this.impacts.shift();
    }
    hit(e,damage,type,x,z,showNumber=true){
      e.hp-=damage;e.flash=.22;e.hitPose=e.d;
      const length=Math.hypot(e.x-x,e.y-z)||1,power=type==="cannon"?3.2:type==="ballista"?2.5:1.3;
      e.recoilX=(e.x-x)/length*power;e.recoilZ=(e.y-z)/length*power;
      const big=type==="cannon"||type==="ballista";
      if(showNumber&&(big||e.type==="boss")){
        this.floaters.push({x:e.x,z:e.y,text:"−"+Math.round(damage),kind:"damage",ttl:.65,max:.65});
        if(this.floaters.length>32)this.floaters.shift();
      }
    }
    get hasEffects(){return !!(this.impacts.length||this.deaths.length||this.floaters.length||this.particles.length||this.shots.length||this.towers.some(t=>t?.kick>0))}
    tickEffects(dt){
      for(const t of this.towers)if(t)t.kick=Math.max(0,(t.kick||0)-dt);
      for(const key of ["impacts","floaters","deaths","shots"]){for(const p of this[key])p.ttl-=dt;this[key]=this[key].filter(p=>p.ttl>0)}
      for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.ttl-=dt}this.particles=this.particles.filter(p=>p.ttl>0);
    }
    get ended(){return this.phase==="won"||this.phase==="lost"}
    get fixedSites(){return this.baseSites+this.supplies.length}
    campForecast(wave){
      const c=this.camp,storm=wave>0&&wave%3===0;
      const fuel=storm?10+2*Math.floor(wave/9)-2*(c.level-1):2;
      return {storm,fuel,wood:c.loggers*2,stone:(c.people-c.loggers)*2};
    }
    get cold(){return this.phase==="fight"&&this.wave%3===0&&this.camp.shortfall>0}
    get furnaceSite(){const [x,z]=this.path.at(-1);return [x-12,z+15]}
    get furnaceCost(){return {wood:4*this.camp.level,stone:6*this.camp.level}}
    assignLoggers(n){
      if(this.phase!=="ready"||!Number.isInteger(n)||n<0||n>this.camp.people||n===this.camp.loggers)return false;
      this.camp.loggers=n;this.onEvent("camp");return true;
    }
    upgradeFurnace(){
      const c=this.camp,cost=this.furnaceCost;
      if(this.phase!=="ready"||c.level>=3||c.wood<cost.wood||c.stone<cost.stone)return false;
      c.wood-=cost.wood;c.stone-=cost.stone;c.level++;this.onEvent("camp");return true;
    }
    collectFuel(amount){
      const c=this.camp,paid=Math.min(amount,c.shortfall);
      c.shortfall-=paid;c.wood+=amount-paid;
    }
    placementError(x,z){
      if(!Number.isFinite(x)||!Number.isFinite(z)||!this.terrain)return "请选择战场空地";
      if(x<buildGrid.x||x>buildGrid.x+(buildGrid.columns-1)*buildGrid.size||
          z<buildGrid.z||z>buildGrid.z+(buildGrid.rows-1)*buildGrid.size)return "请选择网格内的空地";
      const [gx,gz]=snapSite(x,z);
      if(Math.abs(x-gx)>.01||Math.abs(z-gz)>.01)return "请选择网格中心";
      const blocked=this.terrain.landError(x,z);
      if(blocked)return blocked;
      if(this.terrain.props.some(p=>!this.cleared.has(p.id)&&Math.hypot(x-p.x,z-p.z)<p.r+7))return "先清除这里的树木或石块";
      if(this.pads.some(([px,pz],i)=>(this.towers[i]||this.supplyHealth[i-this.baseSites]>0)&&Math.hypot(x-px,z-pz)<17))return "与防御塔或物资箱太近";
      return "";
    }
    buildAt(x,z,type){
      [x,z]=snapSite(x,z);
      if(this.ended||!towers[type]||this.gold<towers[type].cost||this.placementError(x,z))return false;
      let i=this.towers.findIndex((t,n)=>n>=this.fixedSites&&!t);
      if(i<0)i=this.pads.length;
      this.pads[i]=[x,z];return this.build(i,type);
    }
    clearProp(id){
      const p=this.terrain?.props.find(o=>o.id===id);
      if(!p||this.ended||this.cleared.has(id)||this.gold<p.cost)return false;
      this.gold-=p.cost;this.cleared.add(id);
      if(p.kind==="tree")this.collectFuel(4);else this.camp.stone+=3;
      this.onEvent("landClear");return true;
    }
    get clearedSupplies(){return this.supplyHealth.filter(hp=>hp===0).length}
    markSupply(j){
      if(this.ended||!this.supplyHealth[j])return false;
      this.markedSupply=this.markedSupply===j?null:j;return true;
    }
    point(d){const s=this.sections.find(v=>d<v.start+v.len)||this.sections[this.sections.length-1];const t=Math.max(0,Math.min(1,(d-s.start)/s.len));return {x:s.a[0]+(s.b[0]-s.a[0])*t,y:s.a[1]+(s.b[1]-s.a[1])*t,yaw:Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1])}}
    build(i,type){const t=towers[type];if(this.ended||!t||!this.pads[i]||this.supplyHealth[i-this.baseSites]>0||this.towers[i]||this.towers.some((other,n)=>other&&Math.hypot(this.pads[n][0]-this.pads[i][0],this.pads[n][1]-this.pads[i][1])<17)||this.gold<t.cost||(this.terrain&&this.placementError(...this.pads[i])))return false;this.gold-=t.cost;this.towers[i]={type,level:1,spent:t.cost,cd:0};this.onEvent("build");return true}
    upgrade(i){const t=this.towers[i];if(this.ended||!t||t.level>=3||this.gold<upgradeCost(t))return false;const cost=upgradeCost(t);this.gold-=cost;t.spent+=cost;t.level++;this.onEvent("upgrade");return true}
    sell(i){const t=this.towers[i];if(this.ended||!t)return false;this.gold+=Math.floor(t.spent*.65);this.towers[i]=null;this.onEvent("sell");return true}
    start(){
      if(this.phase!=="ready"||this.paused)return false;
      const counts={...this.waves[this.wave]};this.wave++;this.phase="fight";this.queue=[];this.defeated=0;
      const supply=this.campForecast(this.wave),available=this.camp.wood+supply.wood;
      this.camp.wood=Math.max(0,available-supply.fuel);this.camp.stone+=supply.stone;
      this.camp.shortfall=supply.storm?Math.max(0,supply.fuel-available):0;
      const boss=counts.boss||0;delete counts.boss;
      const formation=this.stage?.formations?.[this.wave-1];
      const wolves=formation==="pack"?counts.runner:0;
      if(wolves)delete counts.runner;
      if(formation==="vanguard"||formation==="escort"){
        const front=Math.ceil((counts.brute||0)/2);
        for(let i=0;i<front;i++)this.queue.push("brute");
        counts.brute-=front;
      }
      while(Object.values(counts).some(n=>n>0))for(const type of Object.keys(counts))if(counts[type]>0){this.queue.push(type);counts[type]--}
      for(let b=0;b<boss;b++)this.queue.splice(Math.floor(this.queue.length*(.45+.30*b)),0,"boss");
      if(wolves)this.queue.splice(Math.floor(this.queue.length*.45),0,...Array(wolves).fill("runner"));
      this.waveSize=this.queue.length;this.spawnIn=.3;this.onEvent("start");return true;
    }
    burst(x,y,color,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,speed=9+Math.random()*25;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-8,color,ttl:.3+Math.random()*.25})}if(this.particles.length>160)this.particles.splice(0,this.particles.length-160)}
    fire(i,t,target,stats){
      const [x,y]=this.pads[i],type=t.type;
      t.kick=type==="cannon"?.24:.16;
      this.impact(target.x,target.y,type==="frost"?"#a6efff":type==="venom"?"#acd973":"#ffcc78",type==="cannon"?22:type==="frost"?12:5,type==="cannon"?"blast":"ring");
      t.yaw=Math.atan2(target.x-x,target.y-y);const flight=type==="cannon"?.12:.29;this.shots.push({x,y,tx:target.x,ty:target.y,type,ttl:flight,max:flight});
      if(type==="storm"){
        let last=target,damage=stats.damage;const hit=new Set([target]);this.hit(target,damage,type,x,y);
        for(let jump=0;jump<2;jump++){
          let next=null,reach=29;
          for(const e of this.enemies){const d=Math.hypot(e.x-last.x,e.y-last.y);if(e.hp>0&&!hit.has(e)&&d<=reach){next=e;reach=d}}
          if(!next)break;
          damage=Math.round(damage*.7);this.hit(next,damage,type,last.x,last.y);hit.add(next);
          this.shots.push({x:last.x,y:last.y,tx:next.x,ty:next.y,type,arc:true,ttl:.24,max:.24});last=next;
        }
      }else if(type==="venom"){
        this.hit(target,stats.damage,type,x,y);target.poison=4;target.toxin=Math.max(target.toxin||0,stats.damage*.5);
      }else if(type==="ballista")this.hit(target,stats.damage*(["brute","boss"].includes(target.type)?1.5:1),type,x,y);
      else if(type==="cannon"){for(const e of this.enemies){if(Math.hypot(e.x-target.x,e.y-target.y)<=22){const shatter=this.mastery.shatter&&(e.slow>0||e.frozen>0);this.hit(e,stats.damage*(e.type==="runner"?.6:1)*(shatter?1.3:1),type,x,y,e===target||e.type==="boss");if(shatter)this.impact(e.x,e.y,"#acffff",18)}}this.burst(target.x,target.y-3,"#ffc272",18)}
      else{this.hit(target,type==="arrow"?arrowDamage(target,stats.damage):stats.damage,type,x,y);if(type==="frost"){target.slow=2;this.burst(target.x,target.y-3,"#ade6f0",4)}}
      this.onEvent("shot",type);
    }
    clearSupply(i,t,stats){
      const j=this.markedSupply,c=this.supplies[j],[x,y]=this.pads[i];
      if(!c||Math.hypot(c.x-x,c.z-y)>stats.range)return false;
      t.yaw=Math.atan2(c.x-x,c.z-y);
      this.shots.push({x,y,tx:c.x,ty:c.z,type:t.type,ttl:.29,max:.29});
      this.onEvent("shot",t.type);
      if(t.type==="cannon")this.impact(c.x,c.z,"#ffcc78",22,"blast");
      this.supplyHealth[j]=Math.max(0,this.supplyHealth[j]-stats.damage);
      if(!this.supplyHealth[j]){
        this.gold+=c.gold;this.markedSupply=null;
        this.burst(c.x,c.z,"#efc36c",10);this.onEvent("salvage",c);
      }
      return true;
    }
    aimRanger(dt){
      const r=this.ranger;if(!r)return;
      const inReach=e=>e.hp>0&&e.d<this.length&&Math.hypot(e.x-r.x,e.y-r.z)<78;
      let target=this.enemies.find(e=>e.id===r.target&&inReach(e));
      if(!target&&!r.released){
        target=this.enemies.filter(inReach).sort((a,b)=>b.d-a.d)[0];
        if(!target){r.target=null;r.cycle=0;return}
        r.target=target.id;
      }
      if(target)r.yaw=Math.atan2(target.x-r.x,target.y-r.z);
      r.cycle+=dt/1.9;
      if(!r.released&&r.cycle>=.65&&target){
        r.released=true;this.hit(target,arrowDamage(target,9),"ranger",r.x,r.z);
        // The projectile centre starts on the drawn shaft as the string releases.
        const side=-1.15,forward=5.0,cos=Math.cos(r.yaw),sin=Math.sin(r.yaw);
        this.shots.push({x:r.x+side*cos+forward*sin,y:r.z+forward*cos-side*sin,tx:target.x,ty:target.y,type:"ranger",ttl:.36,max:.36});
        this.onEvent("shot","ranger");
      }
      if(r.cycle>=1){r.cycle=0;r.released=false;r.target=null}
    }
    step(dt){
      if(this.paused||this.phase!=="fight")return;
      this.time+=dt;this.spawnIn-=dt;this.bannerTime=Math.max(0,this.bannerTime-dt);
      this.tickEffects(dt);
      if(this.queue.length&&this.spawnIn<=0){
        const type=this.queue.shift(),u=units[type],hp=Math.round(u.hp*(this.stage?.hp||1)*(1+(this.wave-1)*.215));
        this.enemies.push({id:++this.serial,type,hp,maxHp:hp,d:0,slow:0,frozen:0,...this.point(0)});
        if(type==="boss"&&this.stage?.opening?.boss)this.onEvent("boss");
        const pack=this.stage?.formations?.[this.wave-1]==="pack"&&type==="runner"&&this.queue[0]==="runner";
        this.spawnIn+=Math.max(.54,1.05-this.wave*.041)*(this.stage?.rate||1)*(pack ? .5 : 1);
      }
      for(const e of this.enemies){
        if(e.type==="boss"&&this.stage?.opening?.boss&&!e.enraged&&e.hp>0&&e.hp<=e.maxHp*.5){e.enraged=true;this.queue.unshift(...Array(6).fill("runner"));this.waveSize+=6;this.impact(e.x,e.y,"#ff7750",30);this.onEvent("rage")}
        e.flash=Math.max(0,(e.flash||0)-dt);
        if(e.poison>0){e.hp-=Math.min(dt,e.poison)*e.toxin;e.poison=Math.max(0,e.poison-dt);if(!e.poison)e.toxin=0}e.slow=Math.max(0,e.slow-dt);e.frozen=Math.max(0,(e.frozen||0)-dt);if(!e.frozen)e.d+=units[e.type].speed*(e.slow>0?.55:1)*(e.enraged?1.25:1)*dt;Object.assign(e,this.point(e.d))}
      this.aimRanger(dt);
      const towerTime=this.cold?dt*.8:dt;
      for(let i=0;i<this.towers.length;i++){const t=this.towers[i];if(!t)continue;t.cd=Math.max(0,t.cd-towerTime);if(t.cd>0)continue;
        const stats=this.towerStats(t),[x,y]=this.pads[i];let target=null;
        if(this.markedSupply!==null&&this.clearSupply(i,t,stats)){t.cd=stats.delay;continue}
        let priority=-Infinity;
        for(const e of this.enemies){
          if(e.hp<=0||e.d>=this.length||Math.hypot(e.x-x,e.y-y)>stats.range)continue;
          const favored=(t.type==="venom"&&!e.poison)||(t.type==="ballista"&&(e.type==="brute"||e.type==="boss"));
          const score=e.d+(favored?this.length:0);if(score>priority){target=e;priority=score}
        }
        if(target){this.fire(i,t,target,stats);t.cd=stats.delay}
      }
      this.enemies=this.enemies.filter(e=>{
        if(e.hp<=0){this.kills++;this.defeated++;this.gold+=units[e.type].bounty;this.volleyCharge=Math.min(100,this.volleyCharge+9);
          this.combo=this.time<=this.comboUntil?this.combo+1:1;this.comboUntil=this.time+2;this.bestCombo=Math.max(this.bestCombo,this.combo);
          const near=this.floaters.find(f=>f.kind==="gold"&&f.ttl>.85&&Math.hypot(f.x-e.x,f.z-e.y)<18);
          if(near){near.amount+=units[e.type].bounty;near.text="+"+near.amount;near.ttl=1.05}else this.floaters.push({x:e.x,z:e.y,text:"+"+units[e.type].bounty,amount:units[e.type].bounty,kind:"gold",ttl:1.05,max:1.05});if(this.floaters.length>32)this.floaters.shift();
          const life=e.type==="boss"?.95:.55;this.deaths.push({type:e.type,x:e.x,z:e.y,yaw:e.yaw||0,phase:(e.d||0)/(e.type==="runner"?16:12)+(e.id||0)*.13,ttl:life,max:life});if(this.deaths.length>20)this.deaths.shift();
          this.burst(e.x,e.y-4,"#edd687",e.type==="boss"?28:12);this.impact(e.x,e.y,"#ffe9a3",e.type==="boss"?35:12,"death");this.onEvent("kill",e.type);return false}
        if(e.d>=this.length){this.defeated++;this.health=Math.max(0,this.health-units[e.type].leak);this.onEvent("leak");return false}return true;
      });
      if(this.health<=0){this.phase="lost";this.onEvent("lost")}
      else if(!this.enemies.length&&!this.queue.length){
        const before=this.camp.people,gate=this.health;
        if(this.wave%3===0&&!this.cold){
          this.camp.people=Math.min(6,this.camp.people+1);
          this.health=Math.min(20,this.health+this.camp.level-1);
        }
        this.camp.shortfall=0;
        this.phase=this.wave===this.waves.length?"won":"ready";
        if(this.phase==="ready")this.gold+=waveReward(this.wave);
        this.onEvent(this.phase==="won"?"won":"cleared",{rescued:this.camp.people-before,repaired:this.health-gate});
      }
    }
  }
  window.PineGame={Battle,towers,units,waves,levelStats,upgradeCost,waveReward,newCamp,buildGrid,gridCells,snapSite};
})();
