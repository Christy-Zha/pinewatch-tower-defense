(() => {
  'use strict';
  const TAU = Math.PI * 2;
  function blend(a, b, k) {
    function rgb(v) {
      let s=String(v).replace('#','');
      if(s.length===3) s=s.split('').map(c=>c+c).join('');
      return parseInt(s,16);
    }
    const aa=rgb(a),bb=rgb(b);
    let n=0;
    for(const off of [16,8,0])n|=Math.round(((aa>>off)&255)*(1-k)+((bb>>off)&255)*k)<<off;
    return '#'+(n>>>0).toString(16).padStart(6,'0');
  }
  function build(m,stage,index=0,skin='pine') {
    let seed=(4723921+index*84387)>>>0;
    index=stage.province?.scenery??index;
    const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const between=(a,b)=>a+(b-a)*rnd(),choose=arr=>arr[Math.floor(rnd()*arr.length)];
    const P={grass:'#8eae64',grass2:'#b8c97a',soil:'#a37b54',rock:'#89968c',
      tree:'#326d57',tree2:'#65965d',road:'#e9c587',water:'#57b7b0',accent:'#efb74c',...stage.palette};
    const trail=stage.path, pads=stage.pads;
    if(!trail?.length)return;
    const face=(pts,c)=>m.face(pts,c);
    const box=(x,y,z,w,h,d,c,yaw=0)=>m.box(x,y,z,w,h,d,c,yaw);
    const solid=(x,y,z,r1,r2,h,s,c,rot=0)=>m.frustum(x,y,z,r1,r2,h,s,c,rot);
    const B=(a,t=.2)=>blend(a,'#364944',t), L=(a,t=.2)=>blend(a,'#fff0c3',t);
    const rock=P.rock, moss=B(P.grass,.14), rockShade=B(rock,.45), stone=L(blend(rock,'#cbd1bc',.4),.23);
    const timber=blend(P.soil,'#9e6943',.64),bark=B(timber,.35);
    const grass=blend(P.grass,P.grass2,.2),entry=trail[0],end=trail[trail.length-1];
    const padPoints=pads.map(p=>Array.isArray(p)?p:[p.x,p.z]).concat((stage.supplies||[]).map(c=>[c.x,c.z]));
    const xs=trail.map(p=>p[0]),zs=trail.map(p=>p[1]);
    const x0=Math.min(10,Math.min(...xs)-5),x1=Math.max(470,Math.max(...xs)+13);
    const z0=Math.min(14,Math.min(...zs)-10),z1=Math.max(270,Math.max(...zs)+8);
    function distance(x,z,line) {
      let best=Infinity;
      for(let i=1;i<line.length;i++){
        const [px,pz]=line[i-1],[qx,qz]=line[i],dx=qx-px,dz=qz-pz;
        const t=Math.max(0,Math.min(1,((x-px)*dx+(z-pz)*dz)/(dx*dx+dz*dz||1)));
        best=Math.min(best,(x-px-t*dx)**2+(z-pz-t*dz)**2);
      }
      return Math.sqrt(best);
    }
    const dist2=(x,z,p)=>(p[0]-x)**2+(p[1]-z)**2;
    // A triangulated cap with a scalloped outline. Only boundary nodes move in height.
    const nx=18,nz=11,grid=[],rim=[];
    for(let j=0;j<=nz;j++){
      const row=[];
      for(let i=0;i<=nx;i++){
        const edge=i===0||j===0||i===nx||j===nz;
        let x=x0+(x1-x0)*i/nx+between(-4,4), z=z0+(z1-z0)*j/nz+between(-3.5,3.5);
        if((j===0||j===nz)&&(i===0||i===nx)){x+=i===0?10:-10;z+=j===0?8:-8;}
        row.push([x,edge?between(-.6,-.1):between(-.16,0),z]);
      }
      grid.push(row);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const a=grid[j][i],b=grid[j][i+1],c=grid[j+1][i+1],d=grid[j+1][i];
      const field=0.24+0.13*Math.sin(a[0]*.037+a[2]*.049)+0.13*Math.cos(a[0]*.021-a[2]*.031);
      const tone=(delta)=>blend(P.grass,P.grass2,Math.max(0,Math.min(.83,field+delta)));
      if((j+i)%2){face([a,d,b],tone(between(-.08,.16)));face([b,d,c],tone(between(-.08,.16)));}
      else{face([a,d,c],tone(between(-.08,.16)));face([a,c,b],tone(between(-.08,.16)));}
    }
    for(let i=0;i<=nx;i++)rim.push(grid[0][i]);
    for(let j=1;j<=nz;j++)rim.push(grid[j][nx]);
    for(let i=nx-1;i>=0;i--)rim.push(grid[nz][i]);
    for(let j=nz-1;j>0;j--)rim.push(grid[j][0]);
    const band=(depth,offset,colorJitter)=>rim.map(([x,,z])=>{
      const dx=(x-(x1+x0)/2)/(x1-x0),dz=(z-(z0+z1)/2)/(z1-z0);
      return [x+dx*offset+between(-1.6,1.6),-depth+between(-colorJitter,colorJitter),z+dz*offset+between(-1.6,1.6)];
    });
    const rings=[rim,band(3,2,.6),band(9,-1,1.8),band(16,1,2.4),band(26,-11,3.9)];
    const strata=[moss,blend(P.soil,rock,.14),blend(P.soil,rock,.57),B(rock,.28)];
    for(let j=0;j<strata.length;j++)for(let i=0;i<rim.length;i++){
      const next=(i+1)%rim.length, a=rings[j][i],b=rings[j][next],c=rings[j+1][next],d=rings[j+1][i];
      face([a,b,c],blend(strata[j],B(strata[j],.39),between(0,.65)));
      face([a,c,d],blend(strata[j],L(strata[j],.30),between(0,.60)));
    }
    face(rings[rings.length-1],rockShade);

    // The creek is arranged along one trail crossing in the first third of the map.
    const streamX=Math.max(x0+55,Math.min(x1-70,entry[0]+(end[0]>entry[0]?65:-65)));
    let brook=[],streamClear=false;
    for(const offset of [0,-19,19,-36,36,55,76]){
      const candidate=[];
      for(let j=0;j<=18;j++){
        const z=z0+4+(z1-z0-8)*j/18;
        const x=Math.max(x0+19,streamX+offset)+Math.sin(j*.58+index*.57)*8+Math.sin(j*.93)*3;
        candidate.push([x,z]);
      }
      if(padPoints.every(([x,z])=>distance(x,z,candidate)>14)&&(!stage.post||distance(...stage.post,candidate)>11)){
        brook=candidate;streamClear=true;break;
      }
    }
    const isWet=(x,z,r=0)=>streamClear&&distance(x,z,brook)<5+r;
    function ribbon(line,halfWidth,y,c,border=0) {
      const sides=line.map(([x,z],i)=>{
        const before=line[Math.max(i-1,0)],after=line[Math.min(i+1,line.length-1)];
        const dx=after[0]-before[0],dz=after[1]-before[1],len=Math.hypot(dx,dz)||1;
        const w=typeof halfWidth==='function'?halfWidth(i):halfWidth;
        return [[x-dz/len*w,y,z+dx/len*w],[x+dz/len*w,y,z-dx/len*w]];
      });
      for(let i=1;i<sides.length;i++){
        const [l,r]=sides[i-1],[ln,rn]=sides[i];
        face([l,ln,rn,r],typeof c==='function'?c(i):c);
        if(border){
          for(const [a,b] of [[l,ln],[r,rn]])face([a,b,[b[0],y-border,b[2]],[a[0],y-border,a[2]]],B(P.road,.2));
        }
      }
    }
    if(streamClear){
      ribbon(brook,6.1,.20,blend(P.soil,rock,.60));
      ribbon(brook,5.35,.32,blend(P.water,rock,.38));
      ribbon(brook,4.8,.41,i=>blend(P.water,'#9edcbb',.07+(i%4)*.045));
      for(let i=0;i<20;i++){
        const j=Math.floor(between(1,brook.length-1)),[x,z]=brook[j];
        const rx=x+between(-2.6,2.6),rz=z+between(-3,3);
        if(distance(rx,rz,trail)>11)face([[rx,.48,rz-2.1],[rx+.7,.48,rz],[rx,.48,rz+2.7],[rx-.45,.48,rz]],L(P.water,.57));
      }
      // Water spills over the front lip of the rock pedestal in three translucent-looking ribbons.
      const [wx]=brook[brook.length-1];
      let lipZ=z1;
      const bottom=grid[nz];
      for(let i=1;i<bottom.length;i++)if(wx>=bottom[i-1][0]&&wx<=bottom[i][0]){
        const t=(wx-bottom[i-1][0])/(bottom[i][0]-bottom[i-1][0]);
        lipZ=bottom[i-1][2]*(1-t)+bottom[i][2]*t;
      }
      const waterEnd=brook[brook.length-1][1];
      face([[wx-4.6,.48,waterEnd],[wx-4.4,.45,lipZ+1.5],[wx+4.5,.45,lipZ+1.5],[wx+4.65,.48,waterEnd]],P.water);
      for(const [off,w,shade,depth] of [[-4.4,2.8,.12,19],[-1.6,4,.47,23],[2.4,2.2,.23,18]]){
        face([[wx+off,.45,lipZ+1.5],[wx+off+w,.45,lipZ+1.5],
          [wx+off+w-.6,-depth,lipZ+2.8],[wx+off+.1,-depth-1,lipZ+2.6]],L(P.water,shade));
      }
    }
    const trailW=8.25;
    ribbon(trail,trailW+1.5,.55,blend(P.road,P.soil,.54));
    ribbon(trail,i=>trailW+(i%3)*.15,.68,i=>blend(P.road,L(P.road,.28),.09*(i%4)));
    // Road stones show the trail's direction without covering it in repeated tiles.
    for(let i=1;i<trail.length;i++){
      const [a,b]=trail[i-1],[c,d]=trail[i],dx=c-a,dz=d-b,len=Math.hypot(dx,dz);
      for(let t=4+between(0,5);t<len;t+=between(7,15)){
        const off=choose([-1,1])*between(4.4,7),x=a+dx*t/len-dz*off/len,z=b+dz*t/len+dx*off/len;
        if(!isWet(x,z,1)){
          const w=between(.7,1.9);
          face([[x-w,.74,z-.45],[x-.25,.74,z+.7],[x+w,.74,z+.48],[x+w*.6,.74,z-.55]],
            blend(P.road,choose([P.soil,'#fff7c7']),between(.18,.45)));
        }
      }
    }
    // A real timber bridge with braces and both handrails follows the road tangent.
    if(streamClear){
      let prev=null;
      const bridge=(x,z,dx,dz)=>{
        const len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,vx=-uz,vz=ux;
        const yaw=-Math.atan2(uz,ux);
        const q=(u,v)=>[x+ux*u+vx*v,z+uz*u+vz*v];
        const plank=(u,v,y,w,h,d,color)=>{
          const [a,b]=q(u,v);box(a,y,b,w,h,d,color,yaw);
        };
        for(const v of [-6.5,6.5])plank(0,v,1.05,22,1.6,1.7,bark);
        for(let j=-5;j<=5;j++)plank(j*2.12,0,1.93,2.04,.9,18.8,blend(timber,'#e5bf83',between(.18,.52)));
        for(const v of [-9.2,9.2]){
          for(const u of [-10,0,10]){
            plank(u,v,3.6,1.4,6,1.4,bark);plank(u,v,6.8,1.8,.6,1.8,L(timber,.46));
          }
          plank(0,v,5.5,21,1.02,1.15,L(timber,.35));
        }
      };
      for(let i=1;i<trail.length;i++){
        const [ax,az]=trail[i-1],[bx,bz]=trail[i],dx=bx-ax,dz=bz-az;
        for(let j=1;j<brook.length;j++){
          const [cx,cz]=brook[j-1],[ex,ez]=brook[j],sx=ex-cx,sz=ez-cz,det=dx*sz-dz*sx;
          if(Math.abs(det)<.001)continue;
          const t=((cx-ax)*sz-(cz-az)*sx)/det,u=((cx-ax)*dz-(cz-az)*dx)/det;
          if(t>=0&&t<=1&&u>=0&&u<=1){
            const x=ax+t*dx,z=az+t*dz;if(prev&&dist2(x,z,prev)<24**2)continue;
            bridge(x,z,dx,dz);prev=[x,z];
          }
        }
      }
    }
    const skinAccent=skin==='dawn'?'#d86e49':skin==='night'?'#ab8dde':P.accent;
    const roof=skin==='night'?'#615681':skin==='dawn'?'#a65647':'#4f7a88';
    // A pennant folded around a short spar. Both sides are colored.
    function flag(x,y,z,len,col,flip=1) {
      solid(x,y-1,z,.50,.39,len*1.24+1,6,bark);solid(x,y+len*1.24-.15,z,.81,0,1.35,6,'#e7c876');
      const top=y+len*1.21;
      const A=[x,top,z],B1=[x+flip*len*.53,top-.75,z+1.26],C=[x+flip*len,top+.12,z-.12];
      const D=[x+flip*len*.80,top-len*.20,z+.35],E=[x+flip*len*.99,top-len*.42,z-.1];
      const F=[x+flip*len*.52,top-len*.46-.25,z+1.23],G=[x,top-len*.41,z];
      face([A,B1,F,G],col);face([B1,C,D,E,F],B(col,.16));
      face([[x,top-.4,z+.15],[B1[0],B1[1]-.4,B1[2]+.1],
        [B1[0],B1[1]-1,B1[2]+.15],[x,top-1,z+.18]],L(col,.47));
    }
    function shadow(x,z,rx,rz) {
      const v=[];
      for(let i=0;i<8;i++){const a=-TAU*i/8;v.push([x+rx*Math.cos(a),.12,z+rz*Math.sin(a)]);}
      face(v,blend(moss,rockShade,.15));
    }
    function stoneBlock(x,y,z,rx,rz,h,ang=0,color=rock){
      const n=6+Math.floor(rnd()*2),low=[],belt=[],cap=[];
      for(let i=0;i<n;i++){
        const a=ang+TAU*i/n,f=between(.82,1.05),cx=Math.cos(a),sz=Math.sin(a);
        low.push([x+rx*.79*f*cx,y+.02,z+rz*.79*f*sz]);
        belt.push([x+rx*f*cx,y+h*between(.36,.54),z+rz*f*sz]);
        cap.push([x+rx*.58*f*cx-rx*.10,y+h*between(.87,1.03),z+rz*.58*f*sz-rz*.04]);
      }
      for(let i=0;i<n;i++){
        const j=(i+1)%n;face([low[i],low[j],belt[j],belt[i]],B(color,between(.04,.2)));
        face([belt[i],belt[j],cap[j],cap[i]],blend(color,L(color,.25),rnd()));
      }
      face(cap.slice().reverse(),L(color,.16));
    }
    function castle() {
      const [x,z]=end, flip=end[0]>=entry[0]?1:-1;
      const c=(u,v)=>[x+u*flip,z+v];
      const b=(u,y,v,w,h,d,col)=>box(c(u,v)[0],y,c(u,v)[1],w,h,d,col);
      const f=(u,y,v,r1,r2,h,n,col,angle=0)=>solid(c(u,v)[0],y,c(u,v)[1],r1,r2,h,n,col,angle);
      shadow(x+1,z+2,21,15);
      f(0,.14,0,21,19.2,1.1,8,B(stone,.28),.24);f(0,1.22,0,19.3,18.9,1,8,L(stone,.04),.24);
      // Twin halves of the gate leave open passages along the attack route.
      b(1,9,-7.5,16,14,5,stone);b(1,9,7.5,16,14,5,stone);
      b(1,14.8,0,15.9,4.4,11,stone);
      b(1,17.6,0,17.2,1.55,16,B(stone,.20));b(1,18.7,0,17.6,.9,16.4,L(stone,.29));
      for(const side of [-1,1]){
        const u=-7.07*side;
        for(const v of [-6.5,6.5]){
          for(let j=0;j<3;j++)b(u-side*.15,3.2+j*2.6,v,.75,2.06,2.7,L(stone,j%2?.2:.3));
        }
        const ax=x+u*flip;
        for(let i=0;i<9;i++){
          const a=Math.PI*i/9,bEnd=Math.PI*(i+1)/9;
          const ring=(r,q)=>[ax,8.0+r*Math.sin(q),z+r*Math.cos(q)];
          face([ring(5.1,a+.013),ring(7,a+.013),ring(7,bEnd-.013),ring(5.1,bEnd-.013)],i%2?L(stone,.34):L(stone,.46));
        }
      }
      // A recessed iron grate gives the entrance depth.
      for(let i=-3;i<=3;i++)b(2,7.9-Math.abs(i)*.40,i*1.35,.7,8.5-Math.abs(i)*.37,.34,rockShade);
      b(2,9.5,0,.7,.65,10,rockShade);b(2,7.5,0,.7,.6,9.1,rockShade);
      function turret(u,v,height,rad){
        f(u,1.7,v,rad*1.15,rad*1.05,2.35,8,B(stone,.23),Math.PI/8);
        f(u,3.9,v,rad,rad*.96,height-3.9,8,stone,Math.PI/8);
        for(const y of [5.7,11.2,height-2])f(u,y,v,rad*1.02,rad*1.03,.58,8,L(stone,.14),Math.PI/8);
        f(u,height-1,v,rad*1.02,rad*1.17,1.75,8,B(stone,.2),Math.PI/8);
        f(u,height+.73,v,rad*1.18,rad*1.17,1.2,8,L(stone,.20),Math.PI/8);
        const base=height+1.85,roofH=rad*1.68;
        f(u,base,v,rad*1.35,rad*1.34,.85,8,B(roof,.28),Math.PI/8);
        f(u,base+.81,v,rad*1.34,.25,roofH,8,roof,Math.PI/8);
        for(const t of [.30,.58]){
          const rr=rad*1.34*(1-t)+.25*t;
          f(u,base+.8+roofH*t,v,rr+.37,rr-.19,.60,8,L(roof,.16),Math.PI/8);
        }
        b(u,12.5,v+rad*.94,1.25,4.5,.36,B(rockShade,.36));b(u,10.3,v+rad*.95,2.05,.55,.60,L(stone,.2));
        b(u-rad*.95,12,v,.34,4.3,1.10,B(rockShade,.30));
        return base+roofH;
      }
      const high=turret(5.5,-3.6,24,5.55);turret(-2.2,-10,16.8,4.45);turret(1.7,9.8,16.6,4.75);
      const [fx,fz]=c(5.5,-3.6);flag(fx,high+.5,fz,8.6,skinAccent);
      for(const pos of [[-8,6.8],[4.8,11.5]]){
        const [xx,zz]=c(...pos);
        face([[xx-1.7,14.9,zz],[xx+1.7,14.9,zz],[xx+1.7,9.7,zz],
          [xx,8.5,zz],[xx-1.7,9.7,zz]],skinAccent);
      }
    }
    castle();
    const [sx,sz]=entry;
    for(const s of [-1,1]){
      const v=sz+s*10.7,xx=sx+(end[0]>=sx?4:-4);
      solid(xx,.1,v,2.75,2.1,2.7,6,rock);solid(xx,2.75,v,1.1,.84,7.25,6,bark);
      flag(xx,9.5,v,6.5,blend(P.accent,'#b84e3e',.70));
    }
    function safe(x,z,radius=3,h=0){
      if(x<x0+8||x>x1-8||z<z0+7||z>z1-7||isWet(x,z,radius))return false;
      if(dist2(x,z,end)<(22+radius)**2||dist2(x,z,entry)<(11+radius)**2)return false;
      for(const dz of [0,-h*.28,-h*.55]){
        const rz=z+dz, r=radius*(dz===0?1:.62);
        if(distance(x,rz,trail)<trailW+r+1.5||padPoints.some(p=>dist2(x,rz,p)<(12+r)**2)||(stage.post&&dist2(x,rz,stage.post)<(12+r)**2))return false;
      }
      return true;
    }
    function pine(x,z,h,r){
      const angle=between(0,1.1),blue=choose([0,.08,.17]);
      const base=blend(P.tree,'#335e64',blue),light=P.tree2;
      solid(x,.1,z,r*.155,r*.10,h*.40,5,bark,angle);
      for(const [y,w,hh,shade] of [[.22,1,.48,.12],[.43,.78,.44,.25],[.65,.54,.35,.43]]){
        const sides=6,ring=[],tip=[x-.06*r,y*h+h*hh,z-.04*r];
        for(let i=0;i<sides;i++){
          const a=angle+TAU*i/sides,rr=r*w*(i%2?.90:1.06);
          const px=x+rr*Math.cos(a),pz=z+rr*Math.sin(a);
          ring.push([px,y*h+(i%2?0:.38),pz]);
        }
        for(let i=0;i<sides;i++){
          const j=(i+1)%sides;
          const crownColor=blend(base,light,shade+(i===2?.15:0));
          const snowy=index===4&&(y>.64||((i+2)%6===0&&y>.40));
          face([ring[i],tip,ring[j]],snowy?blend(crownColor,'#f2f7ef',.82):crownColor);
        }
        face(ring,B(base,.22));
      }
    }
    function mountain(x,z,rx,rz,h) {
      const sides=7,ang=between(0,1),rings=[[],[],[],[]];
      const ridge=blend(rock,P.tree,.19);
      for(let i=0;i<sides;i++){
        const a=TAU*i/sides+ang,dx=Math.cos(a)*rx*between(.86,1.08),dz=Math.sin(a)*rz*between(.86,1.08);
        const snow=between(.53,.74);
        rings[0].push([x+dx,.12,z+dz]);rings[1].push([x+dx*.69+1,h*.28+between(-1.3,1.3),z+dz*.65]);
        rings[2].push([x+dx*(1-snow)-.10*rx,h*snow,z+dz*(1-snow)-.10*rz]);
        rings[3].push([x-rx*.13,h,z-rz*.18]);
      }
      for(let j=0;j<3;j++)for(let i=0;i<sides;i++){
        const n=(i+1)%sides,A=rings[j][i],B1=rings[j][n],C=rings[j+1][n],D=rings[j+1][i];
        const peak=index===6?'#c27347':index===4?'#fbfff5':'#dedfcb';
        const c=j===2?blend(peak,rock,between(.03,.28)):
          blend(ridge,j===0?P.grass2:'#c8c6b0',between(.07,.43));
        if(j===2)face([A,D,B1],c);
        else{face([A,D,C],c);face([A,C,B1],blend(c,rockShade,between(.07,.23)));}
      }
    }
    const occupied=[];
    function landmark(x,z) {
      const lantern=(xx,zz,h,c)=>{
        solid(xx,.1,zz,2.8,2.5,1.1,6,rock);solid(xx,1.25,zz,.73,.48,h-1.2,6,bark);
        solid(xx,h-.5,zz,1.7,2.05,.75,4,B(rock,.3),Math.PI/4);
        solid(xx,h+.22,zz,1.45,1.45,2.9,4,c,Math.PI/4);
        solid(xx,h+3.1,zz,2.7,.18,1.5,4,B(rock,.2),Math.PI/4);
      };
      if(index===0){
        // Painted trail sign with direction carved into its two boards.
        solid(x,.15,z,.95,.72,7.1,6,timber);
        box(x+.9,6.5,z,6.3,1.8,1.1,L(timber,.37),-.12);
        box(x-.7,4.8,z,4.8,1.2,.92,timber,.13);
      }else if(index===1){
        // The river ferryman's landing and mooring posts.
        for(let i=0;i<7;i++)box(x-4.8+i*1.6,1.55,z,1.48,.65,7.0,L(timber,i%2?.31:.16));
        for(const xx of [-4.3,4.3])for(const zz of [-2.7,2.7])solid(x+xx,.17,z+zz,.68,.50,5.6,6,bark);
        lantern(x+3.8,z+2.6,5.9,'#f3c982');
      }else if(index===2){
        // A hopper on short, iron-bound rails and an exposed vein of amber.
        for(const side of [-1,1])box(x+side*2.6,.68,z,1,.65,14.3,rockShade);
        for(let i=-2;i<=2;i++)box(x,.31,z+i*3.2,7.4,.60,1.2,bark);
        for(const side of [-1,1])for(const off of [-2.2,2.2])solid(x+side*2.55,.72,z+off,1.2,1.2,1.0,6,rockShade);
        solid(x,1.55,z,3,4.85,3.35,4,B(timber,.10),Math.PI/4);
        solid(x,4.73,z,4.83,4.7,.68,4,rockShade,Math.PI/4);
        for(const [dx,dz,h] of [[0,0,2.8],[-1.4,1.4,2.2],[1.4,-1.4,3.4]]){
          solid(x+dx,5.2,z+dz,1.3,.25,h,5,'#df984d');
        }
      }else if(index===3){
        lantern(x,z,10.8,'#9be3be');lantern(x+5.5,z+1.7,6.3,'#d4ecc2');
        for(let i=0;i<8;i++){
          const px=x+between(-5,5),pz=z+between(-5,5),h=between(2,4.2);
          solid(px,.15,pz,.28,.17,h,4,P.tree2);solid(px,h,pz,.40,.36,1.4,5,'#765841');
        }
      }else if(index===4){
        stoneBlock(x,.1,z,5.4,3.7,2.3,0,B(rock,.09));
        stoneBlock(x-.6,2.43,z,3.7,2.6,2.4,.47,rock);
        stoneBlock(x-.2,4.84,z,2.6,1.9,1.8,.26,'#dee9e3');
        flag(x+1.2,6,z,5.6,'#598bb1');
      }else if(index===5){
        for(const [dx,h] of [[-4.1,9],[4.1,6.3]]){
          solid(x+dx,.17,z,2.75,2.70,.9,6,B(stone,.28));
          solid(x+dx,1.07,z,1.96,1.8,h,6,stone);
          solid(x+dx,h+.98,z,2.57,2.48,1.2,6,L(stone,.15));
        }
        box(x-2.1,10.9,z,6.7,1.65,4.3,stone);
        solid(x+1.25,2.6,z+3.7,0,1.55,2.8,5,'#8e76bc');
        solid(x+1.25,5.4,z+3.7,1.55,0,2.2,5,'#bda6db');
      }else if(index===6){
        stoneBlock(x,.12,z,6.8,4.3,2.0,.74,B(rock,.22));
        for(const [dx,dz,h] of [[-2,1,6],[.5,-.3,8.4],[2.6,1.6,4.6]]){
          solid(x+dx,1.2,z+dz,1.45,1.23,h,5,'#d67c45');solid(x+dx,h+1.2,z+dz,1.23,.04,2.3,5,'#fac477');
        }
      }else{
        for(const d of [-3.15,3.15]){box(x+d,4.8,z,1.65,9.6,2.1,stone);box(x+d,9.75,z,2.2,.6,2.55,L(stone,.17));}
        box(x,9.9,z,8.6,.94,1.28,bark);solid(x,6.0,z,2.2,1.12,2.8,8,'#d5ad65');
        solid(x,5.6,z,2.75,2.23,.61,8,'#b69354');solid(x,5.19,z,.43,.43,.55,6,rockShade);
        solid(x,8.8,z,.38,.37,1.0,6,bark);solid(x,10.3,z,6.3,.38,4.8,4,roof,Math.PI/4);
      }
    }
    let landmarkCount=0;
    for(const [fx,fz] of [[.77,.13],[.26,.81],[.48,.17],[.18,.21],[.84,.80],[.47,.78]]){
      const x=x0+fx*(x1-x0),z=z0+fz*(z1-z0);
      if(safe(x,z,7.3,14)){
        landmark(x,z);occupied.push([x,z,8.4]);landmarkCount++;
        if(landmarkCount>=2)break;
      }
    }
    if(index%4!==3){
      for(const fx of [.18,.32,.62,.87]){
        const x=x0+(x1-x0)*fx+between(-9,9),z=z0+between(14,24),r=between(12,18),h=between(16,31);
        if(safe(x,z,r,h)&&occupied.every(o=>dist2(x,z,o)>(o[2]+r*.67)**2)){
          mountain(x,z,r,r*.65,h);occupied.push([x,z,r*.88]);
          if(safe(x+r*.71,z+3,r*.57,h*.52))mountain(x+r*.71,z+3,r*.57,r*.41,h*.52);
        }
      }
    }
    // Clustered forests preserve open clearings. Front trees are intentionally shorter.
    const anchors=[];
    for(let j=0;j<11;j++){
      anchors.push([x0+(x1-x0)*(j+.4)/11,z0+between(11,40)]);
      anchors.push([x0+(x1-x0)*(j+.4)/11,z1-between(8,27)]);
    }
    for(let j=0;j<9;j++)anchors.push([between(x0+12,x1-12),between(z0+43,z1-35)]);
    for(const [ax,az] of anchors){
      for(let k=0;k<7;k++){
        const x=ax+between(-14,14),z=az+between(-9,9);
        const h=z>z1-36?between(8.5,16.2):between(12,26), r=h*between(.18,.25);
        if(!safe(x,z,r,h)||occupied.some(o=>dist2(x,z,o)<(o[2]+r*.65)**2))continue;
        shadow(x+.8,z+1,r*.97,r*.76);
        if(index===2&&rnd()<.57){
          solid(x,.14,z,r*.14,r*.1,h*.58,5,bark);
          stoneBlock(x,h*.40,z,r,r*.91,h*.46,rnd(),choose(['#c49148','#bc753e','#d8ab5c']));
          stoneBlock(x-r*.38,h*.60,z+r*.23,r*.64,r*.60,h*.31,rnd(),choose(['#dfad5e','#d89d53']));
        }else if(index===6&&rnd()<.56){
          solid(x,.1,z,r*.72,r*.57,h*.49,5,B(rock,.18),.38);
          solid(x+.74*r,.14,z+.41*r,r*.51,r*.45,h*.31,5,rock,.31);
        }else pine(x,z,h,r);
        occupied.push([x,z,r*.7]);
      }
    }
    for(let i=0;i<66;i++){
      const x=between(x0+8,x1-7),z=between(z0+9,z1-8),r=between(1.8,4.9);
      if(!safe(x,z,r,r*1.3)||occupied.some(o=>dist2(x,z,o)<(o[2]+r*.68)**2))continue;
      stoneBlock(x,.18,z,r,r*between(.57,.86),r*between(.52,1.13),between(0,2),blend(rock,P.soil,between(0,.25)));
      if(r>3.6&&safe(x+r,z+r*.62,r*.38))stoneBlock(x+r,.14,z+r*.62,r*.42,r*.36,r*.32,r,rock);
    }
    // Waystones and small flower clusters lend the broad terrain a readable sense of scale.
    for(let i=0;i<125;i++){
      const x=between(x0+9,x1-9),z=between(z0+8,z1-8);
      if(!safe(x,z,1,2)||occupied.some(o=>dist2(x,z,o)<o[2]**2))continue;
      for(let j=0;j<3;j++){
        const px=x+between(-2.2,2.2),pz=z+between(-1.7,1.7);
        const h=between(.85,2.30);
        face([[px-.55,.1,pz],[px+.35,h,pz+.1],[px+.45,.1,pz+.15]],blend(P.tree2,P.grass,.35));
        if(i%4===0){
          face([[px-.75,h,pz],[px,h-.25,pz+.65],[px+.8,h,pz],[px,h+.31,pz-.55]],
            choose(['#f2da84','#f0d8aa','#ebd1a3',L(P.accent,.18)]));
        }
      }
    }
    // Octagonal engraved foundations and inlaid build markers.
    for(const [x,z] of padPoints){
      shadow(x+.8,z+1.3,9.7,8.6);
      solid(x,.13,z,9.15,9.25,1.07,8,B(stone,.37),Math.PI/8);
      solid(x,1.19,z,9.2,8.25,1.1,8,blend(stone,P.soil,.16),Math.PI/8);
      solid(x,2.29,z,7.43,7.35,.23,8,B(stone,.19),Math.PI/8);
      solid(x,2.53,z,6.87,6.80,.16,8,blend(stone,P.grass,.16),Math.PI/8);
      for(const [w,d] of [[7.3,1.67],[1.67,7.3]])box(x,2.83,z,w,.36,d,'#eddeb5');
    }
  }
  window.PineScenery={build};
})();
