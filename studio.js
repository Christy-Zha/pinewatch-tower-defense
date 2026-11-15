(() => {
  "use strict";
  const models={
    ranger:{name:"阿遥",role:"松林巡弓手",text:"在入侵者途经的山道旁驻守。进入射程后，她会转身瞄准，拉满弓弦再放箭。",action:"射箭"},
    scout:{name:"林地斥候",role:"先遣步兵",text:"携带短刃和小盾的侦察兵，最先从林间小路露面。",action:"挥刃"},
    runner:{name:"赤鬃疾狼",role:"突袭野兽",text:"依靠速度穿过火网。寒霜法塔能延缓它的冲刺。",action:"扑击"},
    brute:{name:"铁甲兽人",role:"重装步兵",text:"这名斧将束发戴金冠，肩披青玄重甲，藏在斥候身后逼近城门。",action:"挥斧"},
    boss:{name:"赤岩领主",role:"围城首领",text:"披着深色甲胄的重锤战士，胸前嵌着一块震动的钟片。",action:"挥锤"},
    arrow:{name:"游侠箭塔",role:"快速单体",text:"木制瞭望台架起弩机，为弯道提供连续火力。"},
    cannon:{name:"重装炮塔",role:"范围轰击",text:"铜箍固定着铸铁炮管，一发炮弹能击中聚集的敌人。"},
    frost:{name:"寒霜法塔",role:"冰霜控制",text:"石座支撑悬浮法晶，命中敌人时施加减速。"}
  };
  class FigureStudio{
    constructor(releaseArrow=()=>{}){
      this.releaseArrow=releaseArrow;
      this.section=document.createElement("section");this.section.className="figure-studio";
      this.section.innerHTML='<div class="studio-stage"><canvas aria-label="可拖动旋转的立体模型"></canvas><div class="model-ground"></div><div class="studio-tools"><button data-zoom aria-label="切换模型特写">放大</button><button data-turn aria-label="旋转模型">旋转 ↻</button></div></div><div class="model-info"><div><small class="model-role"></small><h3></h3></div><button class="secondary model-action"></button></div><p class="model-desc"></p><div class="model-roster"></div>';
      this.view=new PineRenderer(this.section.querySelector("canvas"));this.last=0;this.skin="pine";this.paused=false;this.time=0;
      this.hold=document.createElement("button");this.hold.textContent="满弓定格";this.hold.setAttribute("aria-pressed","false");this.section.querySelector(".studio-tools").prepend(this.hold);
      this.hold.onclick=()=>{this.paused=!this.paused;this.alt=true;this.time=.60*1.9;this.labels();this.paint()};
      this.section.querySelector("[data-turn]").onclick=()=>{this.view.angle+=Math.PI/4;this.paint()};
      this.section.querySelector("[data-zoom]").onclick=e=>{this.bust=!this.bust;e.currentTarget.textContent=this.bust?"全身":"放大";this.paint()};
      this.section.querySelector(".model-action").onclick=()=>{this.alt=!this.alt;this.paused=false;this.time=0;this.labels();this.paint()};
      const canvas=this.view.canvas;let pointer=null;
      canvas.onpointerdown=e=>{pointer={id:e.pointerId,...PineRenderer.inputPoint(e),a:this.view.angle,p:this.view.pitch};canvas.setPointerCapture(e.pointerId)};
      canvas.onpointermove=e=>{if(pointer?.id!==e.pointerId)return;const pos=PineRenderer.inputPoint(e);this.view.angle=pointer.a-(pos.x-pointer.x)*.017;this.view.pitch=Math.max(-.18,Math.min(.85,pointer.p+(pos.y-pointer.y)*.008));this.paint()};
      canvas.onpointerup=canvas.onpointercancel=()=>{pointer=null};
      const roster=this.section.querySelector(".model-roster");
      for(const [id,v] of Object.entries(models)){const b=document.createElement("button");b.textContent=v.name;b.dataset.id=id;b.onclick=()=>this.select(id);roster.append(b)}
    }
    open(parent,id,skin){parent.replaceChildren(this.section);this.skin=skin;this.select(id)}
    select(id){this.id=id;this.bust=false;this.alt=false;this.paused=false;this.time=0;this.view.pitch=id==="ranger"?.06:.17;this.view.angle=id==="ranger"?.38:-.52;this.section.querySelector("[data-zoom]").textContent="放大";
      const info=models[id];this.section.querySelector("h3").textContent=info.name;this.section.querySelector(".model-role").textContent=info.role;this.section.querySelector(".model-desc").textContent=info.text;this.section.querySelectorAll(".model-roster button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.id===id));this.labels();this.paint()}
    labels(){const action=this.section.querySelector(".model-action");action.hidden=!models[this.id].action;action.textContent=this.alt?(this.id==="ranger"?"待命姿态":"行进姿态"):models[this.id].action+"动作";this.hold.hidden=this.id!=="ranger";this.hold.textContent=this.paused?"继续射箭":"满弓定格";this.hold.setAttribute("aria-pressed",String(this.paused))}
    paint(){const pose=this.id==="ranger"?(this.alt?"shoot":"idle"):(this.alt?"attack":"walk");this.view.specimen(this.id,this.skin,pose,this.time/(pose==="idle"?3:pose==="shoot"?1.9:1.15),0,this.bust)}
    tick(now,dt){
      if(!this.section.isConnected||document.hidden)return;
      if(!this.paused){
        const previous=this.time;this.time+=dt;
        if(this.id==="ranger"&&this.alt&&Math.floor(previous/1.9-.65)!==Math.floor(this.time/1.9-.65))this.releaseArrow();
      }
      if(now-this.last<(this.view.gl?54:105))return;this.last=now;this.paint()
    }
  }
  window.PineStudio=FigureStudio;
})();
