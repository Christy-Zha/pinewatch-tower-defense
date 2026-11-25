(() => {
  "use strict";
  const preference="pinewatch.sound.enabled";
  class GameSound {
    constructor(button,icon,notify){
      this.button=button;this.icon=icon;this.notify=notify;
      this.enabled=true;this.context=null;this.master=null;this.pending=null;this.lastShot=-1;
      try{this.enabled=localStorage.getItem(preference)!=="off"}catch{}
      this.render();
      const unlock=e=>{
        if(!e.isTrusted||!this.enabled||document.hidden||e.target.closest?.("#sound"))return;
        if(e.type==="keydown"&&(e.repeat||e.altKey||e.ctrlKey||e.metaKey||["Shift","Alt","Control","Meta","Tab"].includes(e.key)))return;
        if(!this.running)this.activate();
      };
      for(const type of ["click","pointerup","keydown"])document.addEventListener(type,unlock,true);
      button.addEventListener("click",()=>{
        if(this.enabled&&this.running){
          this.enabled=false;this.pending=null;this.master.gain.value=0;
        }else{
          this.enabled=true;this.activate();
        }
        try{localStorage.setItem(preference,this.enabled?"on":"off")}catch{}
        this.render();
      });
    }
    get running(){return this.context?.state==="running"}
    render(){
      const on=this.enabled&&this.running;
      const label=on?"静音":this.enabled?"点击启用声音":"开启声音";
      this.button.title=label;this.button.setAttribute("aria-label",label);
      this.button.setAttribute("aria-pressed",String(on));
      const glyph=this.button.querySelector("i");glyph.dataset.icon=on?"sound":"mute";glyph.innerHTML=this.icon(glyph.dataset.icon);
    }
    activate(){
      if(this.starting)return;
      try{
        if(!this.context||this.context.state==="closed"){
          const Audio=window.AudioContext||window.webkitAudioContext;
          this.context=new Audio();this.master=this.context.createGain();this.master.connect(this.context.destination);
          this.context.addEventListener("statechange",()=>this.render());
        }
        this.master.gain.value=.8;
        // Call resume while the trusted gesture is still on the browser's stack.
        this.starting=true;
        this.context.resume().then(()=>{
          this.starting=false;
          if(this.enabled&&this.running&&!document.hidden){
            const cue=this.pending||"ready";this.pending=null;this.play(cue);
          }
          this.render();
        },()=>this.failed());
      }catch{this.failed()}
    }
    failed(){
      this.starting=false;this.pending=null;this.render();
      this.notify("声音暂未能启动，请点喇叭重试");
    }
    note(type,hz,endHz,duration,level,delay=0){
      const ctx=this.context,t=ctx.currentTime+delay,end=t+duration;
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type=type;osc.frequency.setValueAtTime(hz,t);osc.frequency.exponentialRampToValueAtTime(endHz,end);
      gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+.009);
      gain.gain.exponentialRampToValueAtTime(.0001,end);
      osc.connect(gain);gain.connect(this.master);osc.onended=()=>{osc.disconnect();gain.disconnect()};
      osc.start(t);osc.stop(end+.005);
    }
    play(cue){
      if(!this.enabled||document.hidden)return;
      if(!this.running){if(this.starting)this.pending=cue;return}
      const n=(...args)=>this.note(...args);
      if(["ranger","arrow","frost","cannon","storm","ballista","venom"].includes(cue)){
        const t=this.context.currentTime;if(t-this.lastShot<.085)return;this.lastShot=t;
      }
      switch(cue){
        case "kill":{
          const now=this.context.currentTime;if(now-(this.lastKill||0)<.12)return;this.lastKill=now;
          n("sine",880,1320,.09,.12);break;
        }
        case "volley":
          [0,.06,.12].forEach(d=>n("sawtooth",600,85,.25,.10,d));n("sine",160,40,.45,.35,.15);break;
        case "boss":
          n("sawtooth",110,70,.6,.17);n("triangle",165,82,.5,.24,.22);break;
        case "ranger":case "arrow":
          n("triangle",840,165,.16,.30);n("sine",310,100,.11,.16,.012);break;
        case "ballista": n("triangle",350,90,.21,.32);break;
        case "venom": n("sine",510,155,.13,.17);break;
        case "storm": n("sawtooth",460,100,.12,.12);break;
        case "cannon":
          n("triangle",198,42,.35,.48);n("sine",430,77,.12,.21);break;
        case "frost":
          n("sine",990,1330,.23,.22);n("sine",1510,1000,.19,.13,.055);break;
        case "build":case "upgrade":
          n("triangle",610,200,.14,.34);n("triangle",890,345,.19,.26,.092);break;
        case "start":
          n("triangle",294,294,.24,.30);n("triangle",440,440,.45,.31,.19);break;
        case "leak":case "lost":
          n("triangle",261,135,.35,.31);n("sine",196,98,.40,.26,.16);break;
        case "won":case "cleared":
          [392,494,587].forEach((hz,i)=>n("triangle",hz,hz,.34,.25,i*.115));break;
        case "card":case "purchase":
          n("sine",660,660,.24,.28);n("sine",990,990,.30,.21,.078);break;
        default:
          n("sine",523,523,.19,.25);n("sine",784,784,.28,.22,.075);
      }
    }
  }
  window.PineSound=GameSound;
})();
