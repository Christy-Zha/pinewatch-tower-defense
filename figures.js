/* Hand-built low-poly figurines. Local Y is up and local +Z is forward. */
(() => {
  "use strict";

  const skins = {
    pine: { light: "#67b09c", main: "#318c78", deep: "#295f57", trim: "#ddac65", gem: "#68e5e6", crystal: "#39afce", darkGem: "#267e9d", tip: "#ccfff0" },
    dawn: { light: "#e58b66", main: "#b74f49", deep: "#823f46", trim: "#f4cb77", gem: "#ffc07e", crystal: "#e97762", darkGem: "#ad4d55", tip: "#fff1b2" },
    night: { light: "#ba9ade", main: "#8063aa", deep: "#52517e", trim: "#9ec9e1", gem: "#c9adff", crystal: "#9678dd", darkGem: "#6159a4", tip: "#eae9ff" }
  };
  const wood = "#965b36", lightWood = "#c58b51", darkWood = "#624936";
  const slate = "#526273", iron = "#394655", silver = "#a7b7ba";
  const brass = "#c29352", leather = "#744934", skinGreen = "#839c53";
  // Each figurine is authored around its own feet and rotated once into world space.
  function model(m, x, z, yaw = 0, base = 1) {
    const s = Math.sin(yaw), c = Math.cos(yaw);
    function point(a, b, d) { return [x + a*c + d*s, base + b, z + d*c - a*s]; }
    return {
      box(a,b,d,w,h,l,color,rot = 0) {
        const p = point(a,b,d);
        m.box(p[0],p[1],p[2],w,h,l,color,yaw + rot);
      },
      ring(a,b,d,r1,r2,h,n,color,rot = 0) {
        const p = point(a,b,d);
        m.frustum(p[0],p[1],p[2],r1,r2,h,n,color,yaw + rot);
      },
      face(points,color) { m.face(points.map(v => point(...v)),color); }
    };
  }

  // Low-sided tubes used for structural braces, gun barrels, weapon hafts and limbs.
  function beam(g, a, b, r1, r2, sides, color, cap = true) {
    const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2];
    const len = Math.hypot(dx,dy,dz);
    if (!len) return;
    const ux = dx/len, uy = dy/len, uz = dz/len;
    const across = Math.hypot(ux,uz);
    const vx = across ? uz/across : 1, vz = across ? -ux/across : 0;
    const wx = uy*vz, wy = uz*vx - ux*vz, wz = -uy*vx;
    const start = [], end = [];
    for (let i = 0; i < sides; i++) {
      const t = (i+0.5)*2*Math.PI/sides, cs = Math.cos(t), sn = Math.sin(t);
      const ex = vx*cs + wx*sn, ey = wy*sn, ez = vz*cs + wz*sn;
      start.push([a[0]+ex*r1,a[1]+ey*r1,a[2]+ez*r1]);
      end.push([b[0]+ex*r2,b[1]+ey*r2,b[2]+ez*r2]);
    }
    for (let i = 0; i < sides; i++) {
      const j = (i+1)%sides;
      g.face([start[i],start[j],end[j],end[i]],color);
    }
    if (cap) g.face(end,color);
  }

  function gem(g,x,y,z,r,h,colors) {
    const bottom = [x,y,z], top = [x+r*.16,y+h,z];
    const p = [];
    for (let i=0; i<5; i++) {
      const angle = 2*Math.PI*i/5+.3;
      p.push([x+r*Math.cos(angle),y+h*.54,z+r*Math.sin(angle)]);
    }
    for (let i=0;i<5;i++) {
      const j=(i+1)%5;
      g.face([p[i],p[j],top], [colors.gem, colors.crystal, colors.darkGem, colors.gem, colors.tip][i]);
      g.face([p[j],p[i],bottom], i%2 ? colors.darkGem : colors.crystal);
    }
  }

  function roof(g, y, w, d, h, p) {
    // Hipped ends leave a horizontal ridge that reads clearly from any camera angle.
    const fl=[-w,y,d], fr=[w,y,d], bl=[-w,y,-d], br=[w,y,-d];
    const rl=[-w*.43,y+h,0], rr=[w*.43,y+h,0];
    g.face([fl,fr,rr,rl],p.main);
    g.face([br,bl,rl,rr],p.light);
    g.face([bl,fl,rl],p.deep);
    g.face([fr,br,rr],p.deep);
    g.face([bl,br,fr,fl],darkWood);
    g.box(0,y+h+.08,0,w*.89,.53,.7,p.trim);
    g.box(0,y-.2,d,w*2,.75,.6,p.trim);
    g.box(0,y-.2,-d,w*2,.75,.6,lightWood);
  }

  function flag(g, x, y, z, p) {
    g.box(x,y+2.7,z,.65,6,.65,p.trim);
    g.face([[x,y+5.5,z],[x+4.6,y+4.6,z+.6],[x+3.4,y+3.65,z+.4],[x+4.2,y+2.65,z+.5],[x,y+3.15,z]],p.main);
    g.ring(x,y+5.7,z,.58,0,1,5,p.trim);
  }

  function arrowTower(g, t, level, p) {
    g.ring(0,0,0,8.7,8,2.3,8,"#6c7366",Math.PI/8);
    g.box(0,2.4,0,11,1,10,darkWood);
    for (const a of [-1,1]) for (const d of [-1,1]) {
      g.box(4.5*a,9.5,4*d,2.1,15,2.1,wood);
      g.box(4.5*a,3.3,4*d,2.45,1.2,2.45,brass);
      g.box(4.5*a,21.4,4*d,1.25,6.8,1.25,lightWood);
    }
    for (const side of [-1,1]) {
      beam(g,[-4,5,4*side],[4,14.4,4*side],.84,.84,4,lightWood);
      beam(g,[4.5*side,5,-3.7],[4.5*side,14.4,3.7],.7,.7,4,darkWood);
    }
    g.box(0,15.5,0,14.7,2.3,12.8,darkWood);
    g.box(0,16.9,0,15.6,.85,13.4,lightWood);
    g.box(0,18.2,-5.25,13.4,2.15,1.05,wood);
    g.box(-6.4,18,0,1,2.1,10.9,lightWood);
    g.box(6.4,18,0,1,2.1,10.9,wood);
    roof(g,24.6,8.6,7.5,6.4,p);
    // A rotating front-mounted ballista remains visible beneath the canopy edge.
    t.ring(0,17.2,0,2.8,2,1.4,6,brass);
    beam(t,[0,18.7,0],[0,20.5,9],1.03,.83,4,darkWood);
    beam(t,[-5.1,20,5],[-2.6,20.4,7.7],.69,.72,4,p.trim);
    beam(t,[-2.6,20.4,7.7],[2.6,20.4,7.7],.72,.72,4,brass);
    beam(t,[2.6,20.4,7.7],[5.1,20,5],.72,.69,4,p.trim);
    t.face([[-5.1,20.1,5],[0,19.5,3.7],[5.1,20.1,5],[0,19.8,4.05]],"#f2ddb2");
    beam(t,[0,20.9,5],[0,21.5,10],.27,.27,4,"#dacba6");
    beam(t,[0,21.4,9.4],[0,21.8,11.6],.8,0,4,silver);
    if (level>=2) {
      g.face([[-2,16.7,6.7],[2,16.7,6.7],[2,10.3,6.7],[0,8.7,6.7],[-2,10.3,6.7]],p.main);
      g.face([[-.45,16.6,6.75],[.45,16.6,6.75],[.45,10.2,6.75],[0,9.6,6.75],[-.45,10.2,6.75]],p.trim);
    }
    if (level>=3) flag(g,-1.4,30.9,0,p);
  }

  function cannonTower(g,t,level,p) {
    g.ring(0,0,0,10.6,9.7,2.2,8,"#72807b",Math.PI/8);
    g.ring(0,2.2,0,8.8,8.2,8.4,8,"#758491",Math.PI/8);
    g.ring(0,4.15,0,9,8.95,.85,8,"#535e6a",Math.PI/8);
    g.ring(0,8.75,0,8.7,8.7,.95,8,slate,Math.PI/8);
    g.ring(0,10.1,0,9.4,9.4,1.5,8,"#bac1ab",Math.PI/8);
    for (const side of [-1,1]) {
      g.box(side*5.5,12, -5,2.4,2.2,2.3,slate);
      g.box(side*6.9,12, 2.8,2.2,2.2,2.3,slate);
    }
    t.ring(0,11.5,0,5.8,5,2.5,8,darkWood);
    for (const a of [-1,1]) {
      t.box(a*3.7,15.55,0,2.4,5.4,6.2,wood);
      t.box(a*3.7,17.6,0,2.7,1.2,6.45,p.trim);
      beam(t,[a*4.3,16.5,0],[a*5.25,16.5,0],1.55,1.3,8,brass);
    }
    const barrel = z => [0,17.2+z*.52,z];
    beam(t,barrel(-4),barrel(-2),2.33,3.45,8,slate);
    beam(t,barrel(-2),barrel(8.3),3.45,2.95,8,iron);
    for (const k of [-2.4,3.5]) beam(t,barrel(k),barrel(k+1.15),3.56,3.55,8,brass);
    beam(t,barrel(8),barrel(10.4),3.45,3.6,8,silver);
    beam(t,barrel(10.41),barrel(10.53),2.42,2.42,8,"#23313c");
    flag(g,-6.1,11.6,-5.7,p);
    if (level>=2) {
      g.ring(0,5.8,0,8.89,8.85,1.1,8,brass,Math.PI/8);
      t.box(0,20.5,-1.1,1.1,2.1,1.8,p.trim);
    }
    if (level>=3) {
      for (const k of [0,5.8]) beam(t,barrel(k),barrel(k+.7),3.63,3.64,8,p.trim);
      for (const a of [-1,1]) g.ring(a*6.4,11.75,4.3,1.5,.2,3.4,4,p.trim);
    }
  }

  function frostTower(g, level, p) {
    g.ring(0,0,0,9,9.2,1.5,6,"#83979e");
    g.ring(0,1.5,0,8.8,7.8,2.3,6,"#586a7e");
    g.ring(0,3.8,0,6.5,4.9,7.9,6,"#3d536d");
    g.ring(0,6.4,0,6.3,6.1,.85,6,p.trim);
    g.ring(0,11.4,0,5.1,7.3,2.4,6,"#647f90");
    g.ring(0,13.8,0,7.3,6.7,1.1,6,p.trim);
    for (let i=0;i<3;i++) {
      const angle=2*Math.PI*i/3+.38, a=Math.sin(angle), d=Math.cos(angle);
      beam(g,[a*3.6,9,d*3.6],[a*7.7,19,d*7.7],1.8,1.23,4,"#678697");
      beam(g,[a*7.7,19,d*7.7],[a*7.05,22.2,d*7.05],1.25,.18,4,p.trim);
    }
    g.ring(0,14.9,0,4.7,3.2,2,6,p.darkGem);
    gem(g,0,15.85,0,4.65,16.65,p);
    if (level>=2) gem(g,-5,14.8,-3.9,2.25,8.4,p);
    if (level>=3) {
      gem(g,5.1,16.3,-3.5,2.1,9,p);
      g.ring(0,9,0,5.8,5.65,.7,6,p.trim);
    }
  }

  function tower(m,type,x,z,level=1,skin="pine",yaw=0) {
    const p=skins[skin] || skins.pine;
    const base=model(m,x,z,0), head=model(m,x,z,yaw);
    if (type==="cannon") cannonTower(base,head,level,p);
    else if (type==="frost") frostTower(base,level,p);
    else arrowTower(base,head,level,p);
  }

  function ear(g,x,y,z,sgn,color,size) {
    const a=[x,y+size*.5,z+.4], b=[x,y-size*.45,z+.4], c=[x+sgn*size*1.25,y+size*.65,z-.2], d=[x,y,z-size*.56];
    g.face([a,b,c],color);
    g.face([a,c,d],color);
    g.face([c,b,d],color);
  }

  function legs(g,phase,spread,height,width,color,boot,bob) {
    for (const s of [-1,1]) {
      const forward=s*phase, sx=s*spread;
      const ry=1.05+Math.max(0,Math.abs(phase)-.65)*.4;
      beam(g,[sx,height+bob,0],[sx,ry,forward],width,width*.85,4,color);
      g.box(sx,ry,forward+.28,width*1.47,1.85,width*1.85,boot);
    }
  }

  function goblin(g,phase,bob,slow) {
    legs(g,phase,1.15,4.5,.94,leather,"#4c3a35",bob);
    g.ring(0,3.15+bob,0,2.7,2.4,4.2,5,"#a37449",.3);
    g.ring(0,4+bob,0,2.79,2.75,.78,5,darkWood,.3);
    g.box(0,6.2+bob,0,3.7,2.5,2.4,leather);
    const face=slow?"#86baa0":"#89a860";
    g.box(0,9.6+bob,.2,5.4,4.45,4,face);
    g.box(0,9.05+bob,2.17,2.3,1.5,1.2,"#9eb773");
    for (const s of [-1,1]) {
      ear(g,s*2.5,10+bob,0,s,face,1.7);
      g.box(s*1.46,10.05+bob,2.25,1.15,.61,.26,"#f4db91");
      g.box(s*.98,8.4+bob,2.2,.45,.7,.46,"#f2ddae");
    }
    g.ring(0,11.4+bob,-.15,3.12,1.6,1.65,5,"#73634a",.3);
    g.box(-2.8,5.85+bob,0,1.15,2.8,1.3,face);
    g.box(-3.32,5.52+bob,.3,.85,3.15,2.8,"#838e68");
    g.box(2.52,6.32+bob,.65,1.5,1.5,2.3,face);
    beam(g,[2.75,6.25+bob,1.15],[3.3,7.6+bob,1.8],.43,.43,4,leather);
    g.box(3.15,7.35+bob,1.8,1.85,.45,.55,brass);
    beam(g,[3.22,7.5+bob,1.8],[4.45,11+bob,3.3],.69,0,4,silver);
  }

  function wolf(g,phase,bob,slow) {
    const back=slow?"#8da6ac":"#ab6341", ruff=slow?"#baccc4":"#e2b07b";
    for (const s of [-1,1]) for (const end of [-1,1]) {
      const a=s*1.25, z=end*2.52, step=s*end*phase;
      beam(g,[a,5.3+bob,z],[a,1.3,z+step],.77,.48,4,back);
      g.box(a,.8,z+step+.36,1.05,1.1,1.6,"#504337");
    }
    g.box(0,5.6+bob,-.45,3.55,3.15,6.4,back);
    beam(g,[0,5.6+bob,-3.2],[0,7.7+bob,-6.3],1.05,1.32,5,back);
    beam(g,[0,7.7+bob,-6.3],[.36,9.15+bob,-8],1.3,.12,5,ruff);
    g.ring(0,4.8+bob,2,1.65,2.9,2.85,5,ruff,.4);
    g.box(0,8.1+bob,3.5,3.48,3.45,3.6,back);
    g.box(0,7.7+bob,5.65,2.3,1.75,2.6,ruff);
    g.box(0,8.1+bob,6.8,1.7,.75,.74,"#303c39");
    for (const s of [-1,1]) {
      g.ring(s*1.2,9.45+bob,2.65,1.25,.1,2.65,3,"#845439",s*.4);
      g.box(s*1.36,8.5+bob,5.23,.72,.5,.31,"#f7d56f");
    }
  }

  function warrior(g,phase,bob,big,slow) {
    const f=big?1.27:1;
    const skin=big ? (slow?"#ad9ba6":"#bb6550") : (slow?"#95b6a3":skinGreen);
    const plate=big?"#6a515a":"#63717b";
    legs(g,phase*f,1.58*f,5.7*f,1.5*f,leather,"#4c4240",bob);
    g.ring(0,3.4*f+bob,0,3.72*f,3.18*f,3.1*f,6,"#80523d",.28);
    g.ring(0,6.2*f+bob,0,3.48*f,4*f,4.3*f,6,plate,.28);
    g.ring(0,5.3*f+bob,0,3.65*f,3.65*f,.85*f,6,darkWood,.28);
    g.box(.25,5.7*f+bob,3.05*f,1.65*f,.98*f,.65*f,brass);
    g.box(0,12.85*f+bob,.2,5.7*f,4.95*f,4.3*f,skin);
    g.box(0,11.95*f+bob,2.2*f,3.9*f,1.75*f,1.65*f,skin);
    for (const s of [-1,1]) {
      ear(g,s*2.75*f,13.35*f+bob,0,s,skin,1.1*f);
      g.box(s*1.55*f,13.34*f+bob,2.42*f,1.12*f,.52*f,.38*f,"#ffcc79");
      g.ring(s*1.36*f,11.6*f+bob,2.91*f,.51*f,.02,1.6*f,4,"#f1d5a1",.25);
      g.box(s*3.55*f,8.2*f+bob,-s*.28*phase,1.9*f,4.7*f,2*f,skin);
      g.ring(s*3.48*f,9.54*f+bob,0,2.05*f,1.45*f,1.75*f,5,plate,.43);
    }
    if (big) {
      g.ring(0,14.7*f+bob,0,3.48*f,2.83*f,1.4*f,6,"#6a4547",.2);
      for (const s of [-1,1]) {
        beam(g,[s*2.65*f,15.2*f+bob,-.55*f],[s*4.48*f,16.4*f+bob,-.65*f],1.13*f,.85*f,5,"#be9a77");
        beam(g,[s*4.48*f,16.4*f+bob,-.65*f],[s*4.5*f,18.9*f+bob,0],.85*f,0,5,"#f0d6a0");
      }
      g.face([[-2.8*f,10.9*f+bob,-2.1*f],[2.8*f,10.9*f+bob,-2.1*f],[3.25*f,3.3*f+bob,-3.8*f],[0,4.15*f+bob,-3.8*f],[-3.25*f,3.4*f+bob,-3.8*f]],"#813e46");
      beam(g,[4.25*f,4.2*f+bob,1.7*f],[4.25*f,14.25*f+bob,2.35*f],.56*f,.56*f,5,darkWood);
      g.box(4.25*f,13.8*f+bob,2.35*f,5.7*f,3.3*f,3.3*f,plate);
      g.box(4.25*f,13.8*f+bob,2.35*f,2.4*f,3.75*f,3.8*f,brass);
    } else {
      g.ring(0,14.1+bob,0,3.77,3.77,1,6,slate,.2);
      g.ring(0,15.1+bob,0,3.62,1.45,2.25,6,"#89959d",.2);
      g.box(0,15.7+bob,.85,.83,2.8,3.45,brass);
      beam(g,[3.9,4.9+bob,1.5],[3.9,13.3+bob,2.4],.52,.52,5,darkWood);
      g.face([[3.9,13.65+bob,2.42],[6.7,15+bob,2.42],[7.45,11.85+bob,2.42],[5.1,10.75+bob,2.42],[3.9,11.8+bob,2.42]],silver);
    }
  }

  function enemy(m,type,x,z,time=0,yaw=0,slow=false) {
    const g=model(m,x,z,yaw);
    const phase=Math.sin(time*(type==="runner"?12:8))*1.75;
    const bob=Math.abs(phase)*.24;
    if (type==="runner") wolf(g,phase,bob,slow);
    else if (type==="brute" || type==="boss") warrior(g,phase,bob,type==="boss",slow);
    else goblin(g,phase,bob,slow);
  }

  window.PineFigures={tower,enemy};
})();
