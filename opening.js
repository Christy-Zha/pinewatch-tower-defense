(() => {
  'use strict';
  const rewards=[
    {name:'流星箭雨',desc:'永久解锁阿遥的主动技。每局满能量开场，击杀敌人重新充能。',next:'下一站：渡鸦河湾。狼群会集中冲锋，留一轮箭雨守住渡口。'},
    {name:'霜火共鸣',desc:'永久生效：炮塔命中被减速或冻结的敌人，伤害提高 30%。寒霜与炮火可以组成防线。',next:'下一站：琥珀矿道。碎岩督军半血狂暴，并召来六只疾狼。'},
    {name:'破阵战旗',desc:'永久生效：施放箭雨后，全体防御塔攻速提高 30%，持续 6 秒。',next:'序章完成。带着箭雨、霜火共鸣与战旗，向雾灯沼泽出发。'}
  ];
  const plans=[
    {gold:180,hp:1,rate:.76,mission:'守住五波进攻；试试在敌群聚集时施放阿遥的箭雨。',
      waves:[{scout:9},{scout:14},{scout:10,runner:6},{scout:12,brute:2},{scout:18,runner:9,brute:3}],
      formations:['mixed','mixed','pack','vanguard','pack'],
      names:['第一声号角','密林涌潮','追车的狼群','铁甲试探','最后一辆篷车'],
      hints:['先在弯道建塔，箭雨已备好。','等敌人聚成一群再放箭雨。','疾狼耐炮击，用快箭截住。','两名铁甲打头阵，炮火能穿甲。','最后一波！不要让狼群追上篷车。']},
    {gold:160,hp:1.28,rate:.72,mission:'守住六波狼群冲锋；清理物资可获得额外军费，补上后段防线。',
      waves:[{scout:6,runner:6},{runner:13},{scout:9,brute:3},{runner:18,scout:4},{brute:5,runner:10},{runner:22,brute:5,scout:8}],
      formations:['mixed','pack','vanguard','pack','vanguard','pack'],
      names:['断绳的渡船','第一轮狼潮','重甲踏上河堤','两岸追击','掩护登船','渡口决战'],
      hints:['让快箭守住最后一个弯道。','狼群集中出现，寒霜能拖慢冲锋。','炮塔对付重甲，别只堆箭塔。','箭雨的减速能给防线争取时间。','后半段也要留下火力。','守住这次狼潮，解锁霜火共鸣。']},
    {gold:175,hp:1.42,rate:.70,mission:'守住七波矿道攻势。督军半血时会狂暴，留好箭雨对付援军。',
      waves:[{scout:10,brute:2},{runner:10,brute:3},{brute:5,scout:8},{runner:14,brute:4},{brute:7,scout:12},{runner:18,brute:5},{boss:1,brute:10,runner:12}],
      formations:['vanguard','mixed','vanguard','pack','vanguard','pack','escort'],
      names:['矿门震动','碎石中的脚步','铁甲运输队','被惊醒的疾狼','督军的先锋','升降机最后一程','碎岩督军'],
      hints:['霜火共鸣：先减速，再用炮火重击。','选好本局强化，准备面对铁甲。','冻住铁甲，能让箭塔重新打出伤害。','不要把箭雨浪费在零散敌人身上。','升级炮塔，准备击穿督军护甲。','督军下一波登场，补齐火力。','半血狂暴：六只疾狼会从入口驰援。']}
  ];
  plans.forEach((p,i)=>{
    const s=PineCampaign.chapters[i];
    s.legacy={lineup:s.lineup,formations:s.formations,waves:s.waves,gold:s.gold,hp:s.hp,rate:s.rate,mission:s.mission};
    Object.assign(s,{gold:p.gold,hp:p.hp,rate:p.rate,mission:p.mission,waves:p.waves.length,lineup:p.waves,formations:p.formations,
      opening:{names:p.names,hints:p.hints,reward:rewards[i],boss:i===2}});
  });
  PineCampaign.openingRewards=rewards;
})();
