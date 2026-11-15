(()=> {
  "use strict";
  const $=id=>document.getElementById(id), make=(tag,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;return el};
  const glyphs={
    heart:'<path fill="currentColor" stroke="none" d="M2 5h3V3h5v2h4V3h5v2h3v8h-3v3h-3v3h-3v2h-2v-2H8v-3H5v-3H2z"/><path d="M5 7h4" stroke="#ffd8b7"/>',
    coins:'<g fill="#c58c36" stroke="#f2c56b" stroke-width="1.5"><path d="M3 11h12v7l-3 2H6l-3-2z"/><path d="M9 6h12v7l-3 2h-6l-3-2z"/><path fill="#f4cc74" d="m9 6 3-2h6l3 2-3 2h-6z"/></g><path d="M5 15h7m0-5h6" stroke="#ffe298" stroke-width="1"/>',
    coin:'<path fill="#c58b35" stroke="#e7b354" d="M7 3h10l4 4v10l-4 4H7l-4-4V7z"/><path stroke="#ffe5a0" d="M8 7h6m-7 1v7m5-6v7"/>',
    flag:'<path d="M5 21V3m1 1h14l-3 4 3 4H6" fill="none"/><path d="M8 5h9l-2 3 2 2H8z" fill="currentColor" stroke="none"/>',
    mute:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9l5 6m0-6-5 6"/>',sound:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8q4 4 0 8m3-11q7 7 0 14"/>',
    book:'<path d="M3 4q5-1 9 2 4-3 9-2v14q-5-1-9 2-4-3-9-2zM12 6v14"/>',
    map:'<path d="m2 5 6-2 8 3 6-2v15l-6 2-8-3-6 2zM8 3v15m8-12v15"/>',
    hammer:'<path fill="currentColor" stroke="none" d="m6 3 4-2 9 7-3 4-4-3-8 12-3-2L9 7 6 5zM13 17l4-4 4 6-3 2z"/>',
    scope:'<path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.5"/>',
    cursor:'<path d="m4 2 14 10-7 1 4 7-3 1-4-7-4 4z"/>',
    play:'<path fill="currentColor" stroke="none" d="M5 2v20l16-10z"/>',pause:'<path fill="currentColor" stroke="none" d="M4 3h6v18H4zm10 0h6v18h-6z"/>',
    speed:'<path fill="currentColor" stroke="none" d="m2 4 10 8-10 8zm10 0 10 8-10 8z"/>',restart:'<path d="M4 10a8 8 0 1 1 1 7m-1-8V3m0 7h7"/>'
  };
  function svg(k){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="round">'+glyphs[k]+'</svg>'}
  function icons(root=document){root.querySelectorAll('[data-icon]').forEach(i=>i.innerHTML=svg(i.dataset.icon))}
  Object.assign(glyphs,{
    shop:'<path d="M3 9l2-6h14l2 6M4 12v9h16v-9M8 21v-7h5v7M3 9v2q2 3 5 0 2 3 5 0 2 3 5 0 2 2 3 0V9z"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2l-2 2v1m0 2v1"/>',
    cards:'<path d="m5 6-3 2 5 12 3-1m-1-17 12 2-3 17-12-2z"/><path d="m14 8 2 3-3 4-2-4z"/>',
    cube:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10"/>',
    pin:'<path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2"/>',
    quill:'<path d="M3 21 16 8M6 18l2-8 8-7 5 1-1 6-7 7z"/>',
    snow:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4m10 14-1-4 4-1M7 19l1-4-4-1m16-4-4-1 1-4"/>',
    fire:'<path d="M13 2c3 6-2 7 1 10 2-1 3-3 3-5 4 4 6 12-2 15 1-3 1-5-2-8-1 3-4 4-3 8-9-3-6-10-2-14-1 5 5 2 5-6z"/>',
    shield:'<path d="m12 2 8 3v7c0 4-4 8-8 10-4-2-8-6-8-10V5zM7 11h10m-5-5v10"/>',
    pine:'<path d="m12 2 5 6h-3l5 6h-4l6 6H3l6-6H5l5-6H7z"/>',sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2m0-16-2 2M6 18l-2 2"/>',
    moon:'<path d="M18 3a9 9 0 1 0 3 14A9 9 0 0 1 18 3z"/><path d="m6 5 1-2 1 2 2 1-2 1-1 2-1-2-2-1z"/>'
  });
  const {Battle,towers,units,upgradeCost,levelStats}=PineGame,{chapters,items}=PineCampaign,P=PineProgress,profile=P.load(),renderer=new PineRenderer($("field"));
  let g,stage,selected=null,hover=null,choice="arrow",modal="",timer,stamp=0,clock=0,saveAt=0,paintAt=0,uiAt=0,dirty=true,manageKey="",intelKey="",saveError=false,pads=[],shopTab="card";
  const fmt=n=>String(n).padStart(2,"0"),btn=(text,cls,fn)=>{const b=make("button",cls);b.textContent=text;b.onclick=fn;return b};
  const cardIds=["hail","blaze","mend"];const chapterNo=()=>fmt(profile.chapter+1);
  const rangerView=new PineRenderer($("ranger-preview"));rangerView.angle=.38;rangerView.pitch=.045;
  const thumbnailCanvas=make("canvas","model-snapshot");document.body.append(thumbnailCanvas);const thumbnailView=new PineRenderer(thumbnailCanvas),thumbs=new Map();
  thumbnailView.angle=-.56;thumbnailView.pitch=.21;
  let studio=null,portraitFrame=-1,portraitSkin="",portraitVisible=true;
  new IntersectionObserver(([entry])=>{portraitVisible=entry.isIntersecting}).observe($("ranger-preview"));
  function save(){if(!P.save(profile,g)&&!saveError){saveError=true;msg("本浏览器无法保存进度，请保持游戏页面打开")}}
  function msg(s){$("map-msg").textContent=s;$("map-msg").classList.add("show");clearTimeout(timer);timer=setTimeout(()=>$("map-msg").classList.remove("show"),2500)}
  const sound=new PineSound($("sound"),svg,msg);
  function art(type,parent,portrait=false){
    const key=[type,profile.skin,portrait].join("/"),c=make("canvas",portrait?"portrait":"");c.width=c.height=96;c.setAttribute("aria-hidden","true");c.dataset.model=type;
    if(!thumbs.has(key)){thumbnailView.specimen(type,profile.skin,portrait?"walk":"idle",.2,0,portrait&&type!=="runner");const bitmap=make("canvas");bitmap.width=bitmap.height=96;bitmap.getContext("2d").drawImage(thumbnailCanvas,0,0,96,96);thumbs.set(key,bitmap)}
    c.getContext("2d").drawImage(thumbs.get(key),0,0);parent.append(c);return c;
  }
  function inspect(id="ranger"){
    dialog("models","FIELD GUIDE · 模型图鉴","角色与装备","",[["返回战场",closeDialog]]);
    if(!studio)studio=new PineStudio(()=>sound.play("ranger"));studio.open($("dialog-body"),id,profile.skin);
  }
  $("inspect-ranger").onclick=$("models-btn").onclick=()=>inspect();
  $("ranger-preview").onclick=()=>inspect();
  function choose(type){if(g.ended)return;choice=type;selected=null;manageKey="";update();dirty=true}
  for(const [type,t] of Object.entries(towers)){const b=make("button","tower-card");b.dataset.type=type;b.title=t.description;
    b.innerHTML='<span class="tower-image"></span><span><strong class="tower-name">'+t.name+'</strong><span class="tower-desc">'+t.brief+'</span></span><span class="tower-cost"><i data-icon="coin"></i>'+t.cost+'</span>';art(type,b.firstChild);b.onclick=()=>choose(type);$("tower-list").append(b)}
  function installPads(){
    lastProjection="";$("pad-controls").replaceChildren();pads=g.pads.map((p,i)=>{const b=make("button","pad");
      const j=i-g.baseSites;
      b.onpointerenter=ev=>{if(ev.pointerType==="mouse"&&!drag&&!g.supplyHealth[j]){hover=i;dirty=true}};b.onpointerleave=b.onblur=()=>{hover=null;dirty=true};b.onfocus=()=>{if(!g.supplyHealth[j])hover=i;dirty=true};
      b.onclick=()=>{if(g.ended||performance.now()<blockClick)return;
        if(g.supplyHealth[j]){orderSupply(j);return}
        if(document.documentElement.classList.contains("battle-expanded")){siteOrders(i);return}
        if(g.towers[i]){selected=i;manageKey="";update();dirty=true;return}
        if(!g.build(i,choice)){msg(g.gold<towers[choice].cost?"军费不足，还需 "+(towers[choice].cost-g.gold)+" 金币":"与已有防御塔太近");return}
        selected=null;update();dirty=true;msg(towers[choice].name+" 已部署")};$("pad-controls").append(b);return b});
  }
  let pendingSite=null;
  function siteOrders(i,point=null){
    pendingSite=point;renderer.buildPreview=point;dirty=true;
    const tower=g.towers[i];
    dialog("site",point?"自选塔位 · "+g.gold+" 军费":"第 "+(i+1)+" 号塔位",tower?towers[tower.type].name+" · "+tower.level+" 级":"选择防御塔",'<div class="site-choices"></div>');
    const list=$("dialog-body").firstElementChild;
    if(tower){
      const cost=upgradeCost(tower);
      const improve=btn(tower.level===3?"已达最高等级":"升级 · "+cost+" 军费","primary",()=>{if(g.upgrade(i))closeDialog()});
      improve.disabled=tower.level>=3||g.gold<cost;
      list.append(improve,btn("拆除 · 回收 "+Math.floor(tower.spent*.65)+" 军费","secondary",()=>{if(g.sell(i))closeDialog()}));
    }else for(const [type,t] of Object.entries(towers)){
      const b=btn("","site-choice",()=>{
        const built=point?g.buildAt(...point,type):g.build(i,type);
        if(built){if(point)installPads();closeDialog();draw();msg(t.name+" 已部署")}
        else msg("这个位置已被占用，请另选空地");
      });
      b.disabled=g.gold<t.cost;b.dataset.build=type;b.title=t.brief;
      art(type,b);const label=make("strong"),detail=make("small"),price=make("span");label.textContent=t.name;detail.textContent=t.brief;price.textContent=t.cost+" 军费";b.append(label,detail,price);list.append(b);
    }
    positionSiteMenu(i);
    $("dialog").dataset.site=i;
  }
  function positionSiteMenu(i){
    const d=$("dialog"),gap=9;
    const sideways=document.documentElement.classList.contains("sideways-battle");
    const rect=(pendingSite?$("field"):pads[i]).getBoundingClientRect();
    let p=sideways?{left:rect.top,width:rect.height,top:innerWidth-rect.right,bottom:innerWidth-rect.left}:rect;
    if(pendingSite){
      const [px,py]=renderer.project(pendingSite[0],1,pendingSite[1]),y=p.top+py/renderer.dpr;
      p={left:p.left+px/renderer.dpr,width:0,top:y-8,bottom:y+8};
    }
    const frameWidth=sideways?innerHeight:innerWidth,frameHeight=sideways?innerWidth:innerHeight;
    const w=d.offsetWidth,h=d.offsetHeight;
    const left=Math.min(Math.max(gap,p.left+p.width/2-w/2),frameWidth-w-gap);
    const top=p.top-h-gap>=gap?p.top-h-gap:Math.min(p.bottom+gap,frameHeight-h-gap);
    d.style.setProperty("--site-x",Math.max(gap,left)+"px");d.style.setProperty("--site-y",Math.max(gap,top)+"px");
  }
  function battleMenu(){
    dialog("battle-menu","第 "+chapterNo()+" 关 · "+stage.region,stage.name,'<div class="field-menu"></div>');
    const menu=$("dialog-body").firstElementChild;
    const entry=(name,fn)=>menu.append(btn(name,"secondary",fn));
    if(!g.ended)entry(g.paused?"继续战斗":"暂停战斗",()=>{closeDialog();pause()});
    entry("战术手牌",()=>{
      dialog("cards","战场指令","战术手牌",'<div class="field-menu"></div>');
      const list=$("dialog-body").firstElementChild;
      handButtons.forEach((source,i)=>{const b=btn(items[cardIds[i]].name+" ×"+profile.cards[cardIds[i]],"secondary",()=>{source.click();closeDialog()});b.disabled=source.disabled;list.append(b)});
    });
    entry("敌情预报",()=>dialog("forecast","战场指令",$("intel-wave").textContent,[...$("intel-body").querySelectorAll("strong,p")].map(el=>"<p>"+el.textContent+"</p>").join("")));
    entry("战役纪事",journal);entry("渡鸦商店",shop);entry("角色图鉴",()=>inspect());
    entry($("sound").title,()=>{$("sound").click();battleMenu()});
    entry("本局重来",()=>$("restart").click());entry("全部重来",confirmReset);
    if(!document.fullscreenElement&&document.documentElement.requestFullscreen)entry("启用系统全屏",()=>{closeDialog();window.dispatchEvent(new Event("pine-native-screen"))});
    entry("退出全屏",()=>{closeDialog();$("battle-expand").click()});
  }
  function orderSupply(j){
    if(!g.markSupply(j))return;
    const c=g.supplies[j],reachable=g.towers.some((t,i)=>t&&Math.hypot(g.pads[i][0]-c.x,g.pads[i][1]-c.z)<=levelStats(t.type,t.level).range);
    msg(g.markedSupply===null?"已取消清障，恢复守路":!reachable?"已标记，请在物资箱附近建塔":g.phase==="ready"?"已标记，开波后附近的塔将清障":"附近的塔已转火 · 再点物资箱可取消");
    hover=null;dirty=true;save();update();
  }
  function supplyOrders(){
    const actions=g.supplies.map((c,j)=>g.supplyHealth[j]>0&&!g.ended?[(g.markedSupply===j?"取消清障 · ":"标记 · ")+c.name,()=>{closeDialog();orderSupply(j)},"secondary"]:null).filter(Boolean);
    dialog("supplies","FIELD SUPPLIES","战地物资",'<p>点路旁空地可建塔。点树木或石块可直接花军费清除。</p><p>点箱子标记目标，射程内的塔会在战斗中优先清障。再点一次即可恢复守路。清掉箱子可获得军费，原地还能建塔。</p>'+g.supplies.map((c,j)=>'<p><b>'+c.name+'</b>　'+(g.supplyHealth[j]?'耐久 '+g.supplyHealth[j]+' / '+c.hp+'　奖励 '+c.gold+' 军费':'已清理 · 塔位已开放')+'</p>').join("")+'<p>清完两处物资并守住本章，可在战役纪事点亮全清勋章。</p>',[...actions,["返回战场",closeDialog]]);
  }
  function refreshTerrain(){
    renderer.set(stage,profile.chapter,profile.skin,g.cleared);g.terrain=renderer.terrain;
  }
  function setup(restore=false){
    stage=chapters[profile.chapter];g=new Battle(stage.path,stage.pads,onEvent,stage);
    if(!restore||!P.restore(profile,g)){g.towers[1]={type:"arrow",level:1,spent:0,cd:0};profile.run=null}
    choice="arrow";selected=hover=null;clock=0;stamp=0;intelKey=manageKey="";refreshTerrain();renderer.resetCamera();$("frontline").setAttribute("aria-pressed","false");installPads();
    $("chapter-title").textContent=stage.name;$("chapter-count").textContent="第 "+chapterNo()+" 章 / 共 "+chapters.length+" 章";$("mission").textContent=stage.mission;$("region").textContent=stage.region;
    $("story-label").textContent="第 "+chapterNo()+" 章 · 战地手记";$("story-title").textContent=stage.subtitle;$("story").textContent=stage.brief;$("wave-max").textContent=" / "+stage.waves;
    update();draw();save();if(restore&&g.ended)outcome();
  }
  function onEvent(e,type){
    dirty=true;if(e==="landClear"){refreshTerrain();sound.play("build")}if(e==="shot"){sound.play(type);return}
    if(["build","upgrade","start","cleared","leak","won","lost"].includes(e))sound.play(e);
    if(e==="won"){P.settle(profile,g);save();outcome();return}if(e==="lost"){save();outcome();return}
    if(e==="leak")msg("敌军突破城门");
    if(e==="salvage"){msg(type.name+"已清除　+"+type.gold+" 军费 · 新塔位已开放");sound.play("purchase")}
    if(e==="cleared")msg("击退第 "+g.wave+" 波　+"+PineGame.waveReward(g.wave)+" 军费");
    if(e==="kill"||e==="leak")return;
    save();update();
  }
  function manage(){const pane=$("manage"),t=g.towers[selected];if(!t)return;const cost=upgradeCost(t),key=[selected,t.level,g.gold>=cost,g.ended].join();if(manageKey===key)return;manageKey=key;const stats=levelStats(t.type,t.level);
    pane.innerHTML='<button class="back-button">← 返回工坊</button><div class="manage-heading"><div><h3>'+towers[t.type].name+'</h3><p>等级 '+t.level+' / 3</p></div></div><p>'+towers[t.type].description+'</p><div class="stats-line"><span>攻击<strong>'+stats.damage+'</strong></span><span>射程<strong>'+stats.range+'</strong></span><span>间隔<strong>'+stats.delay.toFixed(2)+'s</strong></span></div>';
    const box=pane.querySelector(".manage-heading");box.prepend(art(t.type,box));pane.querySelector(".back-button").onclick=()=>choose(choice);
    const b=btn(t.level===3?"已达最高等级":"升级 · "+cost+" 军费","primary",()=>{if(g.upgrade(selected))msg("防御塔升至 "+t.level+" 级")});b.disabled=t.level>=3||g.gold<cost||g.ended;pane.append(b);
    pane.append(btn("拆除 · 回收 "+Math.floor(t.spent*.65)+" 军费","secondary",()=>{const i=selected;selected=null;g.sell(i);manageKey="";update()}));
  }
  function intel(){const n=Math.min(stage.waves,g.phase==="ready"?g.wave+1:Math.max(1,g.wave)),key=n+"/"+profile.chapter;if(intelKey===key)return;intelKey=key;$("intel-wave").textContent="WAVE "+fmt(n);const counts=stage.lineup[n-1],type=["boss","brute","runner","scout"].find(t=>counts[t]),row=make("div","intel-row");art(type,row,true);
    const formation=stage.formations[n-1];
    const reports={pack:["狼群突袭","疾狼将在队伍中段成群冲刺。箭塔守后段，寒霜塔卡弯道。"],vanguard:["铁甲先遣","铁甲兵打头阵。用炮塔穿甲，或先用寒霜破甲再集火。"],escort:["领主护送","重甲卫队先行，领主随后入场。留出一段冰炮交叉火力。"],mixed:["混编推进",units[type].hint]};
    const [name,hint]=reports[formation];
    $("intel-wave").textContent="第 "+n+" 波 · "+name;
    const d=make("div"),title=make("strong"),list=make("p"),tip=make("p");
    title.textContent=units[type].name+" ×"+counts[type];list.textContent=Object.entries(counts).filter(([k])=>k!==type).map(([k,v])=>units[k].name+" ×"+v).join(" · ");tip.textContent=hint;
    d.append(title);if(list.textContent)d.append(list);d.append(tip);row.append(d,btn("查看模型","textbtn inspect-unit",()=>inspect(type)));$("intel-body").replaceChildren(row)}
  const handButtons=cardIds.map(id=>{const b=make("button","hand-card "+id);b.dataset.card=id;b.innerHTML='<i data-icon="'+items[id].sigil+'"></i><span>'+items[id].name+'</span><small></small>';b.title=items[id].desc;
    b.onclick=()=>{if(!P.use(profile,g,id))return;save();update();dirty=true;sound.play("card");msg(items[id].name+" 已生效");$("map-area").animate?.([{filter:"brightness(1.3)"},{filter:"brightness(1)"}],{duration:330})};$("hand").append(b);return b});
  function update(){
    $("health").textContent=g.health;$("gold").textContent=g.gold;$("wave").textContent=g.wave;
    $("phase").textContent=g.paused?"已暂停":({ready:"整备阶段",fight:"敌军来袭",won:"守城成功",lost:"城门失守"})[g.phase];$("phase").parentNode.classList.toggle("active",g.phase==="fight"&&!g.paused);
    $("start").disabled=!g.ended&&(g.phase!=="ready"||g.paused);$("start").querySelector("span").textContent=g.ended?"查看战报":g.phase==="ready"?"开始第 "+(g.wave+1)+" 波":"第 "+g.wave+" 波进行中";
    $("speed").querySelector("span").textContent=g.speed+"×";$("pause").disabled=g.ended;$("pause").querySelector("span").textContent=g.paused?"继续":"暂停";$("pause").querySelector("i").innerHTML=svg(g.paused?"play":"pause");
    document.querySelector(".paused-overlay").hidden=!g.paused||!!modal;$("combat-progress").textContent=g.phase==="fight"?"本波敌军　"+g.defeated+" / "+g.waveSize:"";
    $("armory-content").hidden=selected!=null;$("manage").hidden=selected==null;if(selected!=null)manage();
    document.querySelectorAll(".tower-card").forEach(b=>{b.classList.toggle("chosen",b.dataset.type===choice);b.setAttribute("aria-pressed",b.dataset.type===choice);b.querySelector(".tower-cost").classList.toggle("price-low",g.gold<towers[b.dataset.type].cost)});
    $("supply-orders").textContent="物资 "+g.clearedSupplies+" / "+g.supplies.length;
    pads.forEach((b,i)=>{
      const j=i-g.baseSites,c=g.supplies[j],hp=g.supplyHealth[j],t=g.towers[i];b.disabled=g.ended;
      const name=hp?c.name+" · 耐久 "+hp+" / "+c.hp+" · "+c.gold+" 军费":(i+1)+" 号基座 · "+(t?towers[t.type].name+" "+t.level+" 级":"建造"+towers[choice].name);
      b.className=hp?"supply-target":"pad";b.title=name;b.setAttribute("aria-label",name);
      if(hp){b.setAttribute("aria-pressed",g.markedSupply===j);b.style.setProperty("--hp",Math.ceil(hp/c.hp*100)+"%")}else b.removeAttribute("aria-pressed");
    });
    handButtons.forEach((b,i)=>{const id=cardIds[i],n=profile.cards[id]||0;b.querySelector("small").textContent="×"+n;b.disabled=!n||!P.allowed(g,id);b.title=items[id].desc+(n?"":" 渡鸦商店可补给。")});intel();
  }
  let lastProjection="";
  function draw(){renderer.render(g,selected,choice,hover);const key=[renderer.w,renderer.h,renderer.angle,renderer.pitch,renderer.zoom,renderer.viewHeight,profile.chapter,...g.towers.map(t=>!!t),...g.supplyHealth.map(Boolean)].join();if(key!==lastProjection){lastProjection=key;pads.forEach((b,i)=>{const [x,z]=g.pads[i],t=g.towers[i],[px,py,depth]=renderer.project(x,g.supplyHealth[i-g.baseSites]?7:t?12:3,z);b.hidden=(i>=g.fixedSites&&!t)||px<0||px>renderer.w||py<0||py>renderer.h;b.style.left=px/renderer.w*100+"%";b.style.top=py/renderer.h*100+"%";b.style.zIndex=String(Math.round(300+depth));b.style.height=t?"9%":"6.3%"})}dirty=false}
  function animate(now){const dt=stamp?Math.min(.15,(now-stamp)/1000):0;stamp=now;const active=g.phase==="fight"&&!modal&&!g.paused&&!document.hidden;
    if(active){clock+=dt*g.speed;while(clock>=1/40){g.step(1/40);clock-=1/40}if(now-uiAt>180){update();uiAt=now}if(now-saveAt>1500){save();saveAt=now}}
    if((active||dirty||renderer.dirty)&&now-paintAt>(renderer.gl?25:65)){draw();paintAt=now}
    if(modal==="models")studio?.tick(now,dt);
    else if(!modal&&portraitVisible&&!document.hidden){const frame=Math.floor(now/380)%8;if(frame!==portraitFrame||portraitSkin!==profile.skin){rangerView.specimen("ranger",profile.skin,"idle",frame/8,0,true);portraitFrame=frame;portraitSkin=profile.skin}}
    requestAnimationFrame(animate)}
  let drag=null,blockClick=0,pinchDistance=0;
  const touches=new Map(),area=$("map-area");
  area.addEventListener("click",e=>{
    if(g.ended||modal||performance.now()<blockClick||e.target.closest("button,.camera-bar,.scene-meta"))return;
    const pos=PineRenderer.inputPoint(e),rect=$("field").getBoundingClientRect(),sideways=document.documentElement.classList.contains("sideways-battle");
    const px=(pos.x-(sideways?rect.top:rect.left))*renderer.dpr,py=(pos.y-(sideways?innerWidth-rect.right:rect.top))*renderer.dpr;
    let hit=null,best=Infinity;
    for(const p of g.terrain.props){
      const [x,y]=renderer.project(p.x,0,p.z),[,top]=renderer.project(p.x,p.h,p.z);
      const radius=Math.max(5*renderer.dpr,p.r*renderer.scale);
      const score=Math.hypot(px-x,py-Math.max(top,Math.min(y,py)))/radius;
      if(score<=1&&score<best){hit=p;best=score}
    }
    if(hit){
      const tree=hit.kind==="tree",name=tree?"树木":"石块";
      dialog("terrain","清理场地",tree?"移除树木":"清除石块","<p>花费 "+hit.cost+" 军费清除这处"+name+"。当前有 "+g.gold+" 军费。</p>",[["取消",closeDialog,"secondary"],["清除 · "+hit.cost+" 军费",()=>{if(g.clearProp(hit.id)){closeDialog();draw();msg(name+"已清除")}}]]);
      $("dialog-actions").lastElementChild.disabled=g.gold<hit.cost;return;
    }
    const point=renderer.ground(px,py),reason=g.placementError(...point);
    if(reason){msg(reason);return}
    siteOrders(-1,point);
  });
  function fingerDistance(){const [a,b]=touches.values();return Math.hypot(a.x-b.x,a.y-b.y)}
  area.addEventListener("pointerdown",e=>{
    if(e.button!==0||e.target.closest(".camera-bar,.phone-tools"))return;
    if(e.pointerType==="touch"){
      touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(touches.size>=2){drag=null;pinchDistance=fingerDistance();for(const id of touches.keys())area.setPointerCapture(id);return}
    }
    blockClick=0;
    drag={id:e.pointerId,...PineRenderer.inputPoint(e),a:renderer.angle,p:renderer.pitch,moved:false}
  });
  area.addEventListener("pointermove",e=>{
    if(touches.has(e.pointerId))touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinchDistance&&touches.size<2)return;
    if(touches.size>=2){const distance=fingerDistance();if(pinchDistance>2&&distance>2)zoomMap(distance/pinchDistance);pinchDistance=distance;return}
    if(!drag||drag.id!==e.pointerId)return;const pos=PineRenderer.inputPoint(e),dx=pos.x-drag.x,dy=pos.y-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<6)return;
    if(!drag.moved){area.setPointerCapture(e.pointerId);drag.moved=true}hover=null;renderer.angle=drag.a-dx*.009;renderer.pitch=Math.max(.43,Math.min(1.14,drag.p+dy*.006));dirty=true});
  function release(e){
    if(touches.delete(e.pointerId)&&pinchDistance){blockClick=performance.now()+220;if(!touches.size)pinchDistance=0;else if(touches.size>=2)pinchDistance=fingerDistance()}
    if(!drag||e.pointerId!==drag.id)return;if(drag.moved){blockClick=performance.now()+220;if(area.hasPointerCapture(e.pointerId))area.releasePointerCapture(e.pointerId)}drag=null
  }
  window.addEventListener("pointerup",release);window.addEventListener("pointercancel",release);
  const frontline=btn("前线近景","frontline",()=>{if(renderer.frontline)renderer.resetCamera();else renderer.follow(g.ranger);hover=null;frontline.setAttribute("aria-pressed",String(renderer.frontline));dirty=true});
  frontline.id="frontline";frontline.title="切换到阿遥身边，观察实际交战";document.querySelector(".camera-bar").prepend(frontline);
  $("cam-left").onclick=()=>{renderer.angle-=Math.PI/6;dirty=true};$("cam-right").onclick=()=>{renderer.angle+=Math.PI/6;dirty=true};$("cam-home").onclick=()=>{renderer.resetCamera();frontline.setAttribute("aria-pressed","false");dirty=true};
  function zoomMap(factor){
    if(!(factor>0&&Number.isFinite(factor)))return;
    if(renderer.frontline)renderer.viewHeight=Math.max(36,Math.min(110,renderer.viewHeight/factor));
    else renderer.zoom=Math.max(.8,Math.min(2.4,renderer.zoom*factor));
    hover=null;lastProjection="";dirty=true;
  }
  window.addEventListener("pine-camera-zoom",event=>zoomMap(Number(event.detail)));
  window.addEventListener("pine-field-layout",()=>{
    refreshTerrain();renderer.resetCamera();frontline.setAttribute("aria-pressed","false");
    lastProjection="";dirty=true;draw();
  });
  function closeDialog(){if($("dialog").open)$("dialog").close();pendingSite=renderer.buildPreview=null;modal="";stamp=0;dirty=true;update()}
  function dialog(kind,label,title,html="",actions=[]){
    modal=kind;const d=$("dialog");d.dataset.kind=kind;$("dialog-label").textContent=label;$("dialog-title").textContent=title;$("dialog-body").innerHTML=html;$("dialog-actions").replaceChildren();
    for(const [name,fn,cls] of actions)$("dialog-actions").append(btn(name,cls||"primary",fn));if(!d.open)d.showModal();update()}
  const para=s=>s.split("\n\n").map(v=>"<p>"+v+"</p>").join("");
  function enter(i){if(i>profile.unlocked)return;closeDialog();profile.chapter=i;profile.run=null;setup(false);msg("已抵达"+stage.name)}
  function restartChapter(){enter(profile.chapter);msg(stage.name+" · 已回到第一波前，可重新布防")}
  function confirmReset(){
    dialog("reset","NEW CAMPAIGN","从第一章全部重来？","<p>将清除这个浏览器里《松境守卫》的当前战局、已解锁章节、通关记录、钱包、手牌和装扮。新战役从松风前哨开始，初始有 80 金币和一张寒潮敕令。</p><p>清除后无法撤销。</p>",[["取消",closeDialog,"secondary"],["确认全部重来",()=>{
      if(!P.resetCampaign(profile)){$("dialog-body").textContent="浏览器未能保存重置，原进度仍在。";return}
      closeDialog();setup(false);
      document.querySelectorAll(".tower-image").forEach(box=>{const type=box.querySelector("canvas").dataset.model;box.replaceChildren();art(type,box)});
      msg("新战役已开始");
    }]]);
    $("dialog-actions").firstElementChild.focus();
  }
  window.addEventListener("storage",e=>{if(e.key===P.key&&e.newValue&&JSON.parse(e.newValue).resetId!==profile.resetId)location.reload()});
  function switchChapter(i){if(i===profile.chapter&&!g.ended){closeDialog();return}if(!g.ended&&(g.wave>0||g.towers.some(t=>t&&t.spent>0)))dialog("switch","CAMPAIGN","离开当前守城？","<p>进入其他章节后，本章将从第一波重新开始。已获得的钱包金币、手牌和装扮保留。</p>",[["前往"+chapters[i].name,()=>enter(i)],["留在本章",closeDialog,"secondary"]]);else enter(i)}
  function outcome(){
    const won=g.phase==="won",final=won&&profile.chapter===chapters.length-1,reward=profile.run?.payout;
    const html=won?'<div class="chapter-prose">'+para(stage.after)+'</div><div class="settlement"><span>结余军费 <b>'+g.gold+'</b></span><span>首通奖励 <b>'+(reward?.bonus||0)+'</b></span><span>存入钱包 <b>+'+(reward?.earned||0)+'</b></span></div>':'<p>防线守到了第 '+g.wave+' 波。先在连续弯道布置箭塔，把炮塔留给成群的敌军。已购装扮与剩余手牌可带入重试。</p>';
    const actions=won?(final?[["回顾战役纪事",journal],["返回沙盘",closeDialog,"secondary"]]:[["前往"+chapters[profile.chapter+1].name,()=>enter(profile.chapter+1)],["逛逛商店",shop,"secondary"]]):[["本局重来",restartChapter],["补给道具",shop,"secondary"]];
    if(won)actions.push(["本局重来",restartChapter,"secondary"]);
    dialog("result",final?"EPILOGUE · 终章":won?"CHAPTER CLEAR · 第 "+chapterNo()+" 章":"BATTLE REPORT",final?"大结局 · 万家回灯":won?stage.name+"守住了":"城门失守",html+(won?"<p>"+(g.clearedSupplies===g.supplies.length?"✦ 获得本章全清勋章":"物资清理 "+g.clearedSupplies+" / "+g.supplies.length)+"</p>":""),actions);
  }
  function journal(){
    dialog("journal","CAMPAIGN ARCHIVE","晨钟纪事",'<div class="journal-summary">已守住 '+Object.keys(profile.records).length+' / '+chapters.length+' 章</div><div id="chap-list"></div>',[["全部重来",confirmReset,"secondary"]]);const list=$("chap-list");
    chapters.forEach((s,i)=>{const locked=i>profile.unlocked,cleared=!!profile.records[i],row=make("div","chapter-row"+(locked?" locked":""));
      if(!i||s.leg===0){const h=make("h3","province-name");h.textContent=s.province?.name||"晨钟纪事";list.append(h)}
      row.innerHTML='<span class="chapter-index">'+fmt(i+1)+'</span><div><h3>'+s.name+'</h3><p>'+s.waves+' 波 · '+(locked?"前章通关后解锁":s.subtitle)+(profile.records[i]?.salvaged?" · ✦ 全清勋章":"")+'</p></div>';
      const action=btn(locked?"未解锁":cleared?"回顾":i===profile.chapter?"阅读":"进入","secondary",()=>{if(!cleared&&i!==profile.chapter){switchChapter(i);return}
        const ending=cleared&&i===chapters.length-1;dialog("story",ending?"EPILOGUE":"CHAPTER "+fmt(i+1),ending?"大结局 · 万家回灯":s.subtitle,'<div class="chapter-prose">'+para(s.brief)+(cleared?para(s.after):"")+'</div>',cleared?[["重玩本章",()=>switchChapter(i)],["返回纪事",journal,"secondary"]]:[["返回战场",closeDialog],["返回纪事",journal,"secondary"]])});
      action.disabled=locked;row.append(action);list.append(row)});
  }
  function shop(){dialog("shop","RAVEN TRADING POST","渡鸦商店",'<div class="shop-wallet"><div><small>旅行钱包</small><strong id="bank"></strong></div><i data-icon="coins"></i></div><p class="shop-note">每章守城成功，剩余军费全额转入钱包。首次通关另有赏金。</p><div class="shop-tabs"><button data-tab="card">战术卡牌</button><button data-tab="skin">守卫装扮</button></div><div id="wares"></div><p id="shop-feedback" role="status"></p>',[[g.ended?"返回战报":"返回战场",g.ended?outcome:closeDialog]]);
    icons($("dialog-body"));document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{shopTab=b.dataset.tab;shopItems()});shopItems()}
  function shopItems(){
    $("bank").textContent=profile.bank+" 金币";document.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.tab===shopTab));const list=$("wares");list.replaceChildren();$("shop-feedback").textContent="";
    for(const [id,item] of Object.entries(items)){if(shopTab!==item.kind)continue;const row=make("div","ware "+id);row.style.setProperty("--item-color",item.color||({hail:"#91d5df",blaze:"#edaa7c",mend:"#b1c994"})[id]);
      const owned=profile.skins.includes(id),equipped=profile.skin===id;row.innerHTML='<div class="item-sigil">'+svg(item.sigil)+'</div><div class="item-copy"><strong>'+item.name+'</strong><p>'+item.desc+'</p><small>'+(item.kind==="card"?"背包 ×"+(profile.cards[id]||0):owned?"永久拥有":"永久装扮")+'</small></div>';
      const b=btn(equipped?"已装备":owned?"装备":item.price+" 金币","secondary",()=>{if(!P.purchase(profile,id))return;save();if(item.kind==="skin"){refreshTerrain();document.querySelectorAll(".tower-image").forEach(box=>{const type=box.querySelector("canvas").dataset.model;box.replaceChildren();art(type,box)});manageKey=intelKey="";dirty=true;draw()}update();shopItems();$("shop-feedback").textContent=item.name+(item.kind==="skin"?" 已装备":" 已放入手牌");sound.play("purchase")});
      b.dataset.buy=id;b.disabled=equipped||(!owned&&profile.bank<item.price);row.append(b);list.append(row)}
  }
  $("start").onclick=()=>g.ended?outcome():g.start();$("speed").onclick=()=>{g.speed=g.speed===1?2:g.speed===2?3:1;save();update()};
  function pause(){if(modal||g.ended)return;g.paused=!g.paused;save();dirty=true;update()}
  $("pause").onclick=pause;$("battle-nav").onclick=()=>{if(modal)closeDialog();$("map-area").scrollIntoView({block:"nearest"})};
  $("shop-btn").onclick=$("cards-store").onclick=shop;$("chapters-btn").onclick=$("read-journal").onclick=journal;
  $("help").onclick=()=>dialog("help","FIELD MANUAL","守城指南","<p><b>建造与战斗</b>　点路旁空地自由建塔，或使用 ＋ 基座。点树木或石块可花军费清除。普通视图也可以先在工坊选塔。点击已有防御塔可升级或拆除。每波手动开始。</p><p><b>观察战场</b>　点击「前线近景」可到阿遥身边观看交战，再点一次返回全图。拖动调整视角。「角色图鉴」可旋转、放大五名角色与六类防御塔，观看角色动作。</p><p><b>商店与手牌</b>　旅行钱包初始有 80 金币，另赠一张寒潮敕令。守住一章后，剩余军费存入钱包，可跨关购买卡牌和永久装扮。战术手牌点击即用。</p><p><b>战役存档</b>　每一章都有独立军费和防线。在同一浏览器打开同一文件，可接续上次战役；恢复战斗时点「继续」。战役纪事可回看剧情和重玩已解锁章节。</p>",[["返回战场",closeDialog]]);
  $("supply-orders").onclick=supplyOrders;
  $("battle-menu").onclick=battleMenu;
  $("restart").onclick=()=>dialog("restart","RETRY CHAPTER","重新开始「"+stage.name+"」？","<p>回到第一波前重新布防，城门生命和本关军费恢复初始值。旅行钱包、剩余手牌、装扮和已解锁章节会保留。</p>",[["本局重来",restartChapter],["取消",closeDialog,"secondary"],["全部重来",confirmReset,"secondary"]]);
  $("close").onclick=closeDialog;$("dialog").addEventListener("cancel",e=>{e.preventDefault();closeDialog()});
  document.addEventListener("keydown",e=>{if(modal||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(["1","2","3"].includes(e.key))choose(Object.keys(towers)[+e.key-1]);if(e.key.toLowerCase()==="x")$("speed").click();if(e.code==="Space"&&!e.target.closest?.("#restart,#sound")){e.preventDefault();pause()}if(e.key==="Escape")choose(choice)});
  document.addEventListener("visibilitychange",()=>{stamp=0;if(document.hidden&&g.phase==="fight"){g.paused=true;update();save()}});window.addEventListener("pagehide",save);
  new ResizeObserver(()=>{dirty=true;lastProjection="";if(modal==="site"){draw();positionSiteMenu(Number($("dialog").dataset.site))}}).observe(area);
  icons();PineSprites.emblem($("emblem").getContext("2d"));setup(true);if(!modal&&!g.wave)msg("点路旁空地建塔，点树石清障");requestAnimationFrame(animate);
})();
