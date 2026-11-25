(() => {
  "use strict";
  const colors=new Map(),TAU=Math.PI*2;
  function rgb(hex){if(!colors.has(hex)){const n=parseInt(hex.slice(1),16);colors.set(hex,[(n>>16)/255,((n>>8)&255)/255,(n&255)/255])}return colors.get(hex)}
  class Mesh {
    constructor(){this.vertices=[];this.smoothing=null}
    smooth(){
      this.smoothing=new Map();
    }
    finishSmooth(){
      if(!this.smoothing)return;
      for(const {normal,indices,base} of this.smoothing.values()){
        const [x,y,z]=normal,n=Math.hypot(x,y,z)||1;
        const key=(-.40*x+.68*y+.60*z)/n,rim=Math.max(0,(-z*.85+x*.5)/n);
        const lit=.72+.37*Math.max(-.48,key)+.12*rim;
        for(const i of indices)for(let k=0;k<3;k++)this.vertices[i+k]=Math.min(1,base[k]*lit);
      }
      this.smoothing=null;
    }
    face(points,color){
      if(points.length<3)return;const [a,b,c]=points,u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
      let x=u[1]*v[2]-u[2]*v[1],y=u[2]*v[0]-u[0]*v[2],z=u[0]*v[1]-u[1]*v[0];const len=Math.hypot(x,y,z)||1;
      if(y<0&&Math.abs(y)>.6*len){x=-x;y=-y;z=-z}
      const lit=.74+.30*Math.max(-.35,(-.57*x+.74*y+.36*z)/len),t=rgb(color).map(k=>Math.min(1,k*lit));
      for(let j=1;j<points.length-1;j++)for(const p of [a,points[j],points[j+1]]){
        if(this.smoothing){
          const key=p.map(k=>Math.round(k*950)).join(",")+color;
          let group=this.smoothing.get(key);
          if(!group){group={normal:[0,0,0],indices:[],base:rgb(color)};this.smoothing.set(key,group)}
          group.normal[0]+=x/len;group.normal[1]+=y/len;group.normal[2]+=z/len;group.indices.push(this.vertices.length+3);
        }
        this.vertices.push(...p,...t);
      }
    }
    box(x,y,z,w,h,d,color,angle=0){
      const s=Math.sin(angle),c=Math.cos(angle),p=[];
      for(const b of [-1,1])for(const [a,f] of [[-1,-1],[1,-1],[1,1],[-1,1]])p.push([x+a*w*c/2+f*d*s/2,y+b*h/2,z-a*w*s/2+f*d*c/2]);
      for(const ix of [[4,7,6,5],[0,1,2,3],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]])this.face(ix.map(i=>p[i]),color);
    }
    frustum(x,y,z,r0,r1,h,n,color,angle=0){
      const lo=[],hi=[];for(let i=0;i<n;i++){const a=angle+i*TAU/n,c=Math.cos(a),s=Math.sin(a);lo.push([x+c*r0,y,z+s*r0]);hi.push([x+c*r1,y+h,z+s*r1])}
      for(let i=0;i<n;i++){const j=(i+1)%n;this.face(r1?[lo[i],hi[i],hi[j],lo[j]]:[lo[i],hi[i],lo[j]],color)}
      if(r1)this.face(hi.reverse(),color);if(r0)this.face(lo,color);
    }
    ring(x,z,r,y,col,width){
      for(let i=0;i<72;i++){if(i%5===4)continue;const a=i*TAU/72,b=(i+1)*TAU/72;
        this.face([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x+Math.cos(b)*(r-width),y,z+Math.sin(b)*(r-width)],[x+Math.cos(a)*(r-width),y,z+Math.sin(a)*(r-width)]],col)}
    }
  }
  // The same view transform positions geometry and the accessible build-site buttons.
  class Renderer{
    static inputPoint(e){
      return document.documentElement.classList.contains("sideways-battle")
        ? {x:e.clientY,y:innerWidth-e.clientX} : {x:e.clientX,y:e.clientY};
    }
    constructor(canvas){
      this.canvas=canvas;this.stage=null;this.staticData=null;this.models=new Map();this.dirty=true;this.resetCamera();
      // The battlefield renders on demand while paused or in menus; keep that frame on WebKit.
      const gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:canvas.id==="field"});
      this.gl=gl;if(gl)this.initGL();else{this.ctx=canvas.getContext("2d");this.softwareCache=null}
    }
    initGL(){
      const gl=this.gl,p=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,`attribute vec3 pos;attribute vec3 color;uniform vec4 view;uniform vec3 scale;uniform vec3 center;uniform vec4 model;uniform mediump vec3 appearance;varying vec3 tint;
        void main(){float ca=view.x,sa=view.y,cp=view.z,sp=view.w;float cs=cos(model.w),sn=sin(model.w);vec3 q=vec3(pos.x*cs+pos.z*sn,pos.y,pos.z*cs-pos.x*sn)*appearance.x+model.xyz-center;
        float front=q.x*sa+q.z*ca;float depth=front*cp+q.y*sp;gl_Position=vec4((q.x*ca-q.z*sa)*scale.x,(q.y*cp-front*sp)*scale.y+scale.z,-depth/650.,1.);tint=mix(color,vec3(1.,.93,.80),appearance.y);}`],[gl.FRAGMENT_SHADER,`precision mediump float;uniform mediump vec3 appearance;varying vec3 tint;void main(){gl_FragColor=vec4(tint,appearance.z);}`]]){
          const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh);gl.deleteShader(sh)}
      gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);
      this.appearanceU=gl.getUniformLocation(p,"appearance");
      this.pos=gl.getAttribLocation(p,"pos");this.col=gl.getAttribLocation(p,"color");this.viewU=gl.getUniformLocation(p,"view");this.scaleU=gl.getUniformLocation(p,"scale");this.modelU=gl.getUniformLocation(p,"model");this.centerU=gl.getUniformLocation(p,"center");gl.enableVertexAttribArray(this.pos);gl.enableVertexAttribArray(this.col);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
    }
    data(mesh,dynamic=false){
      mesh.finishSmooth();const upload=(list,stride)=>{const vertices=new Float32Array(list);if(!this.gl)return {vertices,stride};const gl=this.gl,buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,vertices,dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);return {buf,count:vertices.length/stride,stride}};
      return upload(mesh.vertices,6);
    }
    release(o){if(o?.buf)this.gl.deleteBuffer(o.buf)}
    set(stage,index,skin,cleared){
      const wide=this.canvas.id==="field"&&document.documentElement.classList.contains("phone-battle");
      if(this.stage===stage&&this.skin===skin&&this.wide===wide&&this.cleared===cleared&&this.clearCount===(cleared?.size||0))return;
      this.cleared=cleared;this.clearCount=cleared?.size||0;
      const m=new Mesh();this.terrain=PineScenery.build(m,stage,index,skin,wide,cleared);this.release(this.staticData);this.staticData=this.data(m);
      this.stage=stage;this.skin=skin;this.wide=wide;this.softwareCache=null;this.dirty=true;
      if(wide){
        const points=[...stage.path,...stage.pads,...stage.supplies.map(c=>[c.x,c.z]),stage.post];
        const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
        this.frameBounds=[Math.min(...xs)-14,Math.max(...xs)+14,Math.min(...zs)-8,Math.max(...zs)+8];
      }
    }
    resetCamera(){
      const portrait=this.canvas.id==="field"&&window.matchMedia("(max-width:600px) and (orientation:portrait)").matches;
      this.angle=portrait ? -1.43 : -.34;this.pitch=portrait ? .92 : .69;this.zoom=1;this.center=[240,5,142];this.viewHeight=0;this.frontline=false;this.dirty=true;
      if(this.wide&&this.frameBounds){
        const [l,r,t,b]=this.frameBounds;
        this.angle=0;this.pitch=1.08;this.center=[(l+r)/2,9,(t+b)/2];
      }
    }
    follow(ranger){this.frontline=true;this.center=[ranger.x,13,ranger.z];this.viewHeight=66;this.pitch=.37;this.angle=-.65;this.dirty=true}
    camera(){
      const cssW=Math.max(1,this.canvas.clientWidth),cssH=Math.max(1,this.canvas.clientHeight),dpr=Math.min(1.65,window.devicePixelRatio||1);
      const w=Math.round(cssW*dpr),h=Math.round(cssH*dpr);
      if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.dirty=true}
      this.ca=Math.cos(this.angle);this.sa=Math.sin(this.angle);this.cp=Math.cos(this.pitch);this.sp=Math.sin(this.pitch);
      const width=Math.abs(this.ca)*468+Math.abs(this.sa)*266,deep=Math.abs(this.sa)*468+Math.abs(this.ca)*266;
      this.scale=this.viewHeight?h/this.viewHeight:Math.min(w/(width+4),h/(deep*this.sp+52*this.cp+4))*this.zoom;
      if(this.wide&&!this.viewHeight){
        const [l,r,t,b]=this.frameBounds,dx=r-l,dz=b-t;
        const spanX=Math.abs(this.ca)*dx+Math.abs(this.sa)*dz;
        const spanY=(Math.abs(this.sa)*dx+Math.abs(this.ca)*dz)*this.sp+30*this.cp;
        this.scale=Math.min(w/spanX,(h-Math.min(h*.23,76*dpr))/spanY)*this.zoom;
      }
      this.w=w;this.h=h;this.offset=this.viewHeight?.50:.51;this.dpr=dpr;
    }
    project(x,y,z){
      x-=this.center[0];y-=this.center[1];z-=this.center[2];const front=x*this.sa+z*this.ca;return [this.w/2+(x*this.ca-z*this.sa)*this.scale,this.h*this.offset+(front*this.sp-y*this.cp)*this.scale,front*this.cp+y*this.sp];
    }
    ground(px,py){
      const side=(px-this.w/2)/this.scale;
      const front=((py-this.h*this.offset)/this.scale-this.center[1]*this.cp)/this.sp;
      return [this.center[0]+side*this.ca+front*this.sa,this.center[2]-side*this.sa+front*this.ca];
    }
    drawData(data,x=0,y=0,z=0,yaw=0,size=1,flash=0,alpha=1){
      if(!data)return;
      if(this.gl){const gl=this.gl,b=data.stride*4;
        gl.bindBuffer(gl.ARRAY_BUFFER,data.buf);gl.vertexAttribPointer(this.pos,3,gl.FLOAT,false,b,0);gl.vertexAttribPointer(this.col,3,gl.FLOAT,false,b,12);
        gl.uniform4f(this.modelU,x,y,z,yaw);gl.uniform3f(this.appearanceU,size,flash,alpha);
        if(alpha<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false)}
        gl.drawArrays(gl.TRIANGLES,0,data.count);
        if(alpha<1){gl.disable(gl.BLEND);gl.depthMask(true)}
      }else this.raster(data.vertices,x,y,z,yaw,data.stride,size,flash,alpha);
    }
    // A depth-tested software path also works on machines where WebGL is disabled.
    raster(v,ox,oy,oz,yaw,stride,size=1,flash=0,alpha=1){
      const w=this.w,h=this.h,s=Math.sin(yaw),c=Math.cos(yaw),rgba=this.pixels,depth=this.depth;
      for(let n=0;n<v.length;n+=stride*3){const pts=[];
        for(let i=n;i<n+stride*3;i+=stride)pts.push(this.project((v[i]*c+v[i+2]*s)*size+ox,v[i+1]*size+oy,(v[i+2]*c-v[i]*s)*size+oz));
        const [a,b,d]=pts,den=(b[1]-d[1])*(a[0]-d[0])+(d[0]-b[0])*(a[1]-d[1]);if(Math.abs(den)<.001)continue;
        const color=(255<<24)|(Math.round(v[n+5]*255)<<16)|(Math.round(v[n+4]*255)<<8)|Math.round(v[n+3]*255);
        const l=Math.max(0,Math.ceil(Math.min(a[0],b[0],d[0]))),r=Math.min(w-1,Math.floor(Math.max(a[0],b[0],d[0]))),top=Math.max(0,Math.ceil(Math.min(a[1],b[1],d[1]))),bottom=Math.min(h-1,Math.floor(Math.max(a[1],b[1],d[1])));
        for(let j=top;j<=bottom;j++)for(let i=l;i<=r;i++){const u=((b[1]-d[1])*(i-d[0])+(d[0]-b[0])*(j-d[1]))/den,vv=((d[1]-a[1])*(i-d[0])+(a[0]-d[0])*(j-d[1]))/den,t=1-u-vv;if(u<0||vv<0||t<0)continue;const z=a[2]*u+b[2]*vv+d[2]*t,k=j*w+i;if(z<depth[k])continue;if(alpha===1)depth[k]=z;const background=rgba[k];
          if(v[n+3]!==v[n+stride+3]||v[n+3]!==v[n+2*stride+3]||v[n+4]!==v[n+stride+4]||v[n+4]!==v[n+2*stride+4]||v[n+5]!==v[n+stride+5]||v[n+5]!==v[n+2*stride+5]){
            const a=n+3,b=n+stride+3,c=n+2*stride+3;
            rgba[k]=0xff000000|((255*(v[a+2]*u+v[b+2]*vv+v[c+2]*t))<<16)|((255*(v[a+1]*u+v[b+1]*vv+v[c+1]*t))<<8)|(255*(v[a]*u+v[b]*vv+v[c]*t));
          }else rgba[k]=color;
          if(flash||alpha<1){const pixel=rgba[k];let mixed=0xff000000;for(let channel=0;channel<3;channel++){const shift=channel*8,base=(pixel>>>shift)&255,lit=base*(1-flash)+[255,237,204][channel]*flash;mixed|=Math.round(lit*alpha+((background>>>shift)&255)*(1-alpha))<<shift}rgba[k]=mixed}
        }
      }
    }
    model(key,build){if(!this.models.has(key)){if(this.models.size>=75){const oldest=this.models.keys().next().value;this.release(this.models.get(oldest));this.models.delete(oldest)}const m=new Mesh();build(m);this.models.set(key,this.data(m))}return this.models.get(key)}
    begin(){
      this.camera();const gl=this.gl;
      if(gl){gl.viewport(0,0,this.w,this.h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform4f(this.viewU,this.ca,this.sa,this.cp,this.sp);gl.uniform3f(this.scaleU,2*this.scale/this.w,2*this.scale/this.h,1-2*this.offset);gl.uniform3f(this.centerU,...this.center);this.drawData(this.staticData)}
      else{
        const key=[this.w,this.h,this.angle,this.pitch,this.zoom,this.viewHeight,...this.center].join("/");
        if(this.softwareCache!==key){this.frame=this.ctx.createImageData(this.w,this.h);this.pixels=new Uint32Array(this.frame.data.buffer);this.depth=new Float32Array(this.w*this.h).fill(-Infinity);this.drawData(this.staticData);this.bgColor=this.pixels.slice();this.bgDepth=this.depth.slice();this.softwareCache=key}
        this.pixels.set(this.bgColor);this.depth.set(this.bgDepth);
      }
    }
    finish(){if(!this.gl)this.ctx.putImageData(this.frame,0,0);this.dirty=false}
    character(id,pose,phase,skin,frozen=false,inBattle=false){
      const isTower=!!PineGame.towers[id],frames=isTower?1:pose==="idle"?8:id==="ranger"?20:12;
      const f=Math.floor((((phase%1)+1)%1)*frames+1e-7)%frames,key=["character",id,pose,f,skin,frozen,inBattle].join("/");
      return this.model(key,m=>{
        if(isTower)PineFigures.tower(m,id,0,0,2,skin);
        else if(id==="ranger"){m.smooth();PineRanger.draw(m,pose,f/frames,skin,inBattle)}
        else {if(id==="brute"||id==="boss")m.smooth();PineInvaders.draw(m,id,f/frames,frozen,pose)}
      });
    }
    specimen(id,skin,pose,phase,yaw=0,bust=false){
      const heights={ranger:31,scout:15,runner:12,brute:21,boss:28,arrow:33,cannon:25,frost:34,storm:33,venom:27,ballista:25},h=heights[id];
      this.center=[0,bust?(id==="ranger"?25.0:h*.76):h*.49,0];this.viewHeight=bust?(id==="ranger"?12.0:h*.59):h*(id==="runner"?1.68:1.16);this.begin();
      this.drawData(this.character(id,pose,phase,skin),0,0,0,yaw);this.finish();
    }
    render(g,selected,choice,hover){
      this.begin();
      const effect=new Mesh();
      const [fx,fz]=g.furnaceSite,level=g.camp.level;
      this.drawData(this.model("camp-furnace/"+level,m=>{
        m.frustum(0,0,0,5.4,4.9,2.4,8,"#696a61");
        m.frustum(0,2.4,0,4.5,3.8,6+level,8,"#7f5240");
        m.frustum(0,8+level,0,4.2,3.8,1.4,8,"#b89260");
        for(let n=0;n<level;n++)m.box(-3+n*3,9+level,0,1.8,3.8,2,"#675246");
        m.box(0,4,3.9,3.8,3,.7,"#392f28");
      }),fx,1,fz);
      const flicker=g.cold ? .6 : 1+Math.sin(g.time*6)*.12;
      effect.frustum(fx,10+level,fz,g.cold?1:2.4,0,6*flicker,5,g.cold?"#d89366":"#ffbf58");
      effect.box(fx,5,fz+4.3,2.8,2.4,.5,g.cold?"#806052":"#ffc45b");
      if(g.phase==="fight"&&g.wave%3===0){
        for(let i=0;i<42;i++){
          const x=8+(i*137+g.time*27)%460,z=20+(i*83+g.time*6)%235;
          const height=35-((i*17+g.time*16)%32);
          effect.box(x,height,z,.65,.95,1.8,"#e1eef0",.75);
        }
      }
      g.supplies.forEach((c,j)=>{
        if(!g.supplyHealth[j])return;
        this.drawData(this.model("supply/"+j,m=>{
          const w=j?15:12,h=j?9:7;
          m.box(0,h/2,0,w,h,10,"#985c36");
          for(const z of [-3.4,0,3.4])m.box(0,h+.45,z,w+1,.9,3.1,"#cf9454");
          for(const x of [-w*.32,w*.32])m.box(x,h/2+.4,0,1.3,h+1.2,10.6,"#715335");
          m.box(0,h*.62,5.3,2.3,2.8,1,"#ffd379");
        }),c.x,2.9,c.z,.15);
        if(g.markedSupply===j)effect.ring(c.x,c.z,12,3,"#ffda75",2);
      });
      g.towers.forEach((t,i)=>{if(!t)return;const [x,z]=g.pads[i],key=[t.type,t.level,this.skin].join("/");
        this.drawData(this.model(key,m=>PineFigures.tower(m,t.type,0,0,t.level,this.skin)),x,1.4+(t.kick||0)*5,z,t.yaw||0);
        if(t.type==="cannon"&&t.kick>.12){const yaw=t.yaw||0,px=x+Math.sin(yaw)*10,pz=z+Math.cos(yaw)*10;effect.frustum(px,22,pz,3.4,0,6,6,"#ffe9ae");effect.box(px,23,pz,2,2,9,"#fff4c8",yaw)}
      });
      const r=g.ranger,aiming=g.phase==="fight"&&(r.target!==null||r.released);
      this.drawData(this.character("ranger",aiming?"shoot":"idle",aiming?r.cycle:g.time*.33,this.skin,false,aiming),r.x,1,r.z,r.yaw);
      for(const e of g.enemies){
        const frozen=e.frozen>0||e.slow>0,hit=Math.max(0,(e.flash||0)/.22),recoil=Math.sin(hit*Math.PI),pose=hit>.5?(e.hitPose??e.d):e.d,phase=e.frozen>0?0:pose/(e.type==="runner"?16:12)+e.id*.13;
        this.drawData(this.character(e.type,"walk",phase,this.skin,frozen),e.x+(e.recoilX||0)*recoil,1+recoil*.8,e.y+(e.recoilZ||0)*recoil,e.yaw,1,Math.min(.9,hit*1.2));
        if(e.enraged)effect.ring(e.x,e.y,14,2,"#ff8150",2.2);
        if(e.hp<e.maxHp){const h=e.type==="boss"?30:e.type==="brute"?21:18,frac=Math.max(0,e.hp/e.maxHp),ang=-this.angle;
          effect.box(e.x,h,e.y,13,1.6,1.1,"#3b3236",ang);if(frac>0)effect.box(e.x+(frac-1)*6*this.ca,h+.15,e.y-(frac-1)*6*this.sa,12*frac,1.7,1.4,frozen?"#a9f8ff":"#e5cf82",ang)}
      }
      for(const d of g.deaths||[]){const f=1-d.ttl/d.max;this.drawData(this.character(d.type,"walk",d.phase,this.skin),d.x,1+Math.sin(f*Math.PI)*3,d.z,d.yaw+f*.6,Math.max(.12,1-f*.85),Math.max(0,1-f*4),Math.max(0,1-f))}
      for(const s of g.shots){const f=1-s.ttl/s.max,x=s.x+(s.tx-s.x)*f,z=s.y+(s.ty-s.y)*f,y=s.type==="volley"?55*(1-f)+3:25+(6-25)*f+(s.type==="cannon"?13:2)*Math.sin(f*Math.PI);const arrow=s.type==="arrow"||s.type==="ranger"||s.type==="ballista"||s.type==="volley";if(s.type==="storm"){const dx=s.tx-s.x,dz=s.ty-s.y;for(let i=0;i<6;i++){const a=i/6,b=(i+1)/6,j=i%2?1.5:-1.5;effect.box(s.x+dx*(a+b)/2+j,(s.arc?8:23)+(8-(s.arc?8:23))*(a+b)/2,s.y+dz*(a+b)/2,1,1,Math.hypot(dx,dz)/6+1,"#d5bcff",Math.atan2(dx,dz))}continue}effect.box(x,y,z,arrow?.8:2,arrow?.8:2,arrow?9:3,s.type==="venom"?"#9ae453":s.type==="frost"?"#b8ffff":arrow?"#ffe4a3":"#352c29",Math.atan2(s.tx-s.x,s.ty-s.y))}
      for(const p of g.impacts||[]){const f=1-p.ttl/p.max;effect.ring(p.x,p.z,Math.max(1,p.size*f),2.8,p.color,Math.max(.4,2*(1-f)))}
      for(const p of g.particles){const size=Math.max(.3,p.ttl*4);effect.box(p.x,3+p.ttl*12,p.y,size,size,size,p.color)}
      const active=selected??hover;if(active!=null&&g.towers[active]&&!g.ended){const t=g.towers[active],[x,z]=g.pads[active];effect.ring(x,z,PineGame.levelStats(t.type,t.level).range,2.6,"#ffe39d",2)}
      if(effect.vertices.length){const data=this.data(effect,true);this.drawData(data);this.release(data)}
      this.finish();
    }
  }
  window.PineRenderer=Renderer;
})();
