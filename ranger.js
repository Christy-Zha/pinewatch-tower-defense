/* A-Yao, the keeper of Pinewatch. Geometry faces +Z, planted feet at Y=0. */
(() => {
  "use strict";
  const palettes={
    pine:{cape:"#56a694",shade:"#315f5b",lining:"#96c7af",tunic:"#75b1a2",ivory:"#f4e8cf",seam:"#dcb575",sash:"#ab4842",sashLight:"#c96858",jewel:"#a8dfc4"},
    dawn:{cape:"#b7535c",shade:"#793b52",lining:"#dd8e87",tunic:"#c97574",ivory:"#f4e2d1",seam:"#e5bd80",sash:"#6e3b50",sashLight:"#975564",jewel:"#ecc597"},
    night:{cape:"#8471ae",shade:"#554c79",lining:"#b4a8cf",tunic:"#9987b7",ivory:"#e9e4ed",seam:"#d5bc96",sash:"#984966",sashLight:"#b9627b",jewel:"#c1bcea"}
  };
  const leather="#694638", welt="#a77b52", leatherDeep="#483836", gold="#d5a45e", goldLight="#f2ce83";
  const tau=Math.PI*2, Y=[0,1,0], Z=[0,0,1];
  const add=(a,b)=>a.map((n,i)=>n+b[i]);
  const sub=(a,b)=>a.map((n,i)=>n-b[i]);
  const mul=(a,k)=>a.map(n=>n*k);
  const mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
  function link(m,a,b,color) {
    for(let i=0;i<a.length;i++){const j=(i+1)%a.length;m.face([a[i],a[j],b[j],b[i]],color)}
  }
  // Build elliptical horizontal sections. Nonuniform sections sculpt the actual anatomy.
  function loft(m,rows,color,sides=10) {
    let prev=null;
    for(const [x,y,z,rx,rz] of rows){
      const ring=[];
      for(let i=0;i<sides;i++){const ang=tau*i/sides;ring.push([x+Math.sin(ang)*rx,y,z+Math.cos(ang)*rz])}
      if(prev)link(m,prev,ring,color);
      prev=ring;
    }
    // Section ends are tucked into another garment or limb.
  }
  // Circular/elliptical sections orthogonal to a spline, including tapered ends.
  function sweep(m,rows,color,sides=7) {
    let prev=null,previousU=null;
    for(let i=0;i<rows.length;i++){
      const [x,y,z,r,w=r]=rows[i],pos=[x,y,z];
      const axis=unit(sub(rows[Math.min(i+1,rows.length-1)].slice(0,3),rows[Math.max(0,i-1)].slice(0,3)));
      const dot=previousU?previousU.reduce((n,c,k)=>n+c*axis[k],0):0;
      const carried=previousU?sub(previousU,mul(axis,dot)):null;
      const u=carried&&Math.hypot(...carried)>.1?unit(carried):unit(cross(Math.abs(axis[1])>.90?Z:Y,axis));
      const v=cross(u,axis),next=[];
      for(let j=0;j<sides;j++){const a=tau*j/sides;next.push(add(pos,add(mul(u,r*Math.cos(a)),mul(v,w*Math.sin(a)))))}
      if(prev)link(m,prev,next,typeof color==="function"?color(i):color);
      prev=next;previousU=u;
    }
  }
  function band(m,a,b,ar,br,c,n=8){sweep(m,[[...a,ar],[...b,br]],c,n)}
  function strip(m,steps,color){
    for(let i=1;i<steps.length;i++)m.face([steps[i-1][0],steps[i-1][1],steps[i][1],steps[i][0]],color);
  }
  function gem(m,x,y,z,s,col){
    const p=[x,y,z+.12*s],ring=[[x,y+.48*s,z],[x+.38*s,y,z],[x,y-.48*s,z],[x-.38*s,y,z]];
    for(let i=0;i<4;i++)m.face([ring[i],ring[(i+1)%4],p],i%2?col:goldLight);
  }
  // Parametric garment surfaces let seams, embroidery and buckles follow the leather
  // even through the convex bust, back and obliques.
  function surface(m,point,rings,sides,color) {
    let prev=null;
    for(let r=0;r<rings;r++){
      const t=r/(rings-1),next=[];
      for(let i=0;i<sides;i++)next.push(point(t,i*tau/sides));
      if(prev)for(let i=0;i<sides;i++){
        const j=(i+1)%sides;
        m.face([prev[i],prev[j],next[j],next[i]],typeof color==="string"?color:color(t,i,sides));
      }
      prev=next;
    }
  }
  function stitchLine(m,points,color,width=.042) {
    for(let i=1;i<points.length;i++){
      const a=mix(points[i-1],points[i],.07),b=mix(points[i-1],points[i],.66);
      const along=unit(sub(b,a)),w=mul(unit(cross(along,Math.abs(along[2])>.92?Y:Z)),width);
      m.face([add(a,w),sub(a,w),sub(b,w),add(b,w)],color);
    }
  }
  function brooch(m,pos,r,p) {
    const [x,y,z]=pos,ring=[];
    for(let i=0;i<16;i++){const a=i*tau/16,rad=r*(i%2?.78:1);ring.push([x+Math.sin(a)*rad,y+Math.cos(a)*rad,z])}
    for(let i=0;i<16;i++)m.face([ring[i],ring[(i+1)%16],[x,y,z+.16]],i%3?gold:goldLight);
    gem(m,x,y,z+.17,r*.95,p.jewel);
  }
  function boot(m,s,x,z) {
    const rot=s*.16, cs=Math.cos(rot),sn=Math.sin(rot);
    const g={face(points,color){m.face(points.map(([a,b,c])=>[x+a*cs+c*sn,b,z+c*cs-a*sn]),color)}};
    // Rounded toe, instep, shaped heel, narrow ankle and the fitted calf.
    loft(g,[[0,.06,-.49,.53,.56],[0,.42,-.49,.54,.57]],leatherDeep,10);
    loft(g,[[0,.08,.77,.57,.9],[0,.24,.46,.67,1.22],[0,.39,.45,.68,1.22]],"#493b32",12);
    loft(g,[[0,.38,.44,.654,1.21],[0,.66,.45,.656,1.16],[0,.81,.4,.64,1.10],[0,1.02,.21,.59,.93],[0,1.38,-.08,.49,.64],[0,1.77,-.13,.483,.53],[s*.03,2.06,-.13,.50,.54],[s*.045,2.34,-.13,.52,.56],[s*.10,3.35,-.16,.58,.64],[s*.12,4.35,-.17,.69,.72],[s*.1,5.28,-.10,.735,.67],[s*.06,6.18,0,.7,.65],[0,6.83,.06,.66,.61]],"#624a3b",12);
    const legAt=(y)=>[s*.10*Math.sin((y-2)/4*Math.PI),y,-.12];
    for(const [height,rx,rz,depth] of [[1.65,.538,.57,.14],[4.76,.75,.75,.14],[6.34,.74,.67,.28]]){
      const [cx,,cz]=legAt(height);
      loft(g,[[cx,height,cz,rx,rz],[cx,height+depth,cz,rx+.015,rz+.015]],"#4f3d33",12);
    }
    // Pointed overlapping knee welt and a tooled shin patch.
    const knee=[];
    for(let i=0;i<=10;i++){
      const a=-1.47+2.94*i/10,front=Math.cos(a);
      knee.push([[.74*Math.sin(a),6.81+.19*front,.01+.665*front],[.705*Math.sin(a),6.04-.47*front,.035+.655*front]]);
    }
    strip(g,knee,"#805c42");
    const shin=[];
    for(let i=0;i<9;i++) {
      const t=i/8,ang=s*(.72-.28*t);
      shin.push([Math.sin(ang)*(.53+.20*t),2.03+t*3.83,Math.cos(ang)*(.58+.10*t)-.095]);
    }
    stitchLine(g,shin,"#aa8461",.025);
    // Diagonal throat seam separates toe-cap from vamp.
    sweep(g,[[-.5,.66,1.05,.025],[-.32,.79,.98,.034],[.02,.84,.94,.032],[.37,.79,.94,.025],[.53,.7,.95,.018]],"#ac825e",4);
  }
  function lower(m,p,wave) {
    for(const s of [-1,1]){
      const x=s===1?1.65:-1.96,z=s===1?.84:-.78,k=s===1?1.44:-1.69;
      loft(m,[
        [x,5.5,z,.61,.59],[x,6.53,z+.04,.65,.65],[k,7.13,z+.13,.70,.67],
        [k,7.68,z+.24,.73,.70],[k,8.04,z+.2,.74,.76],[k,8.55,z+.13,.74,.79],
        [s*1.41,9.7,z*.92,.87,.92],[s*1.31,11.0,z*.72,1.01,1.03],
        [s*1.2,12.42,z*.46,1.15,1.17],[s*1.09,13.56,z*.28,1.16,1.20],[s*.87,14.64,.01,.92,.98]
      ],"#585750",12);
      boot(m,s,x,z);
    }
    // The under-robe skims the hips and opens at the thigh. Long outer panels
    // spring from the same high waist, with enough space inside to draw and step.
    const panel=(a0,a1,minY,rx,rz,offset,col,outer)=>{
      const segments=10,tiers=8,grid=[];
      for(let j=0;j<=tiers;j++){
        const t=j/tiers,row=[];
        for(let i=0;i<=segments;i++){
          const u=i/segments;
          const a=a0+(a1-a0)*u+.08*t*Math.sin(2.8*u+offset);
          const fold=(.06+.09*t)*Math.sin(3*Math.PI*u+.5)*Math.sin(t*Math.PI/2);
          const y=14.63*(1-t)+(minY+.79*Math.cos(tau*u+.7)+.40*u)*t;
          const side=Math.sin(a),front=Math.cos(a),wind=.16*Math.sin(wave+.52*offset+t*.8)*t*t;
          const fx=1.95+(rx-1.95)*Math.sin(t*Math.PI*.47)+fold;
          const fz=1.30+(rz-1.30)*Math.sin(t*Math.PI*.47)+fold;
          row.push([side*fx+wind,y,-.09+front*fz-.22*t*t]);
        }
        grid.push(row);
      }
      for(let j=0;j<tiers;j++)for(let i=0;i<segments;i++){
        const a=grid[j][i],b=grid[j][i+1],c=grid[j+1][i+1],d=grid[j+1][i];
        m.face([d,c,b,a],col);
      }
      const beyond=v=>[v[0]*1.006,v[1],(v[2]+.09)*1.011-.09];
      for(let i=0;i<segments;i++){
        const d=grid[tiers][i],c=grid[tiers][i+1];
        const a=mix(d,grid[tiers-1][i],outer?.25:.14),b=mix(c,grid[tiers-1][i+1],outer?.25:.14);
        m.face([d,c,b,a].map(beyond),outer?p.lining:p.seam);
      }
      if(outer){
        const edge=grid.map(row=>beyond(row[0]));sweep(m,edge.map(v=>[...v,.041]),p.seam,5);
        // A curling cloud-and-leaf brocade grows from the bottom hem.
        const at=(t,u)=>{
          const j=Math.min(tiers-1,Math.floor(t*tiers)),i=Math.min(segments-1,Math.floor(u*segments));
          const q=mix(mix(grid[j][i],grid[j][i+1],u*segments-i),mix(grid[j+1][i],grid[j+1][i+1],u*segments-i),t*tiers-j);
          return [q[0]*1.014,q[1],(q[2]+.09)*1.019-.09];
        };
        const vine=[[.975,.20],[.91,.24],[.88,.33],[.85,.48],[.81,.55],[.78,.52],[.79,.45]];
        sweep(m,vine.map(([t,u])=>[...at(t,u),.031]),p.seam,5);
        for(const [t,u] of [[.92,.24],[.87,.36],[.85,.46]]){
          m.face([at(t,u),at(t-.043,u-.087),at(t-.078,u-.091),at(t-.046,u-.025)],p.seam);
        }
      }
    };
    panel(-3.2,-1.04,10.0,2.64,1.89,0,p.tunic,false);
    panel(1.04,3.21,10.0,2.67,1.92,1,p.tunic,false);
    panel(-1.14,1.14,10.4,2.56,1.87,4,p.ivory,false);
    panel(-2.73,-.34,6.68,3.24,2.22,3,p.cape,true);
    panel(.43,2.82,7.11,3.21,2.26,1,p.cape,true);
    panel(2.69,3.70,8.06,3.00,2.4,5,p.shade,false);
  }
  function stole(m,p,b,wave) {
    // Two silk scarf ends drape from the crossed collar behind the shoulder blades.
    for(const s of [-1,1]){
      const strips=[];
      for(let i=0;i<=12;i++){
        const t=i/12,flutter=Math.sin(wave+t*3+s*.5)*.19*t;
        const x=s*(1.35+1.50*Math.sin(t*2.4)) + flutter;
        const y=22.12+b-t*(s>0?7.7:8.95);
        const z=-.48-1.55*Math.sin(t*2.2)-.45*t;
        const w=.47+.57*Math.sin(t*2.5)-.35*t*t,shear=.34*Math.sin(t*2.65+s);
        strips.push([[x-w,y+.14*t,z+shear],[x+.12*s,y,z-.18],[x+w,y-.32*t,z-shear]]);
      }
      for(let j=1;j<strips.length;j++)for(let i=0;i<2;i++){
        m.face([strips[j-1][i],strips[j][i],strips[j][i+1],strips[j-1][i+1]],i===0?p.lining:p.cape);
      }
      sweep(m,strips.map(row=>[...row[2],.036]),p.seam,5);
    }
  }
  const bodyRows=[
    [13.53,-.20,2.15,1.25],[14.02,-.19,2.19,1.35],[14.70,-.16,2.12,1.32],
    [15.30,-.11,1.97,1.24],[15.95,-.07,1.74,1.15],[16.59,-.08,1.61,1.12],[17.03,-.06,1.67,1.15],
    [17.66,-.04,1.83,1.21],[18.35,-.07,1.98,1.24],[19.00,-.1,2.10,1.24],
    [19.62,-.10,2.17,1.28],[20.14,-.11,2.2,1.30],[20.64,-.12,2.22,1.24],
    [21.17,-.08,2.50,1.34],[21.57,-.06,2.70,1.43],[21.85,-.04,2.49,1.36],
    [22.04,-.04,2.14,1.23],[22.24,-.08,1.68,1.09],[22.4,-.12,1.26,.94],
    [22.55,-.13,1.045,.82],[22.67,-.14,.89,.78]
  ];
  function bodyAt(y,a,b,extra=0){
    let index=1;while(index<bodyRows.length-1&&bodyRows[index][0]<y)index++;
    const l=bodyRows[index-1],h=bodyRows[index],n=Math.max(0,Math.min(1,(y-l[0])/(h[0]-l[0])));
    const [,z,rx,rz]=mix(l,h,n);
    const side=Math.sin(a),front=Math.cos(a),rip=Math.max(0,front);
    const chest=.48*Math.exp(-Math.pow((y-19.92)/.89,2))*Math.exp(-Math.pow((Math.abs(a)-.49)/.45,2));
    const rib=.08*rip*Math.sin((y-13)*2)*(1-smooth((y-21)/1.1));
    return [side*(rx+extra)-.10*Math.sin((y-14)*.38)*(1-smooth((y-21)/1.2)),y+b*smooth((y-14)/6),z+front*(rz+extra)+chest*rip+rib];
  }
  function torso(m,p,b,wave){
    stole(m,p,b,wave);
    const rows=bodyRows.map(r=>r[0]);
    function opening(y){
      return Math.max(0,-1.74+2.32*smooth(((y-13.7)/8.85-.18)/.82));
    }
    // Tailor the ivory inset to the opening of the outer robe. It meets
    // each lapel along a shared seam rather than extending under the shoulders.
    const inset=rows.filter(y=>y>=18.35&&y<22.55).concat([22.55]);
    for(let i=1;i<inset.length;i++)for(let j=0;j<16;j++){
      const point=(y,k)=>bodyAt(y,(k/8-1)*(opening(y)+.045),b);
      m.face([point(inset[i-1],j),point(inset[i-1],j+1),point(inset[i],j+1),point(inset[i],j)],p.ivory);
    }
    surface(m,(t,a)=>bodyAt(22.545+t*.125,a,b),4,36,p.ivory);
    // Fold the raised inner collar back into the neck. The narrow rolled lip
    // hides the edge even at the shallow grazing angles of a profile shot.
    surface(m,(t,a)=>bodyAt(22.61+t*.047,a,b,.017-.11*t),3,32,p.ivory);
    // Cut two wrap panels on the torso itself. Their collar edges run from the back
    // of each shoulder to the opposite waist and continue into the sash.
    function panel(side,outer){
      const grid=[],tiers=29,segments=24;
      for(let j=0;j<=tiers;j++){
        const t=j/tiers,y=13.7+8.85*t;
        const inside=side*( -1.74+2.32*smooth((t-.18)/.82));
        const far=side*(Math.PI+.055);
        const pts=[];
        for(let i=0;i<=segments;i++){
          const u=i/segments,a=inside+(far-inside)*u;
          const fold=.037*Math.sin(8*u+t*5)*Math.sin(Math.PI*u)*Math.sin(Math.PI*t);
          pts.push(bodyAt(y,a,b,(outer?.165:.06)+fold));
        }grid.push(pts);
      }
      for(let j=1;j<=tiers;j++)for(let i=0;i<segments;i++){
        const a=grid[j-1][i],h=grid[j-1][i+1],c=grid[j][i+1],d=grid[j][i];
        m.face(side>0?[a,h,c,d]:[a,d,c,h],outer?p.cape:p.tunic);
      }
      const trim=[];
      for(let j=0;j<=tiers;j++){
        const t=j/tiers,y=13.7+8.85*t;
        const a=side*(-1.74+2.32*smooth((t-.18)/.82)),w=.19+.085*t;
        trim.push([bodyAt(y,a,b,outer?.226:.109),bodyAt(y,a+side*w,b,outer?.230:.115)]);
      }
      strip(m,trim,outer?p.ivory:p.lining);
      sweep(m,trim.map(r=>[...r[1],.044]),p.seam,5);
      if(outer){
        // The front lapel is embroidered with slender branches instead of armor plates.
        for(let j=8;j<17;j+=2){
          const t=j/18,y=13.7+8.85*t;
          const a=side*(-1.74+2.32*smooth((t-.18)/.82)+.34);
          const at=(dy,da)=>bodyAt(y+dy,a+side*da,b,.225);
          m.face([at(-.20,0),at(-.10,.08),at(.18,.12),at(.04,.03)],p.seam);
        }
      }
    }
    panel(-1,false);panel(1,true);
    // Wrapped silk waist. Two layers cross with different pitches and form a knot
    // at the side; the hanging ribbons drift free of the hip and upper thigh.
    for(let j=0;j<3;j++){
      const y=14.67+j*.32;
      surface(m,(t,a)=>bodyAt(y+t*.42+(.24-j*.11)*Math.sin(a-.55),a,b,.2+j*.018),3,24,j===1?p.sashLight:p.sash);
    }
    surface(m,(t,a)=>bodyAt(15.55+t*.055+.037*Math.sin(a-.55),a,b,.259),2,24,p.seam);
    const knot=bodyAt(15.0,-.99,b,.33);
    const knotPath=[[knot[0]-.1,knot[1]-.27,knot[2],.19],[knot[0]-.35,knot[1]+.09,knot[2]+.15,.31],[knot[0]-.12,knot[1]+.35,knot[2]+.14,.29],[knot[0]+.16,knot[1]+.12,knot[2]+.12,.2]];
    sweep(m,knotPath,p.sashLight,9);
    for(const s of [-1,1]){
      const strips=[],len=s>0?4.15:5.25;
      for(let i=0;i<=8;i++){
        const t=i/8,x=knot[0]-.10-.83*t+.19*Math.sin(wave+t*2)*t+s*.28*Math.sin(t*1.9);
        const y=knot[1]-.07-len*t,z=knot[2]+.1+.83*Math.sin(t*1.7)+s*.16*t;
        const w=.17+.11*Math.sin(Math.PI*t);
        strips.push([[x-w,y+.06*t,z-.075],[x+w,y-.20*t,z+.075]]);
      }strip(m,strips,s>0?p.sash:p.sashLight);
      sweep(m,strips.map(row=>[...row[s>0?0:1],.026]),p.seam,4);
    }
    brooch(m,[knot[0]-.21,knot[1]+.14,knot[2]+.36],.31,p);
    // The back-mounted quiver harness passes underneath the collar and upper arm.
    const harness=[];
    for(let i=0;i<=13;i++){
      const t=i/13,a=1.24+t*1.25,y=15.68+5.98*t;
      harness.push([bodyAt(y,a-.105,b,.148),bodyAt(y,a+.105,b,.148)]);
    }
    strip(m,harness,p.shade);stitchLine(m,harness.map(r=>r[0]),p.seam,.020);
  }
  function quiver(m,b){
    const a=[.14,15.32+b,-1.87],end=[2.9,23.32+b,-1.74];
    const ra=unit(sub(end,a)),right=unit(cross(ra,Z)),front=unit(cross(right,ra));
    const section=(t,r,angle)=>add(mix(a,end,t),add(mul(right,Math.cos(angle)*r),mul(front,Math.sin(angle)*r)));
    sweep(m,[[...a,.40],[...mix(a,end,.04),.60],[...mix(a,end,.23),.73],[...mix(a,end,.86),.86],[...end,.94]],"#785840",10);
    // Bound mouth with a dark empty interior and a stitched seam down its shaft.
    for(const [t,r] of [[.08,.65],[.77,.87],[.98,.97]])band(m,mix(a,end,t-.018),mix(a,end,t+.018),r,r+.012,t===.77?welt:gold,10);
    const rim=[],inner=[],well=[];
    for(let i=0;i<12;i++){rim.push(section(1,.966,tau*i/12));inner.push(section(1,.825,tau*i/12));well.push(section(.975,.80,tau*i/12))}
    link(m,rim,inner,welt);link(m,inner,well,leatherDeep);m.face(well,leatherDeep);
    const seam=[];for(let i=0;i<13;i++){const t=.12+.82*i/12;seam.push(section(t,.75+t*.17,-1.25+t*.3))}
    stitchLine(m,seam,"#b2a17a",.033);
    for(let i=0;i<5;i++){
      const r=section(.997,.58,-.91+i*1.54),len=2.23+(i%3)*.54;
      const dir=unit([.29+(i%2)*.15,.96,-.08+(i%3)*.075]);
      const tip=add(r,mul(dir,len)),base=add(r,mul(dir,-.7));
      band(m,base,tip,.068,.054,lightWood,5);
      for(let j=0;j<3;j++){
        const u=unit(cross(dir,Z)),v=unit(cross(u,dir)),ang=tau*j/3+i*.44;
        const n=add(mul(u,Math.cos(ang)),mul(v,Math.sin(ang)));
        const at=(t,w)=>add(add(tip,mul(dir,-t)),mul(n,w));
        m.face([at(.06,.02),at(.17,.30),at(.41,.35),at(.93,.28),at(1.28,.02)],j===0?"#976b56":"#dac9a7");
        m.face([at(.39,.32),at(.44,.35),at(.66,.025)],"#ab8c6b");
      }
    }
  }
  const lightWood="#c79666";
  function arrow(m,nock,axis,length,tipColor) {
    const end=add(nock,mul(axis,length));
    band(m,nock,end,.065,.07,"#a8794e",5);
    const left=unit(cross(Y,axis)),up=unit(cross(axis,left)),start=add(nock,mul(axis,.16));
    for(let i=0;i<3;i++){
      const radial=add(mul(left,Math.cos(tau*i/3)),mul(up,Math.sin(tau*i/3)));
      const wing=[add(start,mul(radial,.12)),add(add(start,mul(radial,.47)),mul(axis,.12)),add(add(start,mul(radial,.45)),mul(axis,1.02)),add(start,mul(axis,1.52))];
      m.face(wing,i===1?"#d5b689":"#e8d9b0");
    }
    const root=add(end,mul(axis,-.32));
    for(let i=0;i<4;i++){
      const dir=add(mul(left,Math.cos(tau*i/4)),mul(up,Math.sin(tau*i/4)));
      const aft=add(root,mul(dir,.34));m.face([root,aft,add(end,mul(axis,.72))],tipColor);
    }
  }
  function poseState(pose,phase){
    const shoot=pose==="shoot";
    const raise=shoot?(phase<.23?smooth(phase/.23):phase<.77?1:1-smooth((phase-.77)/.23)):0;
    const hold=shoot?(phase<.2?0:phase<.56?smooth((phase-.2)/.36):phase<.73?1:1-smooth((phase-.73)/.23)):0;
    const release=shoot&&phase>=.65&&phase<.78?Math.sin(Math.PI*(phase-.65)/.13):0;
    return {shoot,raise,hold,release,twist:-.20-.78*raise};
  }
  // Keep boots planted while the hip, ribcage, shoulders and quiver rotate through
  // different arcs. Wrapping the mesh deforms the same seams as the silk surface.
  function turnPoint(v,angle,whole=false){
    const toNeck=smooth((v[1]-21.05)/1.24);
    const t=whole?1:smooth((v[1]-13.60)/7.9)*(1-toNeck),theta=t*angle;
    const c=Math.cos(theta),s=Math.sin(theta),x=v[0],z=v[2];
    return [x*c+z*s,v[1],z*c-x*s];
  }
  function turnMesh(m,angle,whole){
    return {face(points,col){m.face(points.map(v=>turnPoint(v,angle,whole)),col)}};
  }
  // Two-bone IK projects the preferred elbow into the anatomically reachable arm
  // plane without varying either bone's length as the hand tracks its target.
  function armElbow(shoulder,hand,pole,upper,lower){
    const delta=sub(hand,shoulder),d=Math.hypot(...delta),u=unit(delta);
    const center=(upper*upper-lower*lower+d*d)/(2*Math.max(.0001,d));
    const bend=Math.sqrt(Math.max(0,upper*upper-center*center));
    const pv=sub(pole,shoulder),dot=pv.reduce((v,n,i)=>v+n*u[i],0);
    const v=unit(sub(pv,mul(u,dot)));
    return add(add(shoulder,mul(u,center)),mul(v,bend));
  }
  function archerArms(m,p,b,state,phase,breath,inBattle){
    const {shoot,raise,hold,release,twist}=state;
    const skin=window.PineVisage.skin?.base||"#f1baaa";
    const lS=turnPoint([2.62,21.71+b,-.08],twist,true);
    const rS=turnPoint([-2.63,21.89+b,-.08],twist,true);
    const reach=4.75+2.8*hold;
    const bowHand=mix([3.18,15.47+b+breath*.06,2.13],[-1.20,24.22+b,reach],raise);
    const cheek=[-1.28,24.59+b,.83];
    const stringStart=[-1.09,24.60+b,3.42];
    const rHand=mix(mix([-1.59,16.32+b,1.78],stringStart,raise),cheek,hold);
    rHand[0]-=release*.12;rHand[1]+=release*.035;rHand[2]-=release*1.08;
    const elbowL=armElbow(lS,bowHand,mix([4.2,18,-.78],[3.15,22.48,3.5],raise),3.75,3.64);
    const elbowR=armElbow(rS,rHand,mix([-3.8,18.6,-1.15],[-2.19,23.95,-5.7],raise*hold),3.76,3.46);
    for (const [s,shoulder,elbow,hand] of [[1,lS,elbowL,bowHand],[-1,rS,elbowR,rHand]]){
      const upper=t=>mix(shoulder,elbow,t),fore=t=>mix(elbow,hand,t);
      const anchor=turnPoint([s*1.50,21.58+b,-.09],twist,true);
      const wristDirection=unit(sub(hand,elbow)),wrist=fore(.91);
      const palm=add(hand,[s*.015,-.036,.15]);
      // One connected surface runs from the shoulder socket around the elbow to the
      // palm. Sleeve rolls and cuff thickness have their own sections, so there are
      // no open tube ends or stacked coplanar surfaces at either joint.
      const parts=[];
      function section(v,r,w,col){parts.push({v:[...v,r,w],col})}
      section(anchor,.35,.37,p.cape);
      section(mix(anchor,shoulder,.32),.56,.60,p.cape);
      section(mix(anchor,shoulder,.58),.70,.70,p.cape);
      section(mix(anchor,shoulder,.81),.78,.78,p.cape);
      section(mix(mix(anchor,shoulder,.90),upper(.045),.5),.85,.84,p.cape);
      section(upper(.075),.90,.89,p.cape);
      section(upper(.14),.90,.90,p.cape);
      section(upper(.22),.88,.90,p.cape);
      section(upper(.345),.815,.833,p.cape);
      section(upper(.384),.827,.84,p.cape);
      section(upper(.404),.827,.84,p.seam);
      section(upper(.42),.743,.752,p.lining);
      section(upper(.52),.704,.72,p.tunic);
      section(upper(.69),.665,.68,p.tunic);
      section(upper(.79),.615,.635,p.tunic);
      section(upper(.87),.576,.60,p.tunic);
      section(upper(.935),.55,.581,p.tunic);
      const elbowMid=mix(upper(.93),fore(.085),.5);
      section(elbowMid,.548,.572,p.tunic);
      section(fore(.071),.56,.583,p.tunic);
      section(fore(.17),.588,.604,p.tunic);
      section(fore(.215),.605,.62,p.tunic);
      section(fore(.231),.622,.635,p.lining);
      const bracer=s>0?p.shade:p.cape;
      section(fore(.249),.628,.64,p.seam);
      section(fore(.28),.616,.633,bracer);
      section(fore(.42),.592,.61,bracer);
      section(fore(.58),.52,.553,bracer);
      section(fore(.71),.449,.478,bracer);
      section(fore(.805),.403,.435,bracer);
      section(fore(.832),.409,.438,p.lining);
      section(fore(.851),.408,.436,p.seam);
      section(fore(.864),.361,.393,bracer);
      section(wrist,.339,.366,skin);
      section(fore(.969),.339,.355,skin);
      section(hand,.335,.349,skin);
      section(add(palm,mul(wristDirection,.09)),.37,.34,skin);
      section([palm[0]+s*.045,palm[1]-.052,palm[2]+.30],.348,.308,skin);
      section([palm[0]+s*.065,palm[1]-.083,palm[2]+.39],.24,.235,skin);
      section([palm[0]+s*.078,palm[1]-.095,palm[2]+.436],.08,.11,skin);
      sweep(m,parts.map(v=>v.v),i=>parts[i].col,14);
      // Curl the distal phalanges back towards the near side of the grip. Distinct
      // knuckles form a compact bow hand and the two hooked string fingers.
      for(let i=0;i<4;i++){
        const y=palm[1]+.187-i*.143,x=palm[0]+s*.015,z=palm[2]+.086;
        const r=[.111,.119,.11,.091][i],spread=[1,.99,.91,.77][i];
        const pose=s>0?[[.02,.035,.055],[.19,.056,.221],[.315,.032,.208],[.39,-.023,.085],[.33,-.071,-.048],[.23,-.080,-.102],[.18,-.077,-.103]]:
          [[-.03,.012,.115],[.10,.030,.306],[.235,.012,.335],[.333,-.034,.238],[.296,-.078,.126],[.214,-.09,.103],[.174,-.087,.111]];
        const radii=[.87,1.07,1.00,.88,.73,.57,.19];
        sweep(m,pose.map(([xx,yy,zz],j)=>[x+s*xx*spread,y+yy,z+zz,r*radii[j]]),skin,8);
      }
      const thumb=[[palm[0]-.14*s,palm[1]-.025,palm[2]-.11,.164],
        [palm[0]-.28*s,palm[1]+.08,palm[2]-.02,.154],[palm[0]-.31*s,palm[1]+.222,palm[2]+.118,.136],
        [palm[0]-.175*s,palm[1]+.277,palm[2]+.205,.116],[palm[0]-.022*s,palm[1]+.24,palm[2]+.214,.088],
        [palm[0]+.045*s,palm[1]+.221,palm[2]+.195,.03]];
      sweep(m,thumb,skin,8);
    }
    // Recurve: belly side is tapered gold laminate, upper and lower nocks turn forward.
    const up=unit(mix([.54,.834,-.10],[.075,.997,.008],raise));
    const forward=unit(mix([.19,.05,.979],[0,0,1],raise));
    const center=add(bowHand,[.11,0,.16]);
    const bowAt=(h,d)=>add(center,add(mul(up,h),mul(forward,d)));
    const limbs=[[-8.13,-1.62,.09],[-7.70,-2.01,.15],[-6.86,-2.19,.2],[-5.94,-1.77,.25],[-4.75,-.98,.32],[-3.59,-.34,.34],[-2.19,.02,.28],[-.82,.08,.22],[0,0,.22],[.8,.08,.23],[2.19,.08,.28],[3.63,-.28,.34],[4.93,-.92,.31],[6.42,-1.86,.22],[7.26,-2.13,.17],[8.10,-1.91,.13],[8.63,-1.47,.09]];
    sweep(m,limbs.map(([h,d,r])=>[...bowAt(h,d),r,r*.77]),"#95643f",8);
    sweep(m,limbs.map(([h,d,r])=>[...bowAt(h,d+r*.64),r*.36,r*.44]),"#dfbb79",6);
    for(const h of [-6.76,-2.2,-.82,-.55,-.29,-.03,.23,.51,.8,2.23,7.32]){
      const nearest=limbs.reduce((a,c)=>Math.abs(c[0]-h)<Math.abs(a[0]-h)?c:a,limbs[0]);
      const d=Math.abs(h)<=.83?.055:nearest[1],r=nearest[2]+.05;
      band(m,bowAt(h-.08,d),bowAt(h+.08,d),r,r,Math.abs(h)<=.83?leatherDeep:goldLight,7);
    }
    const bowTop=bowAt(8.63,-1.47),bowBottom=bowAt(-8.13,-1.62);
    const rest=bowAt(.34,-1.55);
    const stringPull=phase<.65?hold:hold*(1-smooth((phase-.65)/.034));
    const nock=mix(rest,[rHand[0]+.115,rHand[1]+.008,rHand[2]+.22],stringPull);
    band(m,bowBottom,nock,.035,.039,"#f1d9af",4);band(m,nock,bowTop,.039,.035,"#f1d9af",4);
    // A real shaft lies on the rest and remains for a few frames after release.
    if(shoot&&phase>.1&&phase<(inBattle?.65:.77)){
      const n=phase>=.65?add([cheek[0]+.115,cheek[1]+.008,cheek[2]+.22],mul(forward,(phase-.65)*106)):nock;
      const dir=phase>=.65?forward:unit(add(sub(bowAt(.39,.23),n),mul(forward,.08)));
      arrow(m,n,dir,7.6,"#b9c7c4");
    }
    return raise;
  }
  function draw(m,pose="idle",phase=0,skinName="pine",inBattle=false){
    phase=((phase%1)+1)%1;
    const p=palettes[skinName]||palettes.pine,wave=tau*phase;
    const breath=Math.sin(wave),b=pose==="shoot"?.055*breath:.15*breath;
    const state=poseState(pose,phase);
    lower(m,p,wave);
    torso(turnMesh(m,state.twist,false),p,b,wave);
    quiver(turnMesh(m,state.twist,true),b);
    const aim=archerArms(m,p,b,state,phase,breath,inBattle);
    window.PineVisage.draw(m,b,aim,wave,p,-.11*(1-aim));
  }
  window.PineRanger={draw};
})();
