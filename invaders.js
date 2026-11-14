/* Sculpted enemy miniatures. Local Y points up, local +Z points forward. */
(() => {
  'use strict';
  const TAU=Math.PI*2;
  const iron='#445360', slate='#607784', silver='#acbcc0', metalLight='#d1d8ce';
  const leather='#704534', leatherLight='#aa7148', soot='#302d32', bone='#efdcad';
  const gold='#d7a253', goldLight='#f2ca78', bronze='#9b673f',brass='#b89861';
  const colorCache=new Map();
  function cold(hex){
    if(!colorCache.has(hex)){
      const a=parseInt(hex.slice(1),16),t=[135,191,210];
      const channels=[16,8,0].map((v,i)=>Math.round(((a>>v)&255)*.62+t[i]*.38));
      colorCache.set(hex,'#'+channels.map(v=>v.toString(16).padStart(2,'0')).join(''));
    }
    return colorCache.get(hex);
  }
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const norm=a=>{const len=Math.hypot(...a)||1;return a.map(v=>v/len);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function space(f,transform){return (points,c)=>f(points.map(transform),c);}
  function move(f,x,y,z){return space(f,p=>[x+p[0],y+p[1],z+p[2]]);}
  function scale(f,x,y=x,z=x){return space(f,p=>[x*p[0],y*p[1],z*p[2]]);}
  function yaw(f,a){const c=Math.cos(a),s=Math.sin(a);return space(f,([x,y,z])=>[x*c+z*s,y,z*c-x*s]);}
  function pitch(f,a){const c=Math.cos(a),s=Math.sin(a);return space(f,([x,y,z])=>[x,y*c-z*s,z*c+y*s]);}
  function roll(f,a){const c=Math.cos(a),s=Math.sin(a);return space(f,([x,y,z])=>[x*c-y*s,y*c+x*s,z]);}

  // Profiles are cross sections [height, half-width, half-depth, x, z].
  function loft(f,profile,n,colors,twist=0){
    const rings=profile.map(([y,rx,rz,x=0,z=0])=>{
      const ring=[];
      for(let i=0;i<n;i++){const a=TAU*(i+.5)/n+twist;ring.push([x+Math.cos(a)*rx,y,z+Math.sin(a)*rz]);}
      return ring;
    });
    const get=(j,i)=>typeof colors==='function'?colors(j,i):Array.isArray(colors)?colors[Math.min(j,colors.length-1)]:colors;
    for(let j=1;j<rings.length;j++)for(let i=0;i<n;i++){
      const k=(i+1)%n,lo=rings[j-1],hi=rings[j];
      f([lo[i],hi[i],hi[k],lo[k]],get(j-1,i));
    }
    f(rings[0],get(0,0));f(rings[rings.length-1].slice().reverse(),get(rings.length-2,0));
  }
  function bulb(f,x,y,z,rx,ry,rz,c,n=7){
    loft(move(f,x,y,z),[[-ry,.16*rx,.16*rz],[-ry*.55,rx*.85,rz*.85],
      [ry*.16,rx,rz],[ry*.73,rx*.68,rz*.68],[ry,rx*.16,rz*.16]],n,c);
  }
  // A continuous tapered, bent tube; knuckles, tails, limbs and horns use the same joint logic.
  function sweep(f,profile,n,colors){
    const rings=profile.map((p,j)=>{
      const prev=profile[Math.max(0,j-1)],next=profile[Math.min(profile.length-1,j+1)];
      const forward=norm([next[0]-prev[0],next[1]-prev[1],next[2]-prev[2]]);
      const reference=Math.abs(forward[0])<.85?[1,0,0]:[0,0,1];
      const side=norm(cross(reference,forward)),up=cross(forward,side);
      const rx=p[3],ry=p[4]??rx,ring=[];
      for(let i=0;i<n;i++){
        const a=(i+.5)*TAU/n,cs=Math.cos(a)*rx,sn=Math.sin(a)*ry;
        ring.push([p[0]+cs*up[0]+sn*side[0],p[1]+cs*up[1]+sn*side[1],p[2]+cs*up[2]+sn*side[2]]);
      }
      return ring;
    });
    const col=j=>Array.isArray(colors)?colors[Math.min(j,colors.length-1)]:colors;
    for(let j=1;j<rings.length;j++)for(let i=0;i<n;i++){
      const k=(i+1)%n,a=rings[j-1],b=rings[j];
      f([a[i],a[k],b[k],b[i]],col(j-1));
    }
    f(rings[0].slice().reverse(),col(0));f(rings[rings.length-1],col(rings.length-2));
  }
  function pipe(f,a,b,r,s,c,n=7){sweep(f,[[...a,r],[...b,s]],n,c);}
  function stripe(f,a,b,width,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
    const off=[-dy*width/(2*len),dx*width/(2*len),0];
    f([add(a,off),add(b,off),add(b,off.map(v=>-v)),add(a,off.map(v=>-v))],color);
  }
  // Extruded plates retain a silhouette in profile and under rotation.
  function plate(f,outline,z,thick,c,edge,ridge=0){
    const back=outline.map(([x,y])=>[x,y,z-thick]),front=outline.map(([x,y])=>[x,y,z]);
    if(ridge){
      const mid=[0,0,z+ridge];for(const p of outline){mid[0]+=p[0]/outline.length;mid[1]+=p[1]/outline.length;}
      for(let i=0;i<front.length;i++)f([front[i],front[(i+1)%front.length],mid],c);
    }else f(front,c);
    f(back.slice().reverse(),edge);
    for(let i=0;i<front.length;i++){const j=(i+1)%front.length;f([front[i],back[i],back[j],front[j]],edge);}
  }
  function stud(f,x,y,z,r,c=gold){
    const p=[[x-r,y,z],[x,y+r,z],[x+r,y,z],[x,y-r,z]],tip=[x,y,z+r*.42];
    for(let i=0;i<4;i++)f([p[i],p[(i+1)%4],tip],c);
  }
  const palm='#839b53',sage='#a6b669',forest='#72874f';
  function ear(f,s,width,up,skin,inside){
    const a=[s*.88,.61,.18],b=[s*.94,-.61,.2],c=[s*width,up,-.34],d=[s*1.15,.06,-.65];
    f([a,b,c],skin);f([a,c,d],skin);f([c,b,d],skin);
    f([[s*1.04,.40,.23],[s*1.08,-.29,.25],[s*(width-.30),up-.24,-.15]],inside);
  }
  function eye(f,s,x,y,z,w,h,eyeColor,eyebrow,pupil='#362d29'){
    const local=move(f,x*s,y,z),inc=w*.14;
    const outer=[s*w,inc,0],inner=[-s*w,-inc,.14];
    local([inner,[s*w*.01,h*.80,.11],outer,[s*w*.27,-h*.98,.12]],'#40352e');
    local([[-s*w*.87,-inc+.01,.17],[s*w*.02,h*.58,.19],[s*w*.82,inc,.12],[s*w*.19,-h*.67,.20]],eyeColor);
    local([[-s*w*.23,h*.26,.23],[s*w*.11,h*.40,.21],[s*w*.12,-h*.55,.23],[-s*w*.19,-h*.41,.24]],pupil);
    local([[-s*w*1.09,-inc+h*.65,.13],[s*w*.87,inc+h*.42,.08],[s*w*1.02,inc+h*1.17,-.11],[s*w*.09,h*1.76,-.07]],eyebrow);
    local([[-s*w*1.09,-inc+h*.65,.13],[s*w*.09,h*1.76,-.07],[-s*w*1.12,h*1.13,-.06]],eyebrow);
    stud(local,-s*w*.11,h*.09,.245,w*.095,'#fff4bd');
  }
  function teeth(f,s,x,y,z,h,r,ivory=bone){
    sweep(f,[[s*x,y,z,r],[s*(x+.15*r),y+h*.40,z+r*.25,r*.82],
      [s*(x+.45*r),y+h,z+r*.66,.035]],5,ivory);
  }
  function humanoidFace(f,kind) {
    const scout=kind==='scout',lord=kind==='boss';
    const skin=lord?'#b95d45':scout?palm:'#7c9558';
    const light=lord?'#cf7956':scout?sage:'#96ab6b',deep=lord?'#8e483c':forest;
    // Position the widest ring at the temples, then cut the cheeks back toward the jaw.
    loft(f,[[-1.55,1.03,.75,0,.07],[-1.16,1.51,1.21,0,.08],[-.24,1.85,1.51],
      [.68,2.01,1.52,0,-.08],[1.36,1.80,1.30,0,-.17],[1.71,1.06,.91,0,-.18]],10,skin);
    bulb(f,0,-.97,1.05,1.35,.63,.71,light,8);
    for(const s of [-1,1]){
      ear(move(f,s*.69,-.04,-.10),s,scout?2.20:1.65,scout?1.23:.65,skin,lord?'#a05048':'#9c9065');
      const cheek=[[s*.61,-.18,1.40],[s*1.34,-.01,1.26],[s*1.66,-.28,1.04],
        [s*1.19,-.68,1.34],[s*.62,-.53,1.58]];
      f(cheek,light);
      eye(f,s,.92,.33,1.39,.60,.35,lord?'#ffb34d':'#ffe49d',deep);
    }
    const n=scout?.66:.82;
    loft(move(f,0,-.11,1.46),[[-.41,n*.76,.31,0,.18],[-.24,n,.47,0,.19],[.19,n*.64,.41],[.75,n*.32,.19,0,-.16]],7,light);
    for(const s of [-1,1]){stud(f,s*n*.58,-.37,1.93,.105,deep);teeth(f,s,scout?.75:1.04,-1.03,1.68,scout?.54:1.12,scout?.20:.30);}
    f([[-.83,-.81,1.68],[-.21,-.70,1.84],[.36,-.75,1.86],[.83,-.69,1.68],
      [.56,-.94,1.76],[-.33,-.92,1.83]],'#513a34');
    stripe(f,[.66,-.71,1.80],[.95,-.58,1.60],.09,deep);
    if(kind==='brute'){
      stripe(f,[-1.31,.87,1.28],[-1.09,.57,1.44],.115,'#cec195');
      stripe(f,[-.85,.04,1.53],[-.63,-.26,1.56],.13,'#c1b786');
    }
    if(lord){
      for(const s of [-1,1]){
        const ridge=move(f,s*1.36,-.28,1.08);
        stripe(ridge,[-s*.17,.1,.12],[s*.22,-.40,.09],.16,'#dfba82');
      }
    }
  }
  function leg(f,s,phase,armored=false,big=false){
    const t=phase+(s>0?0:Math.PI),swing=Math.sin(t),lift=Math.max(0,Math.cos(t));
    const d=big?1.45:armored?1.24:1,h=armored?5:3.93,w=armored?1:.68;
    const hip=[s*d,h,0],knee=[s*(d+.10),h*.56+lift*.68,swing*.77+.28],
      foot=[s*(d+.16),.61+lift*.71,swing*(armored?1.63:1.43)];
    sweep(f,[[...hip,w],[...mix(hip,knee,.54),w*1.10],[...knee,w*.68],
      [...mix(knee,foot,.50),w*.80],[...foot,w*.56]],7,[leather,leather,'#5a4742','#51403a']);
    const boot=move(f,...foot);
    loft(boot,[[-.61,w*.89,w*1.24,0,.31],[-.39,w*1.13,w*1.44,0,.31],
      [.02,w*1.08,w*1.35,0,.25],[.51,w*.77,w*.86,0,-.01],[.78,w*.75,w*.78,0,-.12]],7,['#48352e',leather,leatherLight,leather]);
    if(armored){
      const g=move(f,...knee);
      plate(g,[[-w*.74,.47],[0,.85],[w*.70,.47],[w*.61,-.25],[0,-.61],[-w*.55,-.24]],w*.71,.23,big?iron:slate,silver,.28);
      stud(g,0,.42,w*.78,.15,big?gold:silver);
    }else pipe(f,mix(knee,foot,.71),mix(knee,foot,.86),w*.80,w*.75,'#ae8d62',6);
  }
  function forearm(f,shoulder,elbow,hand,w,skin,bracer){
    sweep(f,[[...shoulder,w*.85],[...mix(shoulder,elbow,.48),w*1.03],[...elbow,w*.70],
      [...mix(elbow,hand,.38),w*.92],[...hand,w*.61]],7,[skin,skin,skin,skin]);
    const a=mix(elbow,hand,.46),b=mix(elbow,hand,.90);
    pipe(f,a,b,w*.94,w*.72,bracer,7);pipe(f,mix(elbow,hand,.48),mix(elbow,hand,.60),w*.96,w*.93,bracer===leather?leatherLight:silver,7);
    bulb(f,...hand,w*.71,w*.78,w*.76,skin,7);
    for(let i=-1;i<=1;i++){
      const joint=add(hand,[i*w*.30,-w*.14,w*.52]);
      pipe(f,joint,add(joint,[.03,-w*.35,w*.04]),w*.14,w*.12,skin,5);
    }
    return move(f,...hand);
  }
  function sash(f,x1,y1,z1,x2,y2,z2,width,c){
    stripe(f,[x1,y1,z1],[x2,y2,z2],width,c);
    stripe(f,[x1+width*.28,y1,z1+.02],[x2+width*.28,y2,z2+.02],.09,leatherLight);
  }
  function scout(f,t,pose) {
    const oscill=Math.sin(t),bob=.17-.17*Math.cos(t*2),attack=pose==='attack';
    for(const s of [-1,1])leg(f,s,t);
    const body=yaw(move(f,0,bob,0),oscill*.105);
    loft(body,[[3.53,1.53,1.19],[4.01,1.88,1.39],[5.13,1.44,1.06],[6.55,1.67,1.21],
      [7.51,1.96,1.26],[7.92,1.28,.99]],8,['#9d7751','#8a6549','#795341','#a27a50','#ab8356']);
    loft(body,[[4.51,1.79,1.31],[4.65,1.80,1.32],[5.04,1.65,1.23]],8,[leatherLight,'#594138']);
    plate(body,[[-.35,4.95],[.35,4.95],[.35,4.57],[-.35,4.57]],1.32,.16,gold,bronze,.09);
    sash(body,-1.36,7.73,.94,1.03,5.03,1.20,.62,leather);
    bulb(body,1.38,4.63,.74,.61,.77,.62,leather,6);
    const pack=move(body,0,6.49,-1.02);
    loft(pack,[[-1.15,1.00,.55],[-.65,1.18,.79],[.38,1.14,.80],[.96,.95,.56]],7,
      ['#725643','#9d7954','#a38259']);
    const back=yaw(pack,Math.PI);
    plate(back,[[-.83,.77],[.86,.77],[.83,.12],[.12,-.26],[-.80,.11]],.76,.12,'#806346',leather,.13);
    stud(back,.09,-.09,.87,.16,gold);
    const head=scale(yaw(move(body,0,9.41,.24),-oscill*.10),1.23,1.27,1.18);
    humanoidFace(head,'scout');
    // Slouch cap folds over the back; the red feather marks the scouts at board scale.
    loft(head,[[1.02,2.02,1.60,0,-.11],[1.25,2.02,1.58,0,-.14],[1.65,1.86,1.44,-.07,-.25],
      [2.03,1.48,1.09,-.24,-.43],[2.22,.82,.64,-.63,-.67],[2.03,.25,.27,-1.00,-1.08]],9,
      ['#655a41','#b99255','#8b8050','#81774d','#766b47']);
    sweep(head,[[-1.06,1.56,-.02,.13],[-1.50,2.21,-.33,.24,.17],[-1.65,2.85,-.49,.24,.13],
      [-1.54,3.27,-.64,.035]],5,['#804b3a','#b56243','#d18a59']);
    for(const s of [-1,1]){
      const swing=-s*oscill;
      const sh=[s*1.66,7.35,.05],el=[s*2.04,6.0,.13+swing*.69],
        hand=[s*2.33,5.43+(attack&&s>0?1.30:0),.79+swing*1.47+(attack&&s>0?1.18:0)];
      const g=forearm(body,sh,el,hand,.66,palm,leather);
      if(s<0){
        const shield=yaw(move(g,-.31,.29,.30),-.64);
        const outer=[[-1.30,1.36],[-.21,1.78],[1.02,1.52],[1.44,.68],[1.10,-.78],[.10,-1.78],[-1.10,-1.08],[-1.50,.36]];
        plate(shield,outer,.28,.37,'#b69d6b','#665444',.17);
        plate(shield,outer.map(([x,y])=>[x*.84,y*.84]),.48,.10,'#56756a','#635c49',.20);
        stud(shield,0,.07,.70,.51,'#b8ae81');for(const x of [-.97,.95])stud(shield,x,.77,.55,.10,goldLight);
      }else{
        const blade=roll(pitch(move(g,.12,.29,.39),attack?.91:.28+swing*.23),-.27);
        pipe(blade,[0,-.66,0],[0,.64,0],.17,.19,leatherLight);pipe(blade,[-.55,.64,0],[.56,.64,0],.13,.10,gold,5);
        plate(blade,[[-.25,.70],[.27,.70],[.39,2.29],[.17,3.46],[-.19,2.14]],.12,.23,silver,iron,.21);
      }
    }
  }
  function wolf(f,t,pose){
    const gallop=Math.sin(t),bob=.27*Math.sin(2*t),attack=pose==='attack';
    const fur='#aa5d3b',light='#d58d52',ruff='#e4b67c',cream='#f1d19d',dark='#774735';
    const torso=move(f,0,bob,0);
    // Thorax, tucked waist and haunch described by sections perpendicular to the spine.
    const spine=pitch(move(torso,0,5.44,-.21),Math.PI/2);
    loft(spine,[[-4.5,.54,.64],[-3.75,1.57,1.57],[-2.68,1.86,1.82],
      [-1.22,1.49,1.67],[.11,1.61,1.89],[1.61,1.99,2.23],[2.83,1.76,2.05],
      [3.63,1.00,1.32]],8,(j,i)=>i>=1&&i<=3?j>4?ruff:'#d69c67':i===6?dark:fur);
    for(const s of [-1,1])for(const front of [-1,1]){
      const stride=t+((s*front<0)?Math.PI:0)+(front<0?.48:0),step=Math.sin(stride),lift=Math.max(0,Math.cos(stride));
      const x=s*(front>0?1.20:1.14),z=front>0?2.04:-2.76;
      const hip=[x,5.50+bob,z],knee=[x*1.05,(front>0?3.85:3.28)+bob,z+(front>0?-.45:1.19)+step*.60];
      const hock=[x*1.10,1.60+lift*.56,z+(front>0?.08:-.70)+step*1.67];
      const foot=[x*1.11,.48+lift*(front>0?.93:.77),z+.37+step*1.80];
      const w=front>0?.77:1.04;
      sweep(f,[[...hip,w],[...mix(hip,knee,.48),w*1.05],[...knee,w*.70],[...hock,.38],[...foot,.28]],7,[fur,light,light,dark]);
      bulb(f,foot[0],foot[1],foot[2]+.27,.51,.45,.89,dark,7);
      for(let k=-1;k<=1;k++)pipe(f,[foot[0]+k*.22,foot[1]-.07,foot[2]+.85],
        [foot[0]+k*.25,foot[1]-.13,foot[2]+1.10],.11,.025,'#c6ab83',4);
    }
    const tailSwing=Math.sin(t+.45);
    sweep(torso,[[0,5.7,-3.65,.71],[-.10,5.9,-4.74,1.08],[tailSwing*.41,6.2,-5.89,1.04],
      [tailSwing*.86,6.58,-7.12,.79],[tailSwing*1.31,7.28,-8.02,.45],[tailSwing*1.6,7.89,-8.53,.045]],
      7,[fur,fur,light,ruff,cream]);
    const neck=pitch(move(torso,0,6.56,2.3),-.11+gallop*.036);
    loft(neck,[[-1.16,1.43,1.23],[.04,2.05,1.67],[1.3,1.71,1.47,0,.13],[2.39,1.23,1.05,0,.36]],8,[ruff,light,fur]);
    for(const s of [-1,1]){
      for(const [xx,yy,zz,w] of [[1.21,.66,.90,.69],[1.51,.36,.18,.72],[1.54,.25,-.37,.70]]){
        sweep(neck,[[s*xx,yy+.22,zz,w*.70],[s*(xx+.16),yy,zz,w],[s*(xx+.30),yy-1.42,zz-.47,.025]],5,
          [light,zz>.5?cream:ruff]);
      }
    }
    sweep(neck,[[0,.16,1.41,.78],[-.08,-.48,1.62,.67],[-.22,-1.78,1.03,.025]],5,[ruff,cream]);
    const head=pitch(move(neck,0,1.53,1.31),attack?.13:-.03);
    const skull=pitch(head,Math.PI/2);
    loft(skull,[[-1.18,.68,.74],[-.72,1.42,1.22],[.08,1.64,1.45],[.80,1.38,1.16],
      [1.37,.86,.66],[2.47,.62,.47],[2.71,.47,.35]],8,[fur,light,fur,light,ruff,cream]);
    const mouth=move(head,0,-.13,1.84);
    bulb(mouth,0,-.34,0,.70,.28,1.00,'#4e3834',7);
    bulb(mouth,0,attack?-.63:-.54,.02,.64,.20,.94,cream,7);
    bulb(head,0,.17,2.55,.66,.39,.44,'#3e3837',7);
    for(const s of [-1,1]){
      const g=move(head,s*.97,.74,-.24);
      const a=[-s*.56,0,.59],b=[s*.62,.04,.34],c=[s*.51,1.76,-.16],d=[s*.01,.06,-.61];
      g([a,b,c],dark);g([a,c,d],fur);g([b,d,c],light);
      g([[-s*.29,.20,.55],[s*.42,.27,.36],[s*.43,1.38,-.05]],'#cf9a80');
      const e=yaw(move(head,s*1.10,.41,1.00),s*.45);
      eye(e,s,0,0,0,.38,.23,'#ffc475',dark);
      for(const [yy,zz,k] of [[-.23,.04,1],[-.54,-.35,.86],[-.77,-.56,.72]]){
        const base=[s*1.25,yy,zz];
        sweep(head,[[...base,.62*k],[s*(1.50+.13*k),yy-.10,zz-.29,.66*k],
          [s*(1.56+.34*k),yy-.54*k,zz-.98*k,.045]],5,k>.95?light:ruff);
      }
      teeth(head,s,.61,-.22,1.88,-.61,.17);
      fangsMark(torso,s);
    }
    function fangsMark(g,s){
      for(let k=0;k<3;k++){
        const zz=-.37-k*.47;
        g([[s*(1.61+k*.02),6.84,zz],[s*(1.71+k*.02),6.52,zz+.17],
          [s*(1.62+k*.065),5.83,zz-.13]],'#8f5238');
      }
    }
  }
  function pauldron(f,x,y,z,s,big){
    const g=move(f,x,y,z),c=big?commanderColors.lord:commanderColors.iron;
    for(let j=0;j<3;j++){
      const q=move(g,s*(.12+j*.16),.41-j*.41,.02*j),w=1.25-j*.08,d=1.13-j*.04;
      loft(q,[[-.27,w*.76,d*.79],[-.10,w,d],[.00,w*1.01,d*1.01],[.29,w*.96,d*.95],
        [.52,w*.71,d*.74],[.64,w*.28,d*.33]],10,[c.metal,c.trim,c.metal,big?'#66535b':'#647b82',c.metal]);
      for(const k of [-1,1])stud(q,k*w*.38,.12,d*.93,.073,c.trim);
    }
    const wing=move(g,s*.47,.39,.22);
    plate(wing,[[s*-.37,-.08],[s*.24,.10],[s*.74,.86],[s*1.36,1.15],
      [s*1.19,.52],[s*.66,-.02],[s*.15,-.27]],.36,.42,c.metal,c.trim,.17);
    stripe(wing,[s*.08,.02,.53],[s*1.11,.84,.42],.066,c.trim);
    if(big){
      sweep(g,[[s*.55,.67,-.29,.27],[s*.89,1.11,-.45,.23],[s*1.27,1.57,-.59,.025]],7,[bronze,gold]);
    }
  }
  const commanderColors={
    iron:{skin:'#ddb391',lip:'#ad786a',lipLight:'#cb9180',hair:'#26353d',strand:'#41535a',glint:'#6a7b76',iris:'#687e72',metal:'#435d68',trim:'#baab7a',collar:'#335a5c'},
    lord:{skin:'#d9a084',lip:'#a65d56',lipLight:'#c67f70',hair:'#453c46',strand:'#675560',glint:'#9f8990',iris:'#ad7044',metal:'#4d434d',trim:'#dbb16b',collar:'#713e43'}
  };
  function commanderFace(f,big,c){
    // Each section carries jaw width, front depth, and back depth. The cheek,
    // brow and eye socket share the same continuous surface as the forehead.
    const jawWidth=big?1.11:.94;
    const rows=[
      [-1.61,big?.30:.17,big?.91:.77,.25],[-1.51,big?.77:.57,big?1.16:1.02,.48],[-1.31,.99*jawWidth,big?1.22:1.10,.74],
      [-1.05,1.22*jawWidth,1.15,.99],[-.66,big?1.40:1.28,1.21,1.18],[-.26,1.44,1.30,1.30],
      [.02,1.46,1.31,1.35],[.27,1.43,1.25,1.40],[.51,1.45,1.30,1.44],
      [.74,1.46,1.35,1.44],[1.04,1.44,1.34,1.40],[1.35,1.37,1.27,1.35],
      [1.59,1.16,1.13,1.22],[1.77,.79,.83,.91],[1.83,.39,.43,.51]
    ];
    function at(y){
      let j=1;while(j<rows.length-1&&rows[j][0]<y)j++;
      const a=rows[j-1],b=rows[j],u=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
      return mix(a,b,u);
    }
    function relief(x,y){
      const a=Math.abs(x);
      return .095*Math.exp(-((a-.88)**2/.13+(y+.14)**2/.15))
        +.065*Math.exp(-((a-.69)**2/.21+(y-.64)**2/.045))
        -.073*Math.exp(-((a-.68)**2/.20+(y-.30)**2/.02));
    }
    function surface(x,y){
      const [,w,d]=at(y);return d*(Math.max(0,1-Math.pow(Math.min(1,Math.abs(x)/w),2.3))**(1/2.3))+relief(x,y);
    }
    const project=(x,y,extra=0)=>[x,y,surface(x,y)+extra];
    const segments=28,rings=rows.map(([y,w,d,back])=>{
      const row=[];
      for(let i=0;i<segments;i++){
        const a=i*TAU/segments,cs=Math.cos(a),sn=Math.sin(a),x=w*Math.sign(sn)*Math.pow(Math.abs(sn),2/2.3);
        const z=(cs>=0?d:back)*Math.sign(cs)*Math.pow(Math.abs(cs),2/2.3)+(cs>0?relief(x,y):0);
        row.push([x,y,z]);
      }return row;
    });
    for(let j=1;j<rings.length;j++)for(let i=0;i<segments;i++){
      const k=(i+1)%segments;f([rings[j-1][i],rings[j-1][k],rings[j][k],rings[j][i]],c.skin);
    }
    f(rings[0].slice().reverse(),c.skin);f(rings[rings.length-1],c.skin);
    // The first and last pairs of a strip meet at the corners of the eye or lip.
    function ribbon(points,col){
      for(let j=1;j<points.length;j++){
        const [a,b]=points[j-1],[d,e]=points[j];
        f([project(...a),project(...d),project(...e),project(...b)],col);
      }
    }
    for(const s of [-1,1]){
      const eyeY=big?.227:.252,tilt=big?.040:.102;
      const inner=big?.29:.27,width=big?.81:.84;
      function lid(u){
        const a=Math.sin(Math.PI*u),center=eyeY+u*tilt;
        return [center+a*(big?.076:.096),center-a*(big?.045:.052)-.002];
      }
      const curve=[];
      for(let j=0;j<=16;j++){
        const u=j/16,x=s*(inner+width*u),[upper,lower]=lid(u);
        curve.push([[x,upper,.041],[x,lower,.042]]);
      }
      const socketDepth=(x,y)=>{
        const u=Math.max(0,Math.min(1,(Math.abs(x)-inner)/width)),[top,bottom]=lid(u);
        const a=Math.max(0,Math.min(1,(y-bottom)/(top-bottom)));
        return surface(x,bottom)*(1-a)+surface(x,top)*a;
      };
      ribbon(curve,big?'#c9b29b':'#d9cbb2');
      // The iris fits the narrow eyelid opening and follows the gaze.
      for(const [r,col,offset] of [[big?.157:.148,c.iris,.067],[big?.105:.088,'#302c2d',.084]]){
        const ring=[],cx=s*(big?.665:.652),cy=eyeY+tilt*.49+.027;
        for(let k=0;k<16;k++){const a=k*TAU/16;
          const xx=cx+r*Math.cos(a),[hi,lo]=lid((Math.abs(xx)-inner)/width);
          const yy=Math.min(hi-.01,Math.max(lo+.009,cy+r*Math.sin(a)));
          ring.push([xx,yy,socketDepth(xx,yy)+offset]);}
        const center=[cx,cy,socketDepth(cx,cy)+offset+.009];
        for(let k=0;k<ring.length;k++)f([center,ring[k],ring[(k+1)%ring.length]],col);
      }
      const ex=s*.65-.036,ey=eyeY+tilt*.49+.049;
      stud(f,ex,ey,socketDepth(ex,ey)+.12,.022,'#e9d6b8');
      ribbon(curve.map(([a],j)=>{const w=.012+.028*Math.sin(Math.PI*j/16);return [[a[0],a[1]+w,.062],[a[0],a[1]-.009,.069]];}),big?'#53403c':'#4a423e');
      ribbon(curve.slice(1,-1).map(([,b],j)=>[[b[0],b[1],.050],[b[0],b[1]-.012-(j>5?.012:0),.049]]),'#a47668');
      const brow=[];
      for(let i=0;i<=22;i++){
        const u=i/22,h=(big?.170:.12)*Math.sin(u*Math.PI)**.63;
        const y=big?.45+.18*Math.sin(u*Math.PI*.89)+.065*u:
          .50+.21*u+.045*Math.sin(u*Math.PI);
        const x=s*((big?.23:.25)+u*(big?1.02:.97));
        brow.push([[x,y+.36*h+.003,.055],[x,y-.64*h,.054]]);
      }
      ribbon(brow,big?'#49383a':'#374044');
      const g=move(f,s*1.41,-.13,.01);
      bulb(g,0,0,0,.22,.46,.25,c.skin,10);
      sweep(g,[[s*.03,-.23,.18,.038],[s*.13,-.03,.21,.062],[s*.11,.24,.14,.065],
        [0,.32,.14,.035]],6,c.lip);
    }
    // A long bridge blends into the brow; nostrils sit beneath the alar folds.
    const bridge=[[.84,.21,.012],[.61,.205,.063],[.34,.208,.125],[.10,.220,.212],
      [-.095,.24,big?.373:.285],[-.235,.29,big?.475:.35],[-.31,.345,big?.49:.40],
      [-.375,.365,big?.46:.38],[-.425,.34,.26],[-.466,.278,.12],[-.51,.16,.035],[-.53,.11,.006]];
    let prior=null;
    for(const [y,w,p] of bridge){
      const row=[];
      for(let j=-8;j<=8;j++){
        const k=j/8,shape=Math.max(0,1-k*k)**(Math.abs(y+.37)<.15?2.0:1.5);
        const alar=.100*Math.exp(-((Math.abs(k)-.65)**2/.045+(y+.405)**2/.005))*(1-k*k);
        row.push(project(k*w,y,p*shape+alar+.002));
      }
      if(prior)for(let i=0;i<16;i++)f([prior[i],row[i],row[i+1],prior[i+1]],c.skin);
      prior=row;
    }
    for(const s of [-1,1]){
      const a=project(s*.156,-.444,.162),b=project(s*.202,-.437,.144),d=project(s*.251,-.428,.090);
      f([a,b,d,[b[0],b[1]-.020,b[2]+.001]],big?'#a27362':'#b38a75');
    }
    const mouth=[[-.55,-.793,-.805],[-.34,-.765,-.819],[-.15,-.743,-.812],[0,-.767,-.823],
      [.15,-.742,-.810],[.34,-.763,-.816],[.55,-.786,-.796]];
    ribbon(mouth.map(([x,y,b])=>[[x,y,.043],[x,b,.074]]),c.lip);
    ribbon(mouth.map(([x,,y])=>[[x,y+.005,.079],[x,y-(1-Math.abs(x)/.56)*.111,.059]]),c.lipLight);
    ribbon(mouth.map(([x,,y])=>[[x,y+.010,.083],[x,y-.007,.085]]),'#935e52');
    if(!big){
      // A pair of small lower canines preserves the general's orc lineage.
      for(const s of [-1,1]){
        const a=project(s*.48,-.86,.045);
        sweep(f,[[...a,.052],[s*.50,-.81,a[2]+.048,.049],[s*.51,-.744,a[2]+.04,.009]],6,bone);
      }
    }else{
      const a=project(1.06,-.13,.02),b=project(.93,-.46,.025);
      stripe(f,a,b,.035,'#e7ba9b');
    }
  }
  function commanderHair(f,big,t,c){
    const sides=24,layers=[];
    for(const v of [0,.22,.52,.76,1]){
      const row=[];
      for(let j=0;j<sides;j++){
        const a=j*TAU/sides,cs=Math.cos(a),sn=Math.sin(a);
        const edge=-.85+2.18*Math.pow(Math.max(0,(cs+1)*.5),1.58);
        const y=edge+(1.92-edge)*v,wide=1.52*(v<.51?1+.04*v:Math.sqrt(Math.max(.022,1-((v-.50)/.51)**2)));
        const d=(cs>0?1.39:1.53)*wide/1.50;
        row.push([wide*Math.sign(sn)*Math.abs(sn)**.858,y,d*Math.sign(cs)*Math.abs(cs)**.87-.035]);
      }layers.push(row);
    }
    for(let j=1;j<layers.length;j++)for(let i=0;i<sides;i++){
      const k=(i+1)%sides;f([layers[j-1][i],layers[j-1][k],layers[j][k],layers[j][i]],c.hair);
    }
    for(const s of [-1,1]){
      if(big){
        // The lord wears his hair swept away from the forehead, with silver at the temples.
        sweep(f,[[s*.47,1.62,1.20,.12,.09],[s*1.03,1.38,1.01,.22,.15],
          [s*1.39,.95,.63,.26,.15],[s*1.50,.46,.22,.20,.13],[s*1.49,.17,.09,.075,.07]],9,c.hair);
        for(let j=0;j<3;j++){
          sweep(f,[[s*(1.09+.05*j),1.22,1.0-.06*j,.025],[s*(1.39+.05*j),.89,.77-.10*j,.044],
            [s*(1.51+.028*j),.52,.43-.10*j,.032],[s*1.52,.24,.22-.09*j,.011]],7,
            j===0?'#a6948b':c.glint);
        }
        const swing=Math.sin(t+.56*s)*.15;
        sweep(f,[[s*1.19,.96,-.62,.31,.24],[s*1.48,.05,-.58,.37,.23],
          [s*1.46,-1.12,-.45,.28,.22],[s*(1.66+swing),-2.08,-.52,.17,.11],[s*(1.75+swing),-2.64,-.78,.025]],8,c.strand);
        sweep(f,[[s*1.53,.19,-.43,.035],[s*1.61,-.78,-.35,.047],[s*(1.68+swing),-1.88,-.44,.02]],5,c.glint);
      }else if(s<0){
        // A single sweeping fringe and an exposed opposite temple give the younger axeman an asymmetric silhouette.
        sweep(f,[[.66,1.73,1.01,.13,.12],[.17,1.55,1.37,.23,.15],[-.49,1.32,1.40,.28,.14],
          [-1.02,1.02,1.17,.25,.15],[-1.32,.58,.91,.18,.12],[-1.34,.19,.79,.09,.085],[-1.22,-.10,.81,.016]],9,c.hair);
        sweep(f,[[.36,1.63,1.33,.025],[-.22,1.48,1.49,.033],[-.79,1.22,1.37,.029],[-1.16,.91,1.13,.015]],6,c.strand);
      }else{
        sweep(f,[[.81,1.57,1.0,.16],[1.29,1.15,.73,.21],[1.48,.51,.49,.16],[1.42,.08,.52,.065],[1.32,-.15,.47,.015]],8,c.hair);
      }
    }
    const flow=Math.sin(t+.41)*(big?.13:.23);
    if(big){
      const knot=move(f,0,1.02,-1.39);
      bulb(knot,0,.02,-.07,.71,.57,.54,c.hair,12);
      loft(knot,[[.12,.68,.55],[.18,.69,.57],[.28,.62,.50]],12,[bronze,c.trim]);
      sweep(f,[[0,.92,-1.61,.49],[0,.05,-1.81,.62],[.10,-1.12,-1.87,.65],
        [flow,-2.03,-1.98,.51],[flow+.11,-3.01,-1.86,.39],[flow-.03,-3.56,-1.71,.09]],10,c.hair);
    }else{
      const bun=move(f,0,1.86,-.40);
      bulb(bun,0,.13,-.08,.64,.50,.66,c.hair,12);
      loft(bun,[[.08,.68,.68],[.18,.69,.69],[.30,.61,.59]],12,[bronze,c.trim]);
      sweep(f,[[0,1.96,-.91,.38],[.11,1.76,-1.44,.46],[.20,1.17,-1.92,.43],
        [flow+.20,.14,-2.16,.39],[flow+.15,-.98,-2.27,.27],[flow-.06,-1.71,-2.16,.10],[flow-.32,-2.02,-2.07,.021]],9,c.hair);
    }
    for(const s of [-1,1]){
      const tail=big?'#92565e':'#baaa7b';
      f([[s*.26,1.95,-1.00],[s*.43,1.94,-1.00],[s*(.43+flow),.73,-1.85],
        [s*(.56+flow),-.27,-2.04],[s*(.42+flow),-.14,-2.08],[s*.28,.79,-1.82]],tail);
    }
  }
  function crown(f,big,c){
    const ruby=big?'#b0493c':'#548481';
    // An open coronet leaves the hairline and both brows visible.
    loft(f,[[1.40,1.45,1.42,0,-.10],[1.47,1.50,1.47,0,-.10],[1.64,1.45,1.40,0,-.12]],
      16,[big?bronze:iron,c.trim]);
    for(const s of [-1,1]){
      const wing=yaw(move(f,s*1.13,1.36,-.03),s*.75);
      plate(wing,[[0,-.14],[s*.50,-.06],[s*1.03,.42],[s*.88,1.13],[s*.61,.54],[s*.11,.27]],
        .15,.20,c.metal,c.trim,.12);
      stripe(wing,[s*.12,.06,.25],[s*.76,.56,.22],.055,c.trim);
      if(big){
        sweep(f,[[s*1.25,1.53,-.38,.28],[s*1.72,1.69,-.55,.29],[s*2.02,2.14,-.66,.22],
          [s*2.03,2.68,-.65,.14],[s*1.84,3.10,-.46,.019]],8,[bronze,c.trim,'#d8b88b',bone]);
      }
    }
    const front=move(f,0,1.49,1.35);
    plate(front,[[-.45,.02],[-.22,.36],[0,big?.71:.55],[.21,.34],[.45,.02],[0,-.34]],.14,.18,c.trim,bronze,.18);
    stud(front,0,.04,.33,.17,ruby);
    const comb=move(f,0,big?1.89:2.06,big?-.63:-.29);
    for(const s of [-1,1]){
      const points=big?[[s*.05,-.05],[s*.61,.01],[s*.63,.29],[s*.42,.23],[s*.29,.52],[s*.12,.27]]:
        [[s*.07,-.04],[s*.51,.03],[s*.62,.47],[s*.42,.32],[s*.34,.82],[s*.16,.39]];
      plate(comb,points,
        .04,.23,c.trim,bronze,.08);
    }
    pipe(comb,[-.98,.06,-.04],[.98,.06,-.04],.052,.055,c.trim,7);
  }
  function cape(f,t){
    const breeze=Math.sin(t+.52);
    for(const s of [-1,1]){
      const a=[s*.13,11.29,-1.37],b=[s*2.52,11.11,-.73],c=[s*3.05,8.28,-2.15],
        d=[s*(3.50+.17*breeze),3.28,-3.12+breeze*.39],e=[s*2.72,3.67,-3.28],
        o=[s*.40,4.26,-3.54-breeze*.28],crease=[s*1.66,7.28,-3.00];
      f([a,b,crease],'#8b3f43');f([b,c,d,crease],'#a34c49');f([d,e,crease],'#c18150');
      f([e,o,crease],'#85363e');f([o,a,crease],'#763540');
      f([a,[s*.26,11.05,-1.45],[s*.58,4.34,-3.51-breeze*.28],o],'#bc8854');
    }
  }
  function greavesAndCoat(f,big){
    const c=big?commanderColors.lord:commanderColors.iron;
    loft(f,[[3.78,2.09,1.58],[4.46,2.16,1.59],[5.55,1.88,1.39],[6.28,1.62,1.30]],12,
      [big?'#653d41':'#294949',c.collar,c.metal]);
    for(const s of [-1,1]){
      const g=yaw(move(f,s*1.14,4.74,1.22),s*.40);
      plate(g,[[-.69,.77],[.67,.77],[.83,-.66],[.21,-2.04],[-.57,-1.60]],.10,.16,c.metal,c.trim,.16);
      for(const yy of [.4,-.03,-.44,-.85]){
        stripe(g,[-.41,yy,.26],[.42,yy-.08,.27],.045,c.trim);
        stud(g,-.38,yy+.12,.25,.054,c.trim);
      }
      stripe(g,[-.46,.53,.27],[-.32,-1.28,.20],.095,big?gold:brass);
    }
    loft(f,[[5.49,2.13,1.59],[5.66,2.14,1.60],[6.11,2.06,1.54]],8,[bronze,leather]);
    plate(f,[[-.54,6.05],[.54,6.05],[.62,5.69],[0,5.42],[-.61,5.69]],1.61,.19,gold,bronze,.16);
  }
  function breast(f,big){
    const c=big?commanderColors.lord:commanderColors.iron;
    loft(f,[[5.68,1.58,1.26],[6.47,1.73,1.37],[7.37,1.99,1.50],[8.84,2.49,1.61],
      [9.90,2.53,1.57],[10.67,1.91,1.25],[10.97,1.18,.96]],12,c.collar);
    loft(f,[[10.55,.98,.86],[11.05,.81,.72],[11.51,.77,.70],[11.89,.82,.71]],12,c.skin);
    for(const s of [-1,1]){
      const line=[[s*.20,10.17,1.40],[s*.81,10.73,1.17],[s*1.22,11.12,.65],[s*1.47,10.87,-.14]];
      for(let j=1;j<line.length;j++)pipe(f,line[j-1],line[j],.14,.13,c.trim,7);
      // Crossed robe collar underneath the articulated cuirass.
      stripe(f,[s*.20,10.16,1.40],[s*1.01,10.90,.96],.32,big?'#7f494a':'#7b9b95');
    }
    if(big){
      const col='#414953';
      for(const s of [-1,1]){
        const a=[[s*.11,9.97],[s*1.59,10.56],[s*2.25,10.15],[s*2.30,9.22],[s*.91,8.45],[s*.17,8.79]];
        plate(f,a,1.56,.42,col,bronze,.36);
        stripe(f,[s*.29,9.92,1.77],[s*1.66,10.30,1.82],.18,gold);
        stripe(f,[s*1.10,8.70,1.71],[s*2.01,9.24,1.76],.13,bronze);
      }
      for(let i=0;i<3;i++){
        const y=6.30+i*.70,w=1.33+i*.19;
        plate(f,[[-w,y+.62],[w,y+.62],[w*.88,y+.17],[0,y-.10],[-w*.88,y+.17]],1.40+i*.12,.22,col,slate,.25);
      }
      // The cracked bronze bell is an embossed emblem, complete with hanging clapper.
      const b=move(f,0,9.49,1.99);
      plate(b,[[-.22,.80],[.21,.80],[.33,.57],[.46,.45],[.50,.02],[.77,-.30],
        [.68,-.48],[-.68,-.48],[-.77,-.30],[-.50,.02],[-.46,.45],[-.29,.62]],.22,.18,gold,bronze,.20);
      pipe(b,[-.66,-.40,.39],[.66,-.40,.39],.078,.078,goldLight,5);
      bulb(b,0,-.57,.18,.19,.20,.16,bronze,5);
      stripe(b,[.21,.59,.43],[-.07,.19,.44],.11,'#674b3e');
      stripe(b,[-.07,.19,.44],[.13,.06,.44],.11,'#674b3e');
      stripe(b,[.13,.06,.44],[-.06,-.27,.43],.11,'#674b3e');
    }else{
      for(const s of [-1,1]){
        const q=yaw(move(f,s*1.07,9.20,1.28),s*.24);
        plate(q,[[-.98,.73],[-.24,1.06],[.79,.85],[1.06,.20],[.74,-.56],
          [-.17,-.92],[-.94,-.53]],.07,.26,c.metal,'#869b99',.42);
        for(let j=0;j<3;j++){
          const step=j*.22,yy=.58-j*.14;
          stripe(q,[s*(-.64+step),yy,.25],[s*(.08+step),yy-.40,.51],.047,c.trim);
        }
      }
      for(let j=0;j<4;j++){
        const y=6.10+j*.60,w=1.18+.14*j,d=1.39+.07*j;
        plate(f,[[-w,y+.62],[w,y+.62],[w*.86,y+.16],[0,y-.01],[-w*.86,y+.16]],d,.22,c.metal,'#728781',.19);
        for(const s of [-1,1])stud(f,s*w*.65,y+.39,d+.16,.076,brass);
      }
      const medal=move(f,-1.64,9.90,1.43);
      stud(medal,0,0,0,.36,c.trim);stud(medal,0,0,.14,.18,'#749d93');
    }
    greavesAndCoat(f,big);
  }
  function axe(f){
    pipe(f,[0,-2.50,.02],[0,4.04,0],.20,.24,leatherLight,7);
    for(const y of [-2.37,-.12,.36,2.76])pipe(f,[0,y,.02],[0,y+.16,.018],.26,.26,y>2?bronze:leather,7);
    const blade=[[.05,3.99],[.84,3.81],[1.74,4.40],[2.27,4.90],[2.52,3.92],[2.49,3.13],
      [2.10,2.35],[1.42,1.88],[1.57,2.57],[.67,2.72],[.07,2.84]];
    // Crescent head in separate overlapping convex wedges for reliable triangulation.
    plate(f,[blade[0],blade[1],blade[9],blade[10]],.22,.43,slate,iron,.21);
    plate(f,[blade[1],blade[2],blade[3],blade[4],blade[5],blade[6],blade[7],blade[8],blade[9]],.20,.43,silver,iron,.32);
    f([[2.27,4.90,.23],[2.52,3.92,.23],[2.49,3.13,.23],[2.10,2.35,.23],[1.42,1.88,.23],
      [1.99,2.65,.36],[2.25,3.35,.43],[2.30,4.06,.35]],metalLight);
    plate(f,[[-.03,3.98],[-1.04,4.02],[-1.61,3.50],[-.64,3.31],[-.02,2.97]],.20,.42,slate,iron,.18);
    stud(f,.27,3.32,.52,.25,gold);
  }
  function hammer(f){
    const obsidian='#44414c',amethyst='#6f586a';
    pipe(f,[0,-3.56,0],[0,4.04,0],.25,.31,'#78503e',8);
    for(let i=0;i<5;i++)pipe(f,[0,-2.94+i*.63,0],[0,-2.75+i*.63,0],.31,.32,i===0?gold:leather,7);
    bulb(f,0,-3.45,0,.49,.54,.48,bronze,7);
    const g=move(f,.17,4.27,0),ax=roll(g,-Math.PI/2);
    loft(ax,[[-2.25,.80,.94],[-1.98,1.12,1.01],[-1.60,1.10,1.00],[-1.34,.89,.81],
      [-.52,.92,.86],[-.40,1.06,1.01],[.43,1.10,1.03],[.61,.95,.87],[1.55,.98,.86],
      [1.79,1.25,1.12],[2.10,1.30,1.16],[2.47,1.14,1.03]],8,
      [gold,bronze,obsidian,amethyst,gold,'#b58e5d',bronze,obsidian,bronze,gold,obsidian]);
    for(const s of [-1,1]){
      const q=move(g,s*1.07,0,.82);
      stripe(q,[-.30,.25,.04],[0,-.18,.13],.11,gold);stripe(q,[0,-.18,.13],[.30,.22,.04],.11,gold);
    }
    stud(g,0,0,1.05,.56,'#ba5c43');stud(g,0,.07,1.28,.21,'#efad67');
    pipe(g,[0,.97,0],[0,1.70,0],.41,.025,gold,6);
  }
  function warrior(f,t,big,pose){
    const c=big?commanderColors.lord:commanderColors.iron;
    const g=scale(f,big?1.54:1.13),action=pose==='attack';
    const swing=Math.sin(t),bob=.10-.10*Math.cos(2*t);
    // Long cuisse and greave lengths give the two generals adult proportions.
    const legs=scale(g,.92,1.20,.93);
    for(const s of [-1,1])leg(legs,s,t,true,big);
    const body=yaw(roll(move(g,0,.94+bob,0),swing*.015),swing*(big?.052:.077));
    if(big)cape(body,t);breast(body,big);
    const hd=scale(yaw(move(body,0,12.58,.12),-swing*.060),big?1.06:.97,1.10,1.02);
    commanderFace(hd,big,c);commanderHair(hd,big,t,c);crown(hd,big,c);
    for(const s of [-1,1]){
      const sw=-s*swing,reach=action&&s>0?Math.max(0,.48+.52*Math.sin(t-.38)):0;
      const sh=[s*2.35,9.94,.13],el=[s*(2.83+.16*reach),8.15+.54*reach,.04+.70*sw+.40*reach],
        hand=[s*(2.86+.23*reach),6.77+.21*sw+2.05*reach,.69+1.17*sw+1.59*reach];
      const h=forearm(body,sh,el,hand,big?.82:.76,c.collar,c.metal);
      const wrist=mix(el,hand,.84);
      pipe(body,wrist,mix(el,hand,.94),big?.63:.57,big?.60:.53,c.trim,7);
      pauldron(body,sh[0],sh[1]+.21,sh[2],s,big);
      if(s>0){
        const weapon=roll(pitch(move(h,.28,.08,.33),action?.45+.99*reach:-.15+sw*.175),big?-.23:-.32);
        if(big)hammer(weapon);else axe(weapon);
      }else if(big){
        for(let i=0;i<3;i++)stud(h,-.28+i*.30,-.14,.65,.13,bronze);
      }
    }
  }
  function draw(m,type,phase=0,slow=false,pose='walk'){
    const f=(pts,c)=>m.face(pts,slow?cold(c):c);
    const t=(Number.isFinite(phase)?phase:0)*TAU;
    if(type==='runner'||type==='wolf')wolf(f,t,pose);
    else if(type==='brute'||type==='orc')warrior(f,t,false,pose);
    else if(type==='boss'||type==='lord')warrior(f,t,true,pose);
    else scout(scale(f,1.07),t,pose);
  }
  window.PineInvaders={draw};
})();
