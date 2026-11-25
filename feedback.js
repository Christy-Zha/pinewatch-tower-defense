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
      const dpr=r.dpr;
      // Small, localized effects leave the route and touch targets readable.
      for(const p of (g.impacts||[]).filter(p=>p.kind==='blast'||p.kind==='death').slice(-16)){
        const f=1-p.ttl/p.max,[x,y]=r.project(p.x,4,p.z),radius=Math.max(2,p.size*r.scale),blast=p.kind==='blast';
        ctx.save();ctx.lineWidth=(blast?2.5:1.5)*dpr;ctx.globalAlpha=(1-f)*.8;ctx.strokeStyle=blast?'#ffe8a6':'#fff4c2';
        ctx.beginPath();ctx.ellipse(x,y,radius*(.3+f*1.3),radius*(.3+f*1.3)*.48,0,0,Math.PI*2);ctx.stroke();
        if(blast){
          // Fire core, then drifting smoke. No full-screen flashes or camera displacement.
          if(f<.55){const size=radius*(.42+Math.sin(Math.min(1,f*2.3)*Math.PI)*.48),cy=y-radius*.25;
            const light=ctx.createRadialGradient(x,cy,0,x,cy,size);light.addColorStop(0,'#ffffe6');light.addColorStop(.22,'#ffe382');light.addColorStop(.55,'#ff9a35');light.addColorStop(.8,'#ef4b1d99');light.addColorStop(1,'#ef4b1d00');ctx.fillStyle=light;ctx.globalAlpha=Math.min(1,(.55-f)*3);ctx.beginPath();ctx.arc(x,cy,size,0,Math.PI*2);ctx.fill();
          }
          for(let i=0;i<5;i++){const a=i*2.4+p.x,px=x+Math.cos(a)*radius*f*.6,py=y-radius*(.2+f*.7)+Math.sin(a)*radius*f*.2,size=radius*(.14+f*.22);ctx.globalAlpha=Math.sin(f*Math.PI)*.23;ctx.fillStyle=i%2?'#6c655a':'#a1957d';ctx.beginPath();ctx.arc(px,py,size,0,Math.PI*2);ctx.fill()}
        }
        const sparks=blast?9:7;ctx.globalAlpha=(1-f)*.95;ctx.strokeStyle=blast?'#ffdf7d':'#fff0a5';ctx.lineWidth=2*dpr;
        for(let i=0;i<sparks;i++){const a=i*Math.PI*2/sparks+p.z*.1,distance=radius*(.18+f),sx=x+Math.cos(a)*distance,sy=y+Math.sin(a)*distance*.65-radius*Math.sin(f*Math.PI)*.3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-Math.cos(a)*(blast?6:4)*dpr*(1-f),sy-Math.sin(a)*4*dpr*(1-f));ctx.stroke()}
        ctx.restore();
      }
      ctx.textAlign='center';ctx.lineWidth=3*dpr;
      for(const f of (g.floaters||[]).slice(-24)){const damage=f.kind==='damage',[x,y]=r.project(f.x,(damage?26:15)+(1-f.ttl/(f.max||.85))*14,f.z);ctx.font='bold '+Math.round((damage?13:15)*dpr)+'px system-ui';ctx.globalAlpha=Math.min(1,f.ttl*4);ctx.strokeStyle='#27311d';ctx.fillStyle=damage?'#fff3df':'#ffe29a';ctx.strokeText(f.text,x,y);ctx.fillText(f.text,x,y)}
      ctx.globalAlpha=1;
      if(g.phase==='fight'&&performance.now()<this.flashUntil){ctx.fillStyle='#ffe4a324';ctx.fillRect(0,0,c.width,c.height)}
    }
  }
  window.PineBattleFeedback=BattleFeedback;
})();
