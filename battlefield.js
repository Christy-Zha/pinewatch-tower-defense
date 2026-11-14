/* The expanded battlefield keeps the original HUD, construction sites and controls. */
(() => {
  'use strict';
  const shell=document.getElementById('battle-shell');
  const expand=document.getElementById('battle-expand');
  const map=document.getElementById('map-area');
  const dialog=document.getElementById('dialog');
  const sound=document.getElementById('sound'),utilities=sound.parentElement;
  const dockButtons=[...shell.querySelectorAll('[data-dock-tab]')];
  const compact=window.matchMedia('(max-width:820px) and (orientation:portrait), (max-width:580px)');
  const outside=[document.querySelector('.topbar'),document.querySelector('.journal-strip'),document.querySelector('footer')];
  const enterIcon='M3 7V3h4m6 0h4v4m0 6v4h-4m-6 0H3v-4';
  const exitIcon='M3 7h4V3m6 0v4h4m0 6h-4v4m-6 0v-4H3';
  const factor=1.24;

  function setExpanded(on){
    if(on)expand.before(sound);else utilities.prepend(sound);
    document.documentElement.classList.toggle('battle-expanded',on);
    for(const region of outside)region.inert=on;
    expand.setAttribute('aria-pressed',String(on));
    expand.querySelector('span').textContent=on?'退出全屏':'全屏';
    expand.querySelector('path').setAttribute('d',on?exitIcon:enterIcon);
    expand.title=on?'退出全屏战场（Esc）':'进入全屏战场';
    expand.setAttribute('aria-label',expand.title);
    expand.focus({preventScroll:true});
  }
  function inBattleView(){return document.documentElement.classList.contains('battle-expanded');}
  function setDock(name){
    shell.dataset.dock=name;
    for(const tab of dockButtons)tab.setAttribute('aria-pressed',String(tab.dataset.dockTab===name));
  }
  function zoom(value){window.dispatchEvent(new CustomEvent('pine-camera-zoom',{detail:value}));}

  expand.addEventListener('click',()=>setExpanded(!inBattleView()));
  document.getElementById('cam-zoom-in').addEventListener('click',()=>zoom(factor));
  document.getElementById('cam-zoom-out').addEventListener('click',()=>zoom(1/factor));
  for(const tab of dockButtons)tab.addEventListener('click',()=>setDock(tab.dataset.dockTab));

  document.addEventListener('keydown',event=>{
    if(inBattleView()&&!dialog.open&&event.key==='Escape'){
      event.preventDefault();event.stopImmediatePropagation();setExpanded(false);
    }
  },true);
  document.getElementById('pad-controls').addEventListener('click',event=>{
    if(inBattleView()&&compact.matches&&event.target.closest('.pad')&&!document.getElementById('manage').hidden)setDock('armory');
  });
  map.addEventListener('wheel',event=>{
    if(!inBattleView()||event.ctrlKey||event.metaKey||event.deltaY===0)return;
    event.preventDefault();
    const units=event.deltaMode===1?16:event.deltaMode===2?map.clientHeight:1;
    zoom(Math.exp(-Math.max(-180,Math.min(180,event.deltaY*units))*.0016));
  },{passive:false});
})();
