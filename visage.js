/* A single continuous skin surface runs from the clavicles through the throat
   and jaw to the crown. The eyes, lips and hair follow that surface in 3D. */
(() => {
  "use strict";
  const pi=Math.PI, tau=2*pi, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t, blend=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
  const minus=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
  const gauss=(x,w)=>Math.exp(-.5*(x/w)**2);
  const skin={base:"#f1baaa",light:"#f8cabc",shadow:"#d39788"};
  const colors=new Map();
  function rgb(hex){
    if(!colors.has(hex))colors.set(hex,[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255));
    return colors.get(hex);
  }
  // Rings give the underside of the chin a forward projection over the neck.
  // The fifth column raises the back of the jaw towards the base of the ear.
  const rings=[
    [21.78,1.50,.91,-.93,0],[22.02,1.27,.81,-.92,0],[22.28,.98,.65,-.91,0],
    [22.63,.80,.56,-.86,0],[23.08,.71,.53,-.85,.02],[23.47,.66,.55,-.87,.07],
    [23.66,.63,.65,-.95,.22],[23.74,.61,.85,-1.03,.43],[23.81,.60,1.08,-1.09,.57],
    [23.96,.69,1.26,-1.14,.60],[24.21,.91,1.36,-1.23,.50],[24.55,1.20,1.43,-1.34,.27],
    [24.95,1.43,1.48,-1.45,.12],[25.31,1.58,1.49,-1.53,.04],
    [25.70,1.70,1.46,-1.59,0],[26.09,1.76,1.47,-1.62,0],[26.47,1.77,1.48,-1.65,0],
    [26.82,1.76,1.53,-1.67,0],[27.23,1.76,1.52,-1.65,0],[27.58,1.72,1.43,-1.61,0],
    [27.95,1.60,1.28,-1.52,0],[28.28,1.36,1.04,-1.35,0],[28.55,1.02,.74,-1.10,0],
    [28.75,.68,.41,-.85,0],[28.86,.35,.13,-.58,0],[28.90,.02,-.20,-.24,0]
  ];
  // Monotone cubic interpolation avoids bands of hard light between the rings,
  // including the close vertical spacing where the chin turns into its underside.
  const slopes=rings.map((row,j)=>row.map((_,k)=>{
    const l=rings[Math.max(0,j-1)],r=rings[Math.min(rings.length-1,j+1)];
    if(!j||j===rings.length-1)return (r[k]-l[k])/(r[0]-l[0]);
    const a=(row[k]-l[k])/(row[0]-l[0]),b=(r[k]-row[k])/(r[0]-row[0]);
    return a*b>0?2*a*b/(a+b):0;
  }));
  function section(y){
    let j=0;while(j<rings.length-2&&rings[j+1][0]<y)j++;
    const a=rings[j],b=rings[j+1],t=clamp((y-a[0])/(b[0]-a[0]));
    const span=b[0]-a[0],t2=t*t,t3=t2*t;
    return a.slice(1).map((v,k)=>(2*t3-3*t2+1)*v+(t3-2*t2+t)*span*slopes[j][k+1]+(-2*t3+3*t2)*b[k+1]+(t3-t2)*span*slopes[j+1][k+1]);
  }
  function features(x,y){
    const ax=Math.abs(x);
    const bridge=.28*gauss(x,.205)*gauss(y-26.00,.54);
    const nose=.42*gauss(x,.23)*gauss(y-25.56,.205)+.14*gauss(ax-.215,.12)*gauss(y-25.43,.109);
    const eye=-.205*gauss(ax-.75,.39)*gauss(y-26.30,.205);
    const arch=.095*gauss(ax-.76,.43)*gauss(y-26.75,.13);
    const cheek=.21*gauss(ax-.99,.37)*gauss(y-25.86,.29)-.06*gauss(ax-.99,.32)*gauss(y-25.03,.27);
    const muzzle=.094*gauss(x,.48)*gauss(y-24.97,.24)+.075*gauss(x,.38)*gauss(y-24.27,.14);
    const philtrum=.036*gauss(ax-.092,.046)*gauss(y-25.15,.13);
    return bridge+nose+eye+arch+cheek+muzzle+philtrum;
  }
  function headAt(y,angle){
    const [w,f,b,lift]=section(y),c=Math.cos(angle),x=w*Math.sin(angle),mid=(f+b)*.5;
    const z=mid+(f-mid)*Math.sign(c)*Math.abs(c)**(c>0?.78:1);
    const yy=y+lift*(1-c)*.5;
    return [x,yy,z+(c>0?clamp(c*2.4)*features(x,yy):0)];
  }
  function depth(x,y){
    let base=y;
    for(let i=0;i<2;i++){
      const r=section(base),s=clamp(x/r[0],-.999,.999);
      base=y-r[3]*(1-Math.sqrt(1-s*s))*.5;
    }
    return headAt(base,Math.asin(clamp(x/section(base)[0],-.999,.999)))[2];
  }
  function skinTint(u,v,[x,y,z]){
    const front=clamp(z+.1),ax=Math.abs(x);
    const blush=front*(.26*gauss(ax-1.07,.45)*gauss(y-25.84,.25)+.15*gauss(x,.29)*gauss(y-25.55,.13));
    const shadow=front*.41*gauss(ax-.91,.43)*gauss(y-26.49,.13);
    return blend(blend(rgb(skin.base),rgb("#ec777d"),blush),rgb("#a95869"),shadow);
  }
  // Interpolated colour and surface normals keep the same light across seams.
  function patch(mesh,at,us,vs,material,reverse=false){
    const prev=[];
    for(let j=0;j<=vs;j++){const row=[];
      for(let i=0;i<=us;i++){
        const u=i/us,v=j/vs,e=.00012,p=at(u,v);
        const du=minus(at(Math.min(1,u+e),v),at(Math.max(0,u-e),v));
        const dv=minus(at(u,Math.min(1,v+e)),at(u,Math.max(0,v-e)));
        const n=unit(cross(du,dv)),s=reverse?-1:1;
        const key=s*(-.40*n[0]+.68*n[1]+.60*n[2]),rim=Math.max(0,s*(-.85*n[2]+.50*n[0]));
        const lit=.72+.37*Math.max(-.48,key)+.12*rim;
        const tint=typeof material==="string"?rgb(material):material(u,v,p);
        row.push([p,tint.map(k=>clamp(k*lit))]);
        if(i&&j){
          const quad=[prev[i-1],prev[i],row[i],row[i-1]];
          for(const index of [0,1,2,0,2,3])mesh.push(...quad[index][0],...quad[index][1]);
        }
      }
      prev.splice(0,prev.length,...row);
    }
  }
  // Cubic guides let each lock, eyelid and hair ornament taper independently.
  function spline(nodes,t){
    const f=clamp(t)*(nodes.length-1),i=Math.min(nodes.length-2,Math.floor(f)),k=f-i;
    const a=nodes[Math.max(0,i-1)],b=nodes[i],c=nodes[i+1],d=nodes[Math.min(i+2,nodes.length-1)];
    return b.map((v,n)=>.5*(2*v+(-a[n]+c[n])*k+(2*a[n]-5*v+4*c[n]-d[n])*k*k+(-a[n]+3*v-3*c[n]+d[n])*k*k*k));
  }
  function strand(mesh,nodes,material,steps=16,sides=8){
    // Carry the local outward direction along the guide, even at a vertical tip.
    const frames=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,p=spline(nodes,t),dir=unit(minus(spline(nodes,Math.min(1,t+.001)).slice(0,3),spline(nodes,Math.max(0,t-.001)).slice(0,3)));
      let side=cross(Math.abs(dir[2])>.985?[0,1,0]:[0,0,1],dir);
      side=unit(side);
      if(i&&side.reduce((v,n,k)=>v+n*frames[i-1].side[k],0)<0)side=side.map(x=>-x);
      frames.push({p,side,normal:unit(cross(dir,side))});
    }
    const at=(u,v)=>{
      const f=v*steps,i=Math.min(steps-1,Math.floor(f)),k=f-i,a=frames[i],b=frames[i+1];
      const radius=(frame,n)=>frame.p[n]+Math.cos(u*tau)*frame.p[3]*frame.side[n]+Math.sin(u*tau)*frame.p[4]*frame.normal[n];
      return [0,1,2].map(n=>mix(radius(a,n),radius(b,n),k));
    };
    patch(mesh,at,sides,steps,material);
  }
  function ellipsoid(mesh,c,r,material){
    patch(mesh,(u,v)=>{const a=u*tau,b=(v-.5)*pi;return [c[0]+r[0]*Math.cos(b)*Math.sin(a),c[1]+r[1]*Math.sin(b),c[2]+r[2]*Math.cos(b)*Math.cos(a)]},16,10,material);
  }
  function eyes(mesh,s){
    const eyeX=t=>s*(.265+1.065*t),eyeY=t=>26.24+.145*t;
    const swell=t=>Math.max(0,Math.sin(pi*t))**.8;
    const lower=t=>eyeY(t)-.127*swell(t),upper=t=>eyeY(t)+.165*swell(t)*(1.12-.24*t);
    function lens(x,y){
      const t=clamp((s*x-.265)/1.065),v=clamp((y-lower(t))/Math.max(.0001,upper(t)-lower(t)));
      return depth(x,y)+.034+.132*swell(t)*Math.sin(pi*v);
    }
    const curve=(u,v)=>{const x=eyeX(u),y=mix(lower(u),upper(u),v);return [x,y,lens(x,y)]};
    patch(mesh,curve,28,8,(u,v)=>blend(rgb("#f7e5d5"),rgb("#c1a2a0"),.26*Math.abs(2*u-1)+.17*v),s<0);
    // The iris follows the cornea and disappears behind the curved lids.
    const cx=s*.755,cy=26.306;
    function iris(radius,material,z){
      patch(mesh,(u,v)=>{
        const x=cx+(2*u-1)*radius,t=clamp((s*x-.265)/1.065),h=radius*Math.sqrt(Math.max(0,1-(2*u-1)**2));
        const y=mix(Math.max(lower(t)+.003,cy-h),Math.min(upper(t)-.004,cy+h),v);
        return [x,y,lens(x,y)+z];
      },22,8,material);
    }
    iris(.216,"#49303a",.010);
    iris(.179,(u,v)=>blend(rgb("#ce9457"),rgb("#583b3e"),v),.016);
    iris(.098,"#352431",.021);
    const glint=(dx,dy,r,color)=>{const x=cx+dx,y=cy+dy;ellipsoid(mesh,[x,y,lens(x,y)+.026],[r,r*.88,.020],color)};
    glint(-.057,.080,.039,"#fff5e1");glint(.077,-.06,.017,"#f5c781");
    function lid(line,height,material,offset){
      patch(mesh,(u,v)=>{const x=eyeX(u),base=line(u),y=base+height(u)*v;return [x,y,depth(x,y)+offset+.027*Math.sin(pi*v)*swell(u)]},26,3,material,s*height(.5)<0);
    }
    lid(upper,t=>.10*swell(t),"#d99289",.043);
    lid(lower,t=>-.054*swell(t),"#dc9d94",.038);
    lid(upper,t=>(.044+.057*t)*swell(t)+.005,"#40242f",.068);
    lid(lower,t=>-.021*(.26+t)*swell(t),"#80504e",.055);
    const wing=[0,.35,.7,1].map(t=>{const x=s*(1.23+.22*t),y=26.395+.127*t;return [x,y,depth(x,y)+.053,.050*(1-t)+.005,.016]});
    strand(mesh,wing,"#482a34",7);
    for(const t of [.76,.86,.95]){
      const lash=[0,.48,1].map(f=>{
        const x=eyeX(t)+s*.082*f,y=upper(t)+.044+.080*f;
        return [x,y,depth(x,y)+.068+.034*f,.014*(1-f)+.002,.009*(1-f)+.002];
      });
      strand(mesh,lash,"#49303c",5,5);
    }
    const brow=[0,.23,.50,.72,1].map(t=>{const x=s*(.29+1.10*t),y=26.72+.125*Math.sin(t*pi*.86)+.081*t;return [x,y,depth(x,y)+.034,.021+.046*Math.sin(pi*(t*.89+.06))*(1-.46*t),.022]});
    brow.at(-1)[3]=.006;strand(mesh,brow,"#593841",17);
  }
  function mouth(mesh){
    const seam=t=>24.94+.061*t*t+.013*Math.cos(t*pi);
    for(const upper of [true,false]){
      patch(mesh,(u,v)=>{const t=2*u-1,x=.542*t;
        const width=Math.max(0,1-t*t),height=upper?(.081+.066*gauss(Math.abs(t)-.36,.24))*width:-.143*width;
        const y=seam(t)+height*v,z=depth(x,y)+.018+.102*width*Math.sin(pi*(.20+.80*v));
        return [x,y,z];
      },28,6,(u,v)=>upper?blend(rgb("#933f55"),rgb("#c35c6b"),v):blend(rgb("#b34e61"),rgb("#e99191"),Math.sin(pi*v)),!upper);
    }
    const edge=[-1,-.7,-.3,0,.3,.7,1].map(t=>{const x=.542*t,y=seam(t);return [x,y,depth(x,y)+.027+.064*(1-t*t),.004+.011*(1-t*t),.011]});
    strand(mesh,edge,"#873c50",18,6);
    for(const s of [-1,1]){
      const nodes=[0,.4,.72,1].map(t=>{const x=s*(.118+.148*t),y=25.392+.019*Math.sin(pi*t);return [x,y,depth(x,y)+.008,.003+.012*Math.sin(pi*t),.006]});
      strand(mesh,nodes,"#bd837e",8,6);
    }
  }
  function coiffure(mesh,accent){
    const ink="#302634",silk="#4b3948",gloss="#6d5260",gold="#e5be77",goldLight="#f5d99d";
    const edge=a=>25.12+2.62*Math.max(0,Math.cos(a))**.66+.16*Math.sin(a*2+.4);
    function cap(u,v){
      const a=u*tau-pi,ang=a+.27*Math.sin(pi*v),y=mix(edge(a),29.02,v);
      const p=headAt(Math.min(28.897,y-.115),ang),rad=(.14+.16*Math.sin(pi*v))*Math.min(1,(1-v)*14);
      return [p[0]+rad*Math.sin(ang),y,p[2]+rad*Math.cos(ang)-.05];
    }
    patch(mesh,cap,56,18,(u,v)=>blend(rgb(ink),rgb(silk),.19+.22*Math.sin(12*pi*u+1.5*v)**4));
    // Swept sections lie along the skull; the off-centre part opens above one brow.
    const frontSections=[
      [[.61,28.77,.72,.06,.05],[.53,28.46,1.26,.34,.14],[.07,28.09,1.62,.37,.145],[-.48,27.78,1.69,.33,.13],[-1.02,27.56,1.56,.25,.115],[-1.45,27.28,1.20,.13,.08],[-1.55,26.83,.95,.015,.015]],
      [[.35,28.86,.48,.08,.05],[-.14,28.62,1.05,.29,.14],[-.73,28.31,1.37,.32,.15],[-1.24,27.94,1.34,.31,.12],[-1.57,27.54,1.11,.15,.10],[-1.65,27.10,.77,.008,.01]],
      [[.62,28.75,.80,.035,.03],[.84,28.30,1.25,.24,.12],[1.20,27.96,1.33,.30,.12],[1.53,27.66,1.15,.24,.12],[1.67,27.25,.91,.13,.09],[1.64,26.88,.83,.016,.02]]
    ];
    const lock=(nodes,i,steps=25)=>strand(mesh,nodes,(u,v)=>{
      const light=Math.max(0,Math.cos((u-.29+.035*Math.sin(tau*v))*tau));
      const comb=.5+.5*Math.cos((u*10+v*.55)*tau);
      return blend(rgb(i%2?silk:ink),rgb(gloss),(.45*light**5+.14*comb**5)*Math.sin(pi*(.09+.84*v)));
    },steps,18);
    frontSections.forEach((n,i)=>lock(n,i));
    lock([[.25,28.26,1.58,.018,.021],[-.15,27.92,1.71,.075,.046],[-.67,27.55,1.65,.067,.040],[-1.11,27.32,1.45,.041,.029],[-1.27,27.04,1.23,.007,.008]],1,20);
    for(const s of [-1,1]){
      const n=[[s*1.35,27.81,1.12,.17,.1],[s*1.63,27.33,.93,.22,.11],[s*1.69,26.64,.74,.165,.105],[s*1.60,25.97,.86,.13,.085],[s*1.61,25.41,.86,.083,.065],[s*1.77,24.82,.59,.012,.014]];
      lock(n,0,22);
    }
    // A high folded ponytail with several overlapping S-shaped locks.
    ellipsoid(mesh,[-.04,28.80,-1.13],[.80,.68,.74],silk);
    for(let i=0;i<4;i++){
      const k=i-1.5;
      lock([[.04+k*.14,29.02,-1.27,.19,.16],[.32+k*.18,28.88,-1.95,.37,.32],[.70+k*.25,27.83,-2.42,.40,.33],[1.01+k*.27,26.12,-2.59,.38,.29],[1.34+k*.28,24.28,-2.70,.33,.23],[1.89+k*.24,22.57,-2.87,.28,.18],[2.42+k*.17,21.17+.17*i,-3.12,.19,.14],[2.56+.15*i,20.35+.22*i,-3.55,.012,.014]],i,31);
    }
    // Gilt three-leaf comb with a turquoise cabochon at the temple.
    for(const s of [-1,1]){
      strand(mesh,[[s*.53,28.88,-1.40,.10,.08],[s*.72,28.96,-.95,.12,.085],[s*.62,29.13,-.52,.093,.060],[s*.31,29.33,-.49,.016,.025]],gold,12);
    }
    for(let i=0;i<3;i++){
      const x=1.40+i*.11,y=27.62+i*.07;
      strand(mesh,[[x,y,.80,.032,.027],[x+.25,y+.19,.67,.110,.046],[x+.47-i*.035,y+.53+i*.13,.41-i*.14,.13,.055],[x+.46-i*.11,y+.85+i*.17,.18-i*.21,.012,.018]],i===1?goldLight:gold,14);
    }
    ellipsoid(mesh,[1.60,27.82,.81],[.17,.19,.10],accent);
    // Petals face forward while their pin sweeps up and back in side view.
    for(let j=0;j<5;j++){
      const a=j*tau/5+.29,dx=Math.cos(a),dy=Math.sin(a);
      const petal=[[0,.024],[.14,.095],[.29,.084],[.40,.015]].map(([d,r])=>[1.49+d*dx,27.86+d*dy,1.13-.39*d*dx+.16*d,r,r*.49]);
      strand(mesh,petal,j%2?gold:"#f2d28e",10,8);
    }
    ellipsoid(mesh,[1.5,27.86,1.20],[.101,.100,.064],accent);
    for(const s of [-1,1]){
      // Ears share the face material and project from under the temple locks.
      ellipsoid(mesh,[s*1.68,25.90,-.01],[.255,.50,.275],skin.base);
      ellipsoid(mesh,[s*1.879,25.93,.045],[.061,.289,.143],"#d99388");
      ellipsoid(mesh,[s*1.748,25.52,.12],[.09,.10,.085],goldLight);
      const chain=[[s*1.75,25.52,.12,.028,.03],[s*1.82,25.28,.12,.025,.027],[s*1.83,25.03,.13,.024,.024]];
      strand(mesh,chain,gold,6,6);
      strand(mesh,[[s*1.83,25.04,.13,.035,.034],[s*1.83,24.86,.13,.101,.081],[s*1.82,24.67,.13,.046,.041],[s*1.81,24.59,.13,.012,.014]],accent,9);
    }
  }
  function forehead(mesh){
    // A small three-petal huadian curves with the forehead under the hairline.
    for(const [s,dx,dy] of [[0,0,.25],[-1,-.135,.13],[1,.135,.13]]){
      const nodes=[[0,.007],[.32,.039],[.65,.032],[1,.004]].map(([t,r])=>{
        const x=dx*t,y=26.93+dy*t+.03*Math.abs(s);
        return [x,y,depth(x,y)+.012,r,r*.28];
      });
      strand(mesh,nodes,"#b2525b",9,6);
    }
  }
  const cache=new Map();
  function draw(mesh,b,aim,wave,p,yaw=0){
    const accent=p.jewel||p.gem||"#76cbb8";
    if(!cache.has(accent)){
      const verts=[];
      patch(verts,(u,v)=>headAt(mix(21.78,28.90,v),u*tau-pi),64,90,skinTint);
      eyes(verts,-1);eyes(verts,1);mouth(verts);forehead(verts);coiffure(verts,accent);
      cache.set(accent,new Float32Array(verts));
    }
    const v=cache.get(accent),sn=Math.sin(yaw),cs=Math.cos(yaw);
    for(let i=0;i<v.length;i+=6){
      const sourceY=v[i+1],w=clamp((sourceY-22.55)/1.22);
      const x=v[i]*(1-.102*w),y=sourceY+w*(24.42-sourceY)*.182,z=v[i+2]*(1-.115*w);
      mesh.vertices.push(x+w*(x*(cs-1)+sn*z),y+b,z+w*(z*(cs-1)-sn*x),v[i+3],v[i+4],v[i+5]);
    }
  }
  window.PineVisage={draw,skin};
})();
