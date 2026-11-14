(() => {
  "use strict";
  const chapters = [
    {name:"松风前哨",region:"松风边境",subtitle:"会说话的铜片",brief:"夜巡人阿遥把一块发烫的钟片放在你手上。林子里，所有松鸦同时向西飞去。",mission:"护送最后一队村民进城，保住渡河的路。",after:"最后一辆篷车驶过，钟片忽然响了三短一长。阿遥听出那是河湾摆渡人的求救号。",waves:8,hp:1.06,rate:1.02,gold:150,colors:["#83ab68","#bdd382","#94714d","#839488","#397d62","#76a965","#e1bc7f","#5db9b5","#f7c86b"],
      route:[[22,82],[81,82],[95,93],[96,177],[114,190],[174,190],[190,174],[190,85],[207,70],[262,70],[282,90],[282,174],[298,187],[351,187],[369,169],[369,135],[387,116],[444,116]]},
    {name:"渡鸦河湾",region:"西岸渡口",subtitle:"沉下去的第七艘船",brief:"摆渡人把船一艘艘凿沉，只留下满载难民的第七艘。淤泥里的狼群正追向纤绳。",mission:"守住河堤，让渡船把村民送上北岸。",after:"渡船靠岸时，船底露出半张矿道图。摆渡人指着琥珀色的印记说，失踪的铸钟师去了那里。",waves:8,hp:1.17,rate:.94,gold:155,colors:["#769b74","#a6c998","#886a4c","#839b9c","#397f72","#6ba590","#d9bc8c","#459fbe","#f4c57a"],
      route:[[22,172],[83,172],[99,156],[99,82],[119,66],[165,66],[183,82],[183,174],[204,195],[269,195],[287,177],[287,109],[306,91],[366,91],[382,106],[382,151],[401,166],[444,166]]},
    {name:"琥珀矿道",region:"黄昏采石场",subtitle:"石壁上的名字",brief:"矿壁上刻着被困矿工的名字。铸钟师用自己的锤子卡住了升降机，铁甲兽人已经闻声而来。",mission:"封住矿口，等最后一笼矿工升到地面。",after:"铸钟师交出调音锤，说王城的晨钟曾把地底的热潮压回山腹。钟舌失落在雾泽，唯有灯守记得路。",waves:9,hp:1.24,rate:.90,gold:159,colors:["#a09c55","#d1b96c","#aa6b47","#9f8772","#a05f32","#d99a4a","#e7bc7c","#74abad","#ffc662"],
      route:[[22,94],[73,94],[90,111],[90,177],[105,193],[153,193],[173,174],[173,120],[194,99],[246,99],[264,83],[309,83],[326,99],[326,180],[342,197],[384,197],[401,180],[401,150],[415,137],[444,137]]},
    {name:"雾灯沼泽",region:"翡翠湿地",subtitle:"留一盏灯给归来的人",brief:"灯守已忘了自己的名字，却每天为七个失踪的同伴点灯。第八盏灯下，埋着锈蚀的钟舌。",mission:"抵住雾中的疾狼，护住灯塔与钟舌。",after:"雾散时，七点火光从水面依次亮起。灯守终于松开钟舌，让你把同伴记住的音符带上雪山。",waves:9,hp:1.31,rate:.84,gold:164,colors:["#588a72","#8bac75","#766b52","#708b86","#306759","#5b9680","#c6b47c","#399a90","#bde78b"],
      route:[[22,175],[80,175],[98,155],[98,84],[118,67],[162,67],[178,81],[178,137],[192,151],[236,151],[252,169],[252,199],[271,215],[318,215],[337,195],[337,99],[356,79],[401,79],[416,94],[444,94]]},
    {name:"白脊雪关",region:"北境雪线",subtitle:"断旗后的脚印",brief:"关门冻死在冰里。阿遥认出守门人遗下的红围巾，山另一侧传来哥哥教她吹过的哨音。",mission:"守护解冻的绞盘，为雪线后的幸存者打开关门。",after:"关门抬起，守门人把围巾重新系在妹妹肩上。他带回一张星图，星落遗庭的石刻记着最后一个钟音。",waves:10,hp:1.33,rate:.80,gold:168,colors:["#b0c8c1","#e5ebe0","#8c8d85","#859ca9","#4b7572","#98b8ad","#d6c7a4","#7eb7ca","#ffe3a3"],
      route:[[22,72],[93,72],[108,88],[108,147],[126,164],[169,164],[187,146],[187,89],[202,73],[249,73],[264,90],[264,178],[282,197],[339,197],[355,181],[355,136],[370,119],[444,119]]},
    {name:"星落遗庭",region:"暮星高原",subtitle:"钟上少了一拍",brief:"石刻上的七道刻痕中间，留着一段空白。铸钟师当年把停顿磨掉，晨钟才把山下的生灵越逼越深。",mission:"守住观星台，给阿遥时间拓下完整的乐谱。",after:"阿遥用指节敲出那一拍空白。地底的回声第一次没有咆哮。你把新谱交给铸钟师，约定在王城试响。",waves:10,hp:1.41,rate:.77,gold:172,colors:["#797b93","#a6a0b0","#827080","#887e9d","#535b79","#8589a7","#cfb89b","#8296bc","#d5b7ff"],
      route:[[22,165],[77,165],[96,148],[96,84],[113,66],[154,66],[172,84],[172,180],[192,200],[239,200],[259,181],[259,136],[275,118],[323,118],[341,101],[341,74],[360,57],[401,57],[418,77],[444,77]]},
    {name:"赤烬熔谷",region:"火山腹地",subtitle:"炉火最后的代价",brief:"重铸钟舌需要借用熔谷的地火。赤岩领主从裂缝里站起，胸口嵌着另一块仍在震动的钟片。",mission:"挡住领主的前锋，让铸钟师完成最后一次淬火。",after:"新钟舌出炉，阿遥却放下了弓。那领主每迈一步都痛得发抖。你们带着两块同鸣的钟片，向王城敞开的门赶去。",waves:11,hp:1.54,rate:.74,gold:178,colors:["#8e795f","#b29c73","#965c49","#715d63","#79564c","#9e7657","#dda26b","#e38046","#ffb45a"],
      route:[[22,102],[87,102],[103,117],[103,179],[120,195],[164,195],[184,175],[184,108],[201,93],[247,93],[262,110],[262,169],[278,186],[318,186],[336,168],[336,85],[355,68],[407,68],[425,83],[444,83]]},
    {name:"晨钟王城",region:"王国之心",subtitle:"等山谷回答",brief:"满城人第一次听见地底的脚步。阿遥站上钟楼，你守在门前。天亮之前，必须为整座山谷争取一次回答的机会。",mission:"撑过十二波围城，迎战赤岩领主，完成晨钟合鸣。",after:"领主最后一次举起石拳时，阿遥敲响晨钟。第七声之后，她等了一拍。领主胸前的钟片轻轻回答，裂谷里的热流沿旧河床流回大地。\n\n来年，摆渡人用那第七艘船载孩子去听钟。灯守在船头挂了七盏灯，铸钟师让孩子们自己敲最后一拍。城门从此每天清晨打开，两边的人都能走进来。",waves:12,hp:1.65,rate:.70,gold:184,colors:["#749281","#b3c29b","#8e7966","#7c9299","#446c66","#789988","#d9bc91","#739fbb","#f8d584"],
      route:[[22,175],[78,175],[96,157],[96,84],[115,65],[155,65],[174,85],[174,168],[194,189],[240,189],[257,170],[257,102],[274,84],[319,84],[336,101],[336,171],[354,189],[391,189],[407,173],[407,136],[423,120],[444,120]]}
  ];
  function dist(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1];const k=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-dx*k,p[1]-a[1]-dz*k)}
  function pads(path){
    const candidates=[];
    for(let x=64;x<=405;x+=13)for(let z=49;z<=226;z+=13){
      const p=[x,z],d=Math.min(...path.slice(1).map((b,i)=>dist(p,path[i],b)));
      if(d<23||d>40||Math.hypot(x-path.at(-1)[0],z-path.at(-1)[1])<48)continue;
      let score=0;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let k=0;k<=len;k+=6)if(Math.hypot(a[0]+(b[0]-a[0])*k/len-x,a[1]+(b[1]-a[1])*k/len-z)<63)score++}
      candidates.push({p,score:score-.15*Math.abs(29-d)});
    }
    const chosen=[];for(const o of candidates.sort((a,b)=>b.score-a.score))if(chosen.every(p=>Math.hypot(p[0]-o.p[0],p[1]-o.p[1])>46)){chosen.push(o.p);if(chosen.length===11)break}
    return chosen.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  }
  const paletteKeys=["grass","grass2","soil","rock","tree","tree2","road","water","accent"];
  // Each cache is within a starting tower site's reach and clear of the marching route.
  const supplySites=[
    [[155,54],[395,86]], [[163,90],[363,138]], [[147,90],[391,94]], [[155,42],[407,154]],
    [[67,154],[339,106]], [[115,230],[403,134]], [[63,190],[403,202]], [[127,222],[407,202]]
  ];
  const provinces=[
    {name:"流金沙海",colors:["#ba955e","#e3c78a","#b5744c","#a99076","#817943","#abb05d","#f2dca7","#4faaa7","#ffd479"],formation:"vanguard",scenery:2},
    {name:"月汐海岸",colors:["#76a89b","#bad6bd","#8f8064","#719998","#3a877b","#76b4a1","#efd3a3","#3aacc5","#a9e9ea"],formation:"pack",scenery:1},
    {name:"云上群峰",colors:["#8494af","#c3c8cf","#827988","#8998b1","#4b6975","#8daba3","#decca7","#90bbd9","#e7baff"],formation:"escort",scenery:5}
  ];
  // Alternating horizontal stretches and north/south passes. Bevel each turn for marching models.
  function passRoute(heights,turns){
    const corners=[[22,heights[0]]];
    turns.forEach((x,i)=>corners.push([x,heights[i]],[x,heights[i+1]]));
    corners.push([444,heights.at(-1)]);
    const route=[corners[0]];
    for(let i=1;i<corners.length-1;i++){
      const [x,z]=corners[i];
      for(const [nx,nz] of [corners[i-1],corners[i+1]])route.push([x+12*Math.sign(nx-x),z+12*Math.sign(nz-z)]);
    }
    return [...route,corners.at(-1)];
  }
  const journeys=[
    ["驼铃古驿","沙里的一封信","晨钟重响后的第一个春天，一峰无主的骆驼来到王城。鞍袋里塞着半张盐路图。","守住卸货场，让驿卒读完沙里的来信。","驿卒认出妹妹的笔迹。她在井边画了一枚倒着的月牙。",[82,196,102,188,90],[91,178,276,366]],
    ["月牙枯井","井下的水声","井绳断了三丈，井底却有水声。阿遥系好绳结，把驿卒送进井里。","守住井架，让井下的人接通暗渠。","一股清水推上刻着风车的木牌，顺流漂向西面。",[178,68,152,73,183],[99,183,272,365]],
    ["赤陶风车","逆风的叶片","沙暴将至，四架陶风车只有一架仍在逆转。守风人正在里面，用最后一袋麦子压住闸板。","替守风人守住粮道，等风车换向。","叶片转过半圈，沙里的旗尖露了出来。旗上缝着驿卒家的姓氏。",[104,204,76,164,82],[107,195,293,376]],
    ["金砂隘口","回家的盐队","失踪的盐队就躲在隘口背风处。驿卒的妹妹坚持最后一个出关，她还要给每头骆驼解开辔头。","挡住铁甲护卫与领主，接盐队回家。","妹妹带出一袋海盐。结晶里夹着一枚发蓝的贝壳，靠近耳朵能听到急促的敲击。",[192,88,201,67,142],[85,172,266,363]],
    ["青螺浅滩","贝壳里的敲门声","阿遥循着贝壳的声音来到海边。潮退时，搁浅的船底传来三声敲击。","守住滩头，给船匠时间锯开船底。","舱里是一群送信的孩子。最大的孩子指向潮沟，那里还有第二艘船。",[73,183,94,207,110],[110,192,282,375]],
    ["双月潮沟","迟到的一次落潮","两轮月影在潮沟里碰到一起，水面却停止下降。潮门的锁链被漂来的锚勾住了。","截住疾狼，让潜水员卸下船锚。","水线退去，露出一串穿过养珠场的脚印。",[186,78,163,65,190],[93,185,273,382]],
    ["沉珠长堤","黑暗中的珍珠","长堤上的灯全熄了。养珠人把最后一筐珠母递给阿遥，好让困在堤外的船辨认岸线。","护送点灯人走完整条堤岸。","珠母的微光连成一线，远处的灯船终于回应了四下。",[98,211,85,173,71],[103,192,284,370]],
    ["白帆灯港","给海上的第四盏灯","三盏引航灯全亮，港外仍有一艘船迟迟不进。船长在等风暴里失散的第四艘。","守住港门，直到最后一面白帆靠岸。","第四艘船载着高山信使。他的风筝线断了，山顶的人已经七天没收到粮。",[205,97,193,73,150],[91,181,277,368]],
    ["悬梯云渡","把粮食送上云","信使领你来到垂直的石壁下。云层里垂下一只空篮，篮底写着孩子们的名字。","守住悬梯绞盘，送出第一篮粮。","空篮再落下时，多了一只刻有山路的木鸟。它的喙朝着石桥。",[80,190,66,179,97],[95,187,280,371]],
    ["回声石桥","听见脚步以前","山雾吃掉了所有路标。守桥人贴着石栏听回声，替一队看不见桥面的人指路。","用寒霜和炮火拦住桥头的铁甲先遣。","最后一人过桥，守桥人递上了一把钥匙。钥匙上缠着天文台特有的蓝绳。",[174,63,190,90,202],[106,201,290,383]],
    ["落星观台","朝东的镜子","天文台的镜子全都朝西。阿遥找到一页旧值夜簿，写着日出前应将最后一面转向东方。","守住转镜平台，让第一束光照上主峰。","晨光映出主峰失踪多年的吊桥。桥另一头，有人举起了点灯的火把。",[92,204,84,195,70],[87,175,275,364]],
    ["长明峰顶","万家回灯","群峰的灯架只差最后一盏。盐队带来了油，船长带来了玻璃，山里的孩子们各带来一小段灯芯。","守住峰顶十二波攻势，点亮最后一盏归途灯。","日出前，阿遥把十二段短芯搓成一根，交给最小的孩子。火光沿群峰一路传向海港，又从港口传回沙里的枯井。\n\n第二年春天，那峰老骆驼又来到王城。这回鞍袋里没有求救信，只有一串请大家赴宴的贝壳。阿遥取下弓，关上院门，跟它一起走上了路。",[194,72,207,80,178],[99,188,279,369]]
  ];
  const expeditionFunds=[210,202,225,260,220,235,250,250,245,280,260,320];
  journeys.forEach(([name,subtitle,brief,mission,after,heights,turns],n)=>{
    const province=provinces[Math.floor(n/4)],leg=n%4;
    chapters.push({name,subtitle,brief,mission,after,region:province.name,province,leg,colors:province.colors,
      route:passRoute(heights,turns),waves:9+leg,hp:1.44+n*.025,rate:.79-n*.008,gold:expeditionFunds[n]});
  });
  function findSupplies(s){
    return [s.pads[1],s.pads.at(-2)].map(([ax,az])=>{
      let best=null,bestScore=-Infinity;
      for(let x=58;x<414;x+=5)for(let z=40;z<234;z+=5){
        const near=Math.hypot(x-ax,z-az);
        if(near>53||Math.hypot(x-s.post[0],z-s.post[1])<37||Math.hypot(x-444,z-s.path.at(-1)[1])<40)continue;
        if(s.path.slice(1).some((b,i)=>dist([x,z],s.path[i],b)<20))continue;
        const separation=Math.min(...s.pads.map(([px,pz])=>Math.hypot(x-px,z-pz)));
        if(separation>bestScore){best=[x,z];bestScore=separation}
      }
      return best;
    });
  }
  chapters.forEach((s,index)=>{
    const i=Math.min(index,7);
    s.path=s.route;s.pads=pads(s.path);s.palette=Object.fromEntries(paletteKeys.map((k,j)=>[k,s.colors[j]]));
    const [entry,next]=s.path,dx=next[0]-entry[0],dz=next[1]-entry[1],len=Math.hypot(dx,dz);
    const along=Math.min(40,len*.7),side=15;
    s.post=[entry[0]+(dx*along+dz*side)/len,entry[1]+(dz*along-dx*side)/len];
    s.supplies=(supplySites[index]||findSupplies(s)).map(([x,z],j)=>({x,z,name:j?"辎重箱":"前哨木箱",hp:(j?185:92)+i*(j?28:13),gold:j?30:18}));
    s.formations=[];
    s.lineup=Array.from({length:s.waves},(_,j)=>{
      const q={scout:8+Math.floor((i+j)*.77)};
      if(i||j)q.runner=2+Math.floor((i+j)*.69);
      if(j>=2||(i>=2&&j>=1))q.brute=1+Math.floor((j+Math.max(0,i-1))*.44);
      if((i===2||i===4||i>=6)&&j===s.waves-1){q.boss=1;if(i===7)q.brute+=4}
      if(i>=3&&j%4===2){q.runner+=5;q.scout=Math.max(2,q.scout-3)}
      if(s.province&&j%3===2){
        if(s.province.formation==="escort"&&j>=5)q.boss=1;
        if(s.province.formation==="pack")q.runner+=4+s.leg;
        if(s.province.formation==="vanguard")q.brute+=2+s.leg;
      }
      const formation=q.boss?"escort":s.province&&j%3===2&&s.province.formation==="vanguard"?"vanguard":(j===1||j>=2&&j%3===2)?"pack":q.brute&&j%3===1?"vanguard":"mixed";
      if(formation==="pack")q.runner+=(j===1?2:4)+Math.floor(i/2);
      if(formation==="vanguard")q.brute+=2;
      if(i<3&&j===s.waves-1){q.runner+=6;q.brute+=3}
      s.formations.push(formation);
      return q;
    });
  });
  const items={
    hail:{name:"寒潮敕令",kind:"card",price:55,sigil:"snow",desc:"冻结全场敌军 4 秒。只对出牌时在场的敌人有效。"},
    blaze:{name:"天火齐射",kind:"card",price:85,sigil:"fire",desc:"对所有在场敌人造成 72 点伤害，首领承受一半。"},
    mend:{name:"城门工契",kind:"card",price:65,sigil:"shield",desc:"修复 5 点城门生命，最高恢复至 20 点。"},
    pine:{name:"青松哨卫",kind:"skin",price:0,sigil:"pine",color:"#63b397",desc:"阿遥身穿玉色交领长衣，腰系朱红。搭配松绿塔顶与青金旗帜。"},
    dawn:{name:"赤霞仪仗",kind:"skin",price:185,sigil:"sun",color:"#e78365",desc:"阿遥换上赤霞金边长衣，搭配朱红塔顶、鎏金旗帜与琥珀色法晶。永久拥有。"},
    night:{name:"星夜守望",kind:"skin",price:245,sigil:"moon",color:"#ab91db",desc:"阿遥换上夜紫绣衣，搭配紫晶尖塔、银蓝纹饰与夜色城旗。永久拥有。"}
  };
  window.PineCampaign={chapters,items};
})();
