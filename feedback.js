(() => {
  'use strict';
  class BattleFeedback {
    constructor(area,cast){
      const add=(tag,id)=>{const el=document.createElement(tag);el.id=id;area.append(el);return el};
      this.canvas=add('canvas','combat-fx');this.canvas.setAttribute('aria-hidden','true');this.ctx=this.canvas.getContext('2d');
      this.brief=add('div','battle-brief');this.brief.hidden=true;
      this.boss=add('div','boss-meter');this.boss.hidden=true;this.boss.innerHTML='<strong></strong><progress max="1" value="1" aria-label="首领生命"></progress>';
      this.combo=add('div','kill-combo');this.combo.hidden=true;
      this.cueBox=add('div','wave-cue');this.cueBox.hidden=true;this.cueBox.setAttribute('role','status');
      this.skill=add('button','hero-skill');this.skill.type='button';this.skill.onclick=cast;this.skill.hidden=true;
    }
    cue(title,subtitle){
      clearTimeout(this.timeout);this.cueBox.replaceChildren();const b=document.createElement('strong'),s=document.createElement('span');b.textContent=title;s.textContent=subtitle;this.cueBox.append(b,s);this.cueBox.hidden=false;
      this.timeout=setTimeout(()=>{this.cueBox.hidden=true},3000);
    }
    reset(){clearTimeout(this.timeout);this.cueBox.hidden=true;this.flashUntil=0}
    update(g,stage){
      const opening=stage.opening;
      this.skill.hidden=!(opening||g.mastery.volley)||g.ended;
      this.skill.disabled=!g.canVolley;
      this.skill.classList.toggle('charged',!!g.canVolley);
      this.skill.textContent=g.bannerTime>0?'破阵战旗 · '+Math.ceil(g.bannerTime)+' 秒':g.volleyCharge>=100?'✦ 阿遥 · 箭雨':'箭雨充能 · '+Math.floor(g.volleyCharge)+'%';
      this.skill.title='对在场敌人造成 65 点伤害（首领 35），减速 2 秒。每次击杀回复 9% 能量。';
      this.skill.style.setProperty('--charge',g.volleyCharge+'%');
      const boss=g.enemies.find(e=>e.type==='boss'&&e.hp>0);
      this.boss.hidden=!boss||g.ended;
      if(boss){this.boss.querySelector('strong').textContent=(opening?.boss?'碎岩督军':'赤岩领主')+(boss.enraged?' · 狂暴！':'')+'　'+Math.ceil(boss.hp)+' / '+boss.maxHp;this.boss.querySelector('progress').value=Math.max(0,boss.hp/boss.maxHp)}
      this.combo.hidden=g.combo<3||g.time>g.comboUntil||g.phase!=='fight';
      this.combo.textContent=g.combo+' 连击'+(g.combo>=8?' · 势如破竹':'');
      this.brief.hidden=!opening||g.phase!=='ready';
      if(!this.brief.hidden){
        const challenge=stage===PineCampaign.chapters[1]?'清完两处物资':opening.boss?'城门至少剩 12 生命':'城门至少剩 16 生命';
        this.brief.textContent='第 '+(g.wave+1)+' / '+g.waves.length+' 波 · '+opening.names[g.wave]+(g.doctrine?' · '+(g.doctrine==='rapid'?'疾风箭阵':'碎甲炮火'):'')+'\n'+opening.hints[g.wave]+'\n通关解锁「'+opening.reward.name+'」 · '+challenge+'另得寒潮卡';
      }
    }
    draw(g,r){
      const c=this.canvas,ctx=this.ctx;if(c.width!==r.w||c.height!==r.h){c.width=r.w;c.height=r.h}else ctx.clearRect(0,0,c.width,c.height);
      const dpr=r.dpr;ctx.textAlign='center';ctx.font='bold '+Math.round(14*dpr)+'px system-ui';ctx.lineWidth=3*dpr;
      for(const f of g.floaters||[]){const [x,y]=r.project(f.x,18+(1-f.ttl/.85)*12,f.z);ctx.globalAlpha=Math.min(1,f.ttl*3);ctx.strokeStyle='#27311d';ctx.fillStyle='#ffe29a';ctx.strokeText(f.text,x,y);ctx.fillText(f.text,x,y)}
      ctx.globalAlpha=1;
      if(g.phase==='fight'&&performance.now()<this.flashUntil){ctx.fillStyle='#ffe4a324';ctx.fillRect(0,0,c.width,c.height)}
    }
  }
  window.PineBattleFeedback=BattleFeedback;
})();
