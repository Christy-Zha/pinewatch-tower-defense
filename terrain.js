(() => {
  'use strict';
  const W = 480, H = 280;
  const path = [
    [-10,81],[29,81],[47,81],[69,83],[82,88],[92,99],[97,112],[98,135],
    [102,148],[112,155],[128,160],[152,162],[166,158],[176,148],[182,134],
    [184,119],[184,97],[188,86],[197,78],[210,73],[232,68],[252,67],[266,71],
    [275,79],[280,92],[281,114],[280,148],[281,170],[286,181],[295,188],
    [310,194],[333,198],[348,198],[357,192],[363,181],[366,156],[372,144],
    [382,136],[396,131],[412,129],[430,127],[449,125]
  ];
  const pads = [[72,118],[124,119],[140,189],[156,79],[217,102],[250,146],
    [255,200],[314,126],[325,224],[393,165],[402,104]];
  const stream = [[77,-14],[73,5],[60,19],[59,31],[53,46],[46,56],[42,68],
    [42,84],[45,98],[43,111],[37,123],[32,135],[22,145],[14,153],[-10,164]];
  let image;

  function makeArt() {
    const buffer = new Uint32Array(W * H), material = new Uint8Array(W * H);
    const grassLight = new Uint8Array(W * H), palette = new Map();
    let seed = 260739;
    function rand() { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    const ri = (lo, hi) => Math.floor(rand()*(hi-lo+1))+lo;
    const pick = values => values[ri(0,values.length-1)];
    function color(hex) {
      if (palette.has(hex)) return palette.get(hex);
      const n = parseInt(hex,16), value = (0xff000000 | (n & 255)<<16 | n&0xff00 | n>>>16) >>> 0;
      palette.set(hex,value);
      return value;
    }
    function rect(x,y,w,h,c) {
      x = Math.floor(x); y = Math.floor(y);
      const r = Math.min(W,x+w), b = Math.min(H,y+h), l = Math.max(0,x);
      if (r<=l || b<=0 || y>=H) return;
      const v = color(c);
      for (let sy=Math.max(0,y);sy<b;sy++) buffer.fill(v,sy*W+l,sy*W+r);
    }
    function poly(points,c) {
      const ys = points.map(p=>p[1]);
      for (let y=Math.max(0,Math.ceil(Math.min(...ys)-.5));y<Math.min(H,Math.max(...ys));y++) {
        const cx=[], k=y+.5;
        for (let i=0,j=points.length-1;i<points.length;j=i++) {
          const a=points[i],b=points[j];
          if ((a[1]>k)!==(b[1]>k)) cx.push(a[0]+(k-a[1])*(b[0]-a[0])/(b[1]-a[1]));
        }
        cx.sort((a,b)=>a-b);
        for(let i=0;i+1<cx.length;i+=2) {
          const x=Math.ceil(cx[i]-.5), end=Math.ceil(cx[i+1]-.5);
          if(end>x) rect(x,y,end-x,1,c);
        }
      }
    }
    function dotLine(x1,y1,x2,y2,c) {
      const n=Math.max(Math.abs(x1-x2),Math.abs(y1-y2),1);
      for(let i=0;i<=n;i++) rect(Math.round(x1+(x2-x1)*i/n),Math.round(y1+(y2-y1)*i/n),1,1,c);
    }
    function oval(x,y,rx,ry,c) {
      for(let j=-ry;j<=ry;j++){
        const w=Math.floor(rx*Math.sqrt(Math.max(0,1-(j*j)/(ry*ry+.01))));
        rect(x-w,y+j,w*2+1,1,c);
      }
    }
    function hash(x,y,s=0) {
      let h=Math.imul(x,374761393)+Math.imul(y,668265263)+s;
      h=Math.imul(h^(h>>>13),1274126177);
      return ((h^(h>>>16))>>>0)/4294967295;
    }
    function noise(x,y,scale,s=0) {
      let u=x/scale,v=y/scale; const ix=Math.floor(u), iy=Math.floor(v);
      u-=ix;v-=iy;u=u*u*(3-2*u);v=v*v*(3-2*v);
      const a=hash(ix,iy,s)*(1-u)+hash(ix+1,iy,s)*u;
      const b=hash(ix,iy+1,s)*(1-u)+hash(ix+1,iy+1,s)*u;
      return a*(1-v)+b*v;
    }
    function nearest(x,y,line) {
      let best=Infinity;
      for(let i=1;i<line.length;i++) {
        const [a,b]=line[i-1], [c,d]=line[i], dx=c-a,dy=d-b;
        const t=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy)));
        const ex=x-a-t*dx, ey=y-b-t*dy;
        best=Math.min(best,ex*ex+ey*ey);
      }
      return Math.sqrt(best);
    }
    const greens=['547738','64843c','749542','84a249','90ac4d','9ab651','a6bd58','b0c563','b9c96a'];
    const road=['b48751','c3995c','cfa969','d9b575','e1bf7e','e7c885','ebce8d'];
    const river=['317782','398e92','41a09d','50b5aa','70c6b4'];
    const pixels=greens.map(color), roadPixels=road.map(color), riverPixels=river.map(color);
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const idx=y*W+x, n=noise(x,y,23,7), medium=noise(x,y,9,29), fine=noise(x,y,3,17);
      const wave=.6*Math.sin(x*.053)+.45*Math.cos(y*.2)+.3*Math.sin((x+y)*.51);
      const shadow=Math.max(0,(44-y)/43,(y-236)/55)*1.1;
      const shade=Math.max(0, Math.min(8, Math.floor(1.4+n*3.3+medium*1.7+fine*1.1+noise(x,y,68,19)*1.8-shadow)));
      buffer[idx]=pixels[shade];grassLight[idx]=shade;
      const d=nearest(x,y,path), waterD=nearest(x,y,stream);
      const width=8.9+wave*.7+medium*1.1;
      if(d<width+1.55){
        material[idx]=1;
        if(d>width) buffer[idx]=color(fine>.55?'91a050':'869746');
        else if(d>width-1.1) buffer[idx]=color(fine>.55?'a88e52':'b9a45c');
        else {
          const shade=Math.max(0,Math.min(6,Math.floor(n*1.6+medium*1.9+fine*.8+1.3-(d>width-2.7?1:0))));
          buffer[idx]=roadPixels[shade];
        }
      }
      const rw=6+medium*1.6+.5*Math.sin(y*.12);
      if(waterD<rw+4.2){
        material[idx]=2;
        if(waterD>rw+2.4) buffer[idx]=color(fine>.48?'7f914b':'8a9c51');
        else if(waterD>rw+1) buffer[idx]=color(y%17<9?'7e8153':'8b8256');
        else if(waterD>rw) buffer[idx]=color('4d7666');
        else if(waterD>rw-1.15) buffer[idx]=color('85c7a8');
        else buffer[idx]=riverPixels[Math.min(4,Math.floor(n+medium*2+fine*1.5))];
      }
    }
    const ground=(x,y) => x>=0&&x<W&&y>=0&&y<H&&material[y*W+x]===0;
    // Coherent grass tufts, undergrowth, gravel, and water glints.
    for(let i=0;i<5500;i++) {
      const x=ri(1,477),y=ri(3,278),idx=y*W+x;
      if(!ground(x,y)||rand()>(.28+noise(x,y,15,33)*.88)) continue;
      const sh=grassLight[idx], moss=greens[Math.max(0,sh-ri(1,3))];
      if(rand()<.34) {rect(x,y,ri(2,4),1,moss);rect(x+1,y-1,1,1,moss);}
      else {
        const h=ri(1,3);
        rect(x,y-h,1,h,moss);rect(x-1,y-1,1,1,moss);rect(x+1,y-1,1,1,moss);
        if(h>1)rect(x+2,y-2,1,1,greens[Math.min(8,sh+1)]);
      }
    }
    for(let i=0;i<11500;i++){
      const x=ri(0,W-3),y=ri(1,H-2),m=material[y*W+x];
      if(m===1 && rand()<.43) {
        const c=pick(['c39e61','ead294','cfad6c','f0d99c','bc9b62']);
        rect(x,y,ri(1,3),1,c);
        if(rand()<.18){rect(x+1,y-1,2,1,'e2c588');rect(x,y+1,2,1,'bfa36a');}
      }
      if(m===2 && nearest(x,y,stream)<5.1 && rand()<.67)
        rect(x,y,ri(1,5),1,pick(['82d2ba','9adbc3','54aba4','b1debd']));
    }
    function rock(x,y,s) {
      const shape=(points,c)=>poly(points.map(([a,b])=>[x+a*s,y+b*s]),c);
      shape([[-6,-1],[-5,-4],[-2,-7],[3,-7],[6,-5],[8,-1],[6,1],[-3,2]],'637652');
      shape([[-6,-2],[-4,-5],[-2,-7],[3,-7],[6,-5],[6,-2],[4,0],[-3,0]],'859183');
      shape([[-5,-3],[-2,-7],[3,-7],[2,-5],[-1,-4]],'b8bea0');
      shape([[2,-5],[4,-6],[6,-4],[6,-2],[4,0],[1,-1]],'6d7d72');
      rect(x-2*s,y-5*s,Math.max(1,3*s|0),1,'a8b197');
    }
    function flowers(x,y,n) {
      const petals=pick(['eee7ae','e9cd72','e7e2ae','c0c7aa','c9d4bc']);
      for(let k=0;k<n;k++) {
        const dx=x+ri(-7,7),dy=y+ri(-4,4);if(!ground(dx,dy))continue;
        rect(dx,dy,1,2,'6c8942');rect(dx,dy-1,ri(1,2),1,petals);
        if(rand()<.3)rect(dx-1,dy,1,1,petals);
      }
    }
    [[93,62],[169,178],[128,80],[222,53],[297,103],[316,178],[392,198],[119,213],
      [226,211],[80,152],[172,112],[343,153],[18,97],[308,222],[240,90],[45,174],
      [201,121],[389,109],[383,235],[217,167],[392,62]].forEach(([x,y])=>flowers(x,y,ri(6,15)));
    [[57,163,.7],[62,165,.46],[114,89,.52],[150,138,.61],[157,139,.36],[209,124,.6],
      [243,226,.7],[237,228,.48],[296,63,.83],[303,64,.45],[346,138,.6],[352,140,.35],
      [379,189,.48],[400,215,.8],[408,217,.55],[24,176,.68],[197,188,.68],[188,190,.42],
      [225,150,.55],[221,152,.34],[171,57,.48],[27,118,.4],[435,181,.7]].forEach(a=>rock(...a));
    // The timber crossing follows the route tangent.
    poly([[31,71],[55,73],[54,94],[29,91]],'526754');
    for(let i=0;i<8;i++){
      const x=29+i*3,y=71+(i>4?1:0);
      rect(x,y,3,19,'795538');rect(x,y,2,17,i%3===0?'d09e61':'b78b52');
      rect(x,y+1,1,12,i%3===0?'d9b174':'cda468');
      if(i%2)rect(x+1,y+8,1,5,'aa7e4e');
    }
    for(const y of [71,89]){
      rect(28,y,26,2,'795a3e');rect(28,y,25,1,'d2ad71');
      for(const x of [28,52]){rect(x,y-3,3,6,'6c523d');rect(x,y-3,3,1,'e0bc7d');rect(x,y-2,1,3,'ae8955');}
    }
    // Red forked banner marks the enemy's entrance.
    rect(8,53,2,19,'6d643d');rect(8,52,1,19,'bca16a');rect(8,52,12,1,'805d40');
    poly([[10,53],[21,53],[18,58],[20,63],[10,62]],'8d4d3d');
    poly([[10,53],[20,53],[17,56],[18,59],[10,58]],'c1704f');
    rect(13,54,1,5,'e2b87b');

    // Hand-pixeled fir layers with branch terraces and asymmetrical light.
    const palettes=[
      ['284a3a','335a40','427149','56844d','709859','8ba95e'],
      ['244b3e','305e48','3b7252','508755','65985d','80a768'],
      ['294e3f','396448','47784a','5e8d51','77a059','8eb063'],
      ['294b3a','335e42','426f46','57814a','709351','829e59'],
      ['254b43','315e50','3a7258','508662','639866','78a46c']
    ];
    const trees=[];
    function addTree(x,y,h,type) {
      const w=h*(.46+rand()*.17);
      // Measure the whole silhouette so that no branches cover roads or construction sites.
      for(const z of [0,.28,.55,.82]){
        const py=y-h*z, half=w*(1-z)*.48;
        for(const px of [x-half,x,x+half]) {
          if(nearest(px,py,path)<11 || nearest(px,py,stream)<8) return;
          if(pads.some(([u,v])=>Math.abs(u-px)<13&&Math.abs(v-py)<9))return;
          if(px>414 && py>60 && py<152)return;
        }
      }
      trees.push({x,y,h,w,type:type??ri(0,4),flip:rand()<.35,seed:ri(10,99999)});
    }
    for(let y=-2;y<66;y+=8)for(let x=-8;x<492;x+=8){
      const tx=x+ri(-4,4),ty=y+ri(-4,4);
      const limit=32+noise(tx,9,38,17)*25+7*Math.sin(tx*.025);
      if(ty<limit && rand()<.84)addTree(tx,ty,ri(21,42));
    }
    for(let y=217;y<322;y+=8)for(let x=-9;x<495;x+=9){
      const tx=x+ri(-4,4),ty=y+ri(-4,4);
      const edge=244+noise(tx,15,37,91)*22-11*Math.sin(tx*.035+.2);
      if(ty>edge&&rand()<.88)addTree(tx,ty,ri(22,41));
    }
    for(let y=21;y<292;y+=10)for(const x of [-6,3,474,488]){
      if(rand()<.82)addTree(x+ri(-5,5),y+ri(-5,5),ri(21,37));
    }
    const copses=[[16,54,5],[69,202,6],[36,220,9],[142,103,2],[217,151,3],
      [224,172,2],[309,65,6],[330,83,3],[383,87,3],[430,187,6],[405,217,5],
      [176,216,5],[119,57,3],[83,48,3],[72,211,3],[16,131,3],[459,63,5]];
    for(const [x,y,n] of copses)for(let j=0;j<n;j++)addTree(x+ri(-11,10),y+ri(-5,6),ri(14,31));
    for(const t of trees) {
      const {x,y,h,w}=t;
      poly([[x-w*.38,y-3],[x+w*.15,y-4],[x+w*.73,y+h*.04],
        [x+w*.87,y+h*.11],[x+w*.53,y+h*.15],[x-w*.1,y+2]],'668044');
    }
    function pine(t) {
      const {x,y,w,h,type}=t,p=palettes[type];
      const tx=x+w*.016*(t.flip?-1:1),ty=y-h;
      const X=n=>tx+n*w, Y=n=>ty+n*h;
      const pts=(a,c)=>poly(a.map(([u,v])=>[X(u),Y(v)]),c);
      rect(x-2,y-h*.23,Math.max(3,w*.2|0),Math.max(3,h*.23|0),'574f38');
      rect(x-1,y-h*.15,1,Math.max(2,h*.15|0),'987644');
      rect(x+2,y-1,2,1,'626d40');
      const layers=[[.43,.91,.51],[.29,.74,.44],[.16,.55,.34],[.055,.365,.25],[0,.205,.14]];
      let k=0;
      for(const [a,b,r] of layers) {
        const d=b-a, tip=(hash(t.seed,k)*.12-.06), tooth=hash(t.seed,7+k)*.055;
        pts([[tip,a],[-r*.31,a+d*.38],[-r*.43,a+d*.65],[-r*.68,a+d*.77],
          [-r*.7,a+d*.84],[-r,b-.015],[-r*.72,b+tooth],[-r*.46,b+.009],
          [-r*.33,b+.042],[.01,b+.017],[r*.14,b+.053],[r*.37,b+.014],
          [r*.54,b+.035],[r*.65,b-.002],[r,b+.002],[r*.89,b-.065],
          [r*.56,a+d*.74],[r*.44,a+d*.5]],p[0]);
        pts([[tip,a+.012],[-r*.35,a+d*.47],[-r*.51,a+d*.68],[-r*.88,b-.036],
          [-r*.6,b-.021],[-r*.42,b-.045],[-r*.39,b-.014],[-r*.14,b-.048],
          [r*.055,b-.022],[r*.22,b-.057],[r*.45,b-.021],[r*.61,b-.058],
          [r*.83,b-.041],[r*.54,a+d*.70],[r*.29,a+d*.45]],p[k>2?2:1]);
        pts([[tip,a+.012],[-r*.31,a+d*.44],[-r*.46,a+d*.61],[-r*.8,b-.064],
          [-r*.57,b-.052],[-r*.33,b-.086],[-r*.34,b-.057],[-r*.10,b-.099],
          [r*.05,b-.091],[r*.18,b-.13],[r*.038,a+d*.51]],p[k>1?3:2]);
        pts([[tip,a+.012],[-r*.25,a+d*.39],[-r*.40,a+d*.58],[-r*.57,a+d*.74],
          [-r*.32,a+d*.69],[-r*.15,a+d*.49],[r*.025,a+d*.36]],p[k>2?5:4]);
        if(w>13&&k<3){
          const lx=X(-r*(.48+hash(t.seed,k+4)*.19)), ly=Y(a+d*.82);
          rect(lx,ly,Math.max(1,r*w*.22|0),1,p[3]);
          rect(X(r*.24),Y(a+d*.79),Math.max(1,r*w*.23|0),1,p[2]);
        }
        k++;
      }
    }
    trees.sort((a,b)=>a.y-b.y).forEach(pine);

    // Fortress is modeled as a gate between two crenellated stone towers.
    function castle() {
      const x=446,y=127;
      const r=(a,b,w,h,c)=>rect(x+a,y+b,w,h,c);
      const p=(v,c)=>poly(v.map(([a,b])=>[x+a,y+b]),c);
      const line=(a,b,c,d,col)=>dotLine(x+a,y+b,x+c,y+d,col);
      p([[-33,-4],[-18,-9],[19,-10],[32,-6],[36,1],[26,9],[-12,8]],'69824d');
      p([[-28,-2],[-20,-6],[21,-6],[29,-2],[20,5],[-18,5]],'8e9477');
      p([[-25,0],[-14,-5],[16,-5],[24,-1],[17,3],[-16,3]],'b6b49a');
      p([[-24,-32],[-15,-35],[17,-35],[25,-30],[24,-3],[14,0],[-19,-1],[-24,-5]],'596768');
      r(-21,-31,39,27,'9aa396');r(-18,-29,34,25,'b0b3a0');
      for(let j=0;j<5;j++)for(let i=0;i<5;i++){
        const ax=-20+i*8+(j%2?3:0), by=-28+j*5;
        if(ax>16)continue;r(ax,by,ri(4,7),1,pick(['8f9b91','a0a897','bfc1a9']));
        r(ax+1,by+1,1,2,'9ba496');
      }
      r(-17,-33,33,3,'657c81');r(-17,-34,33,1,'d0cbb3');
      // A deep arched passage and iron portcullis.
      p([[-9,0],[-9,-14],[-7,-19],[-4,-22],[0,-24],[4,-23],[8,-20],[10,-15],[10,0]],'7d8983');
      p([[-7,0],[-7,-14],[-5,-18],[-2,-20],[2,-21],[6,-19],[8,-15],[8,0]],'34474a');
      p([[-5,0],[-5,-12],[-3,-15],[1,-17],[4,-16],[6,-12],[6,0]],'293c3d');
      for(let i=-5;i<8;i+=3)r(i,-17,1,7-Math.abs(i*.32|0),'797e6d');
      r(-6,-14,14,1,'9b947c');
      for(const [ax,by] of [[-10,-12],[-9,-17],[-6,-21],[-2,-23],[3,-23],[7,-20],[9,-16],[10,-11]])
        r(ax,by,3,2,'c4c7b1');
      // Turret stone shafts and layered blue-slate roofs.
      function turret(tx,dy,h,roof=1){
        const top=dy-h;
        p([[tx-8,dy-2],[tx-8,top],[tx-5,top-3],[tx+5,top-3],[tx+8,top],[tx+8,dy-2],[tx+4,dy],[tx-4,dy]],'536766');
        r(tx-7,top,12,h-2,'a4ac9d');r(tx-6,top,4,h-2,'bec0aa');
        r(tx+3,top,3,h-2,'879891');r(tx+6,top,1,h-3,'6c8080');
        for(let j=1;j<h/5;j++){
          r(tx-6,top+j*5,12,1,'94a196');r(tx-6+((j%2)*4),top+j*5+1,1,2,'9da798');
          r(tx-6,top+j*5-1,4,1,'c1c5b1');r(tx+4,top+j*5-1,2,1,'97a59a');
        }
        r(tx-3,top+6,2,6,'596e6c');r(tx-3,top+7,1,4,'33494a');r(tx-3,top+12,3,1,'d0cbb1');
        r(tx-8,dy-4,16,3,'80908a');r(tx-8,dy-4,13,1,'bcc1ab');r(tx-7,dy-1,12,1,'778781');
        if(roof) {
          p([[tx-11,top],[tx-8,top-3],[tx-5,top-10],[tx,top-19],[tx+2,top-18],[tx+5,top-9],[tx+10,top-3],[tx+11,top],[tx+6,top+3],[tx-6,top+3]],'354f5e');
          p([[tx-10,top-1],[tx-6,top-6],[tx-3,top-13],[tx,top-19],[tx+1,top-6],[tx,top+1],[tx-6,top+1]],'5a8393');
          p([[tx,top-18],[tx+5,top-9],[tx+9,top-2],[tx+6,top],[tx+1,top]],'416674');
          for(let k=0;k<3;k++){
            const off=3+k*4, span=8-k*2;r(tx-span,top-off,span,1,k%2?'7599a0':'83a5a7');r(tx+1,top-off+1,span-1,1,'527b88');
          }
          r(tx-8,top,8,1,'80a1a5');r(tx-2,top-18,2,1,'b0beba');
        }
      }
      turret(5,-28,14);
      // Amber standard atop the keep.
      r(4,-76,1,17,'655c48');r(3,-76,1,17,'b7af80');
      p([[5,-76],[11,-75],[16,-73],[22,-74],[19,-70],[23,-68],[15,-68],[10,-71],[5,-71]],'b9823e');
      p([[5,-76],[11,-75],[16,-73],[22,-74],[18,-71],[14,-71],[9,-73],[5,-72]],'f1c05e');
      r(3,-77,2,2,'e4c77e');
      turret(-19,1,29);turret(20,-1,29);
      for(const ax of [-12,11]){
        r(ax,-23,2,4,'796b50');r(ax,-24,2,2,'edb960');r(ax,-26,1,3,'ffda79');
      }
      // Gatehouse shields and split gold-and-russet pennants.
      for(const ax of [-22,18]){
        p([[ax,-20],[ax+5,-20],[ax+5,-10],[ax+3,-12],[ax,-9]],'a6703d');
        r(ax,-20,4,7,'d5a34f');r(ax+1,-18,1,4,'eed284');r(ax,-21,6,1,'6f6754');
      }
      line(-10,2,9,2,'a9a78c');line(-11,4,7,4,'b6b498');
    }
    castle();
    function plinth(x,y) {
      const p=(v,c)=>poly(v.map(([a,b])=>[x+a,y+b]),c);
      p([[-11,-2],[-7,-6],[5,-6],[10,-3],[12,2],[7,6],[-6,6],[-11,3]],'758549');
      p([[-11,-2],[-7,-6],[5,-6],[10,-3],[10,2],[6,5],[-6,5],[-11,2]],'656e60');
      p([[-10,-2],[-6,-5],[5,-5],[9,-2],[9,1],[6,3],[-6,3],[-10,1]],'a29f80');
      p([[-10,-3],[-6,-6],[5,-6],[10,-3],[9,0],[6,2],[-6,2],[-10,0]],'c1bb97');
      p([[-8,-3],[-5,-5],[4,-5],[8,-3],[8,0],[5,1],[-5,1],[-8,-1]],'aca989');
      rect(x-6,y-6,11,1,'d6cba4');rect(x-9,y-4,3,1,'d0c8a2');
      rect(x-7,y+2,2,2,'8e9178');rect(x+5,y+2,1,2,'828a74');
      rect(x-1,y-5,3,7,'868b71');rect(x-4,y-3,9,3,'868b71');
      rect(x,y-5,1,6,'e7ddaf');rect(x-3,y-3,7,1,'e7ddaf');
      rect(x+9,y+3,3,1,'89974e');
    }
    pads.forEach(([x,y])=>plinth(x,y));
    return buffer;
  }
  function draw(ctx) {
    if(!image){
      image=document.createElement('canvas');image.width=W;image.height=H;
      const off=image.getContext('2d'),data=off.createImageData(W,H);
      new Uint32Array(data.data.buffer).set(makeArt());off.putImageData(data,0,0);
    }
    ctx.drawImage(image,0,0);
  }
  window.PineTerrain={W,H,path,pads,draw};
})();
