/* eslint-disable @typescript-eslint/no-var-requires */
import { Bot } from './app.service';
import { EquipInfo } from './types';

export interface NpcData {
  map: string;
  x: number;
  y: number;
  name: string;
}

export interface IoData {
  map: string;
  toMap: string;
  x: number;
  y: number;
  name: string;
  requireLevel?: number;
}

export interface MapEntranceData {
  from: string;
  to: string;
  x: number;
  y: number;
}

export interface GoodData {
  id: string;
  name: string;
  usable?: (v: Bot) => boolean;
  usableAll?: (v: Bot) => boolean;
  junk?: boolean;

  shouldBuy?: (v: Bot) => boolean;
  maxBuyCount?: number;
}

export interface MonsterData {
  name: string;
  hp: number;
  lv: number;
  type: 'm1' | 'm2' | 'm3' | 'm4' | 'herb';
  maps: string[];
  immutableType?: string;

  minLv: number;
  maxLv: number;
  notInPath?: boolean; // 是否战斗寻路中一定不打（防止沙包导致移动失败）
  requireHp?: number;
}

function arrayToMap<T, K>(a: T[], key: (v: T) => K) {
  const ret = new Map<K, T>();
  for (const item of a) {
    ret.set(key(item), item);
  }
  return ret;
}

export const monsters: MonsterData[] = [
  {
    name: '沙包',
    hp: 99999,
    lv: 999,
    type: 'm4',
    maps: ['初始大陆'],
    minLv: 0,
    maxLv: 0,
  },
  {
    name: '黑漆漆的树',
    hp: 1,
    lv: 1,
    type: 'herb',
    maps: ['初始大陆'],
    minLv: 1,
    maxLv: 9,
  },
  {
    name: '小毛虫',
    hp: 10,
    lv: 1,
    type: 'm1',
    maps: ['初始大陆'],
    minLv: 1,
    maxLv: 4,
  },
  {
    name: '蜜蜂',
    hp: 15,
    lv: 1,
    type: 'm1',
    maps: ['初始大陆'],
    minLv: 1,
    maxLv: 4,
  },
  {
    name: '野鸡',
    hp: 30,
    lv: 2,
    type: 'm1',
    maps: ['初始大陆'],
    minLv: 2,
    maxLv: 5,
  },
  {
    name: '山羊',
    hp: 40,
    lv: 3,
    type: 'm1',
    maps: ['初始大陆'],
    minLv: 3,
    maxLv: 6,
  },
  {
    name: '野狗',
    hp: 60,
    lv: 5,
    type: 'm1',
    maps: ['初始大陆'],
    minLv: 5,
    maxLv: 8,
  },
  {
    name: '旋角牛',
    hp: 130,
    lv: 8,
    type: 'm1',
    maps: ['初始大陆'],
    minLv: 8,
    maxLv: 11,
  },
  {
    name: '燕尾蝶',
    hp: 100,
    lv: 4,
    type: 'm2',
    maps: ['初始大陆'],
    minLv: 4,
    maxLv: 10,
  },
  {
    name: '鬣狗',
    hp: 200,
    lv: 7,
    type: 'm2',
    maps: ['初始大陆'],
    minLv: 7,
    maxLv: 13,
  },
  {
    name: '妖狐',
    hp: 1000,
    lv: 10,
    type: 'm3',
    maps: ['初始大陆'],
    minLv: 10,
    maxLv: 999,
  },

  {
    name: '铝矿',
    hp: 1,
    lv: 1,
    type: 'herb',
    maps: ['东部矿坑', '矿坑东', '矿坑北'],
    minLv: 1,
    maxLv: 999,
  },
  {
    name: '铁矿',
    hp: 1,
    lv: 1,
    type: 'herb',
    maps: ['东部矿坑', '矿坑东', '矿坑北'],
    minLv: 1,
    maxLv: 999,
  },

  {
    name: '小僵尸',
    hp: 120,
    lv: 10,
    type: 'm1',
    maps: ['东部矿坑'],
    minLv: 10,
    maxLv: 13,
  },
  {
    name: '蝙蝠',
    hp: 160,
    lv: 10,
    type: 'm1',
    maps: ['东部矿坑'],
    minLv: 10,
    maxLv: 13,
  },
  {
    name: '绿毛僵尸',
    hp: 350,
    lv: 10,
    type: 'm2',
    maps: ['东部矿坑'],
    minLv: 10,
    maxLv: 16,
  },
  {
    name: '僵法尸',
    hp: 660,
    lv: 14,
    type: 'm2',
    maps: ['东部矿坑', '矿坑北'],
    minLv: 14,
    maxLv: 20,
  },

  {
    name: '蛆虫',
    hp: 220,
    lv: 11,
    type: 'm1',
    maps: ['矿坑东'],
    minLv: 11,
    maxLv: 14,
  },
  {
    name: '蝎子',
    hp: 240,
    lv: 12,
    type: 'm1',
    maps: ['矿坑东'],
    minLv: 12,
    maxLv: 15,
  },
  {
    name: '幽魂',
    hp: 560,
    lv: 13,
    type: 'm2',
    maps: ['矿坑东'],
    minLv: 13,
    maxLv: 19,
    immutableType: 'melee',
  },
  {
    name: '大岩蛇',
    hp: 700,
    lv: 16,
    type: 'm2',
    maps: ['矿坑东'],
    immutableType: 'magic',
    minLv: 16,
    maxLv: 22,
  },

  {
    name: '铁链僵尸',
    hp: 500,
    lv: 15,
    type: 'm1',
    maps: ['矿坑北'],
    minLv: 15,
    maxLv: 18,
  },

  {
    name: '尸王',
    hp: 3000,
    lv: 18,
    type: 'm3',
    maps: ['矿坑深处'],
    minLv: 18,
    maxLv: 999,
  },

  {
    name: '血色信徒',
    hp: 530,
    lv: 15,
    type: 'm1',
    maps: ['血色森林'],
    minLv: 15,
    maxLv: 18,
  },
  {
    name: '血色狂热者',
    hp: 840,
    lv: 17,
    type: 'm2',
    maps: ['血色森林'],
    minLv: 17,
    maxLv: 23,
  },
  {
    name: '血色主教',
    hp: 5000,
    lv: 19,
    type: 'm3',
    maps: ['血色森林'],
    minLv: 19,
    maxLv: 999,
  },

  {
    name: '李奥瑞克',
    hp: 12000,
    lv: 20,
    type: 'm4',
    maps: ['守护者大殿'],
    minLv: 20,
    maxLv: 999,
  },

  {
    name: '蜥蜴人',
    hp: 1510,
    lv: 20,
    type: 'm1',
    maps: ['封魔谷'],
    minLv: 20,
    maxLv: 23,
  },
  {
    name: '半兽人',
    hp: 1810,
    lv: 21,
    type: 'm1',
    maps: ['封魔谷'],
    minLv: 21,
    maxLv: 24,
  },
  {
    name: '骷髅战士',
    hp: 1948,
    lv: 22,
    type: 'm1',
    maps: ['封魔谷'],
    minLv: 22,
    maxLv: 25,
  },
  {
    name: '骷髅法师',
    hp: 1810,
    lv: 23,
    type: 'm1',
    maps: ['封魔谷'],
    minLv: 23,
    maxLv: 26,
  },
  {
    name: '骷髅精灵',
    hp: 4000,
    lv: 25,
    type: 'm2',
    maps: ['封魔谷'],
    minLv: 25,
    maxLv: 31,
  },
  {
    name: '半兽人勇士',
    hp: 5000,
    lv: 26,
    type: 'm2',
    maps: ['封魔谷'],
    minLv: 26,
    maxLv: 32,
  },
  {
    name: '半兽人统领',
    hp: 13000,
    lv: 27,
    type: 'm3',
    maps: ['封魔谷'],
    minLv: 27,
    maxLv: 999,
  },
  {
    name: '半人马战行者',
    hp: 20000,
    lv: 28,
    type: 'm3',
    maps: ['封魔谷'],
    minLv: 28,
    maxLv: 999,
  },

  {
    name: '基尔加丹',
    hp: 3000000,
    lv: 9999,
    type: 'm4',
    maps: ['初始大陆'],
    minLv: 30,
    maxLv: 999,
  },
];
export const monsterMap = arrayToMap(monsters, (v) => v.name);

function hpPotion(val) {
  return (bot: Bot) => {
    return bot.player.hp - bot.player.hp_c >= val;
  };
}

export const goods: GoodData[] = [
  {
    id: '622572c968314c57c17abe8f',
    name: '鸡蛋',
    usable: hpPotion(40),
  },
  {
    id: '62304f75ce3754301855fb75',
    name: '金创药',
    usableAll: () => true,
  },
  {
    id: '62304fb4ce3754301855fb7e',
    name: '魔法药',
    usableAll: () => true,
  },
  {
    id: '62304f81ce3754301855fb78',
    name: '强效金创药',
    usableAll: () => true,
  },
  {
    id: '6230b130ce3754301855fc6f',
    name: '太阳水',
    usableAll: hpPotion(80),
  },
  {
    id: '62392f4ef354f91dd4e2b038',
    name: '中杯灵石',
    usableAll: () => true,
  },
  {
    id: '62392f47f354f91dd4e2b035',
    name: '大杯灵石',
    usableAll: () => true,
  },
  {
    id: '6232d7636c521d538ca222bc',
    name: '金条',
    usableAll: () => true,
  },
  {
    id: '62258de568314c57c17abef8',
    name: '初始大陆回城石',
  },
  {
    id: '62256f9c68314c57c17abe72',
    name: '乌木',
  },
  {
    id: '62259df268314c57c17abf1e',
    name: '牛皮',
  },
  {
    id: '62289d2bdeaf7007029c0919',
    name: '铁矿',
  },
  {
    id: '62289d1adeaf7007029c0916',
    name: '铝矿',
  },
  {
    id: '622a347acf325f417e54c88a',
    name: '基础剑法',
  },
  {
    id: '6224e4219962680c308d3277',
    name: '火球术',
  },
  {
    id: '6230d138ce3754301855fde7',
    name: '妖狐',
  },
];

export const goodsRev = [...goods].reverse();

export const goodsMap = arrayToMap(goods, (v) => v.id);

export const npc: NpcData[] = [
  {
    name: '新手接待员',
    map: '初始大陆',
    x: 3,
    y: 3,
  },
  {
    name: '乌树守护者',
    map: '初始大陆',
    x: 5,
    y: 3,
  },
  {
    name: '牛皮狂热者',
    map: '初始大陆',
    x: 20,
    y: 20,
  },
  {
    name: '新手村长',
    map: '初始大陆',
    x: 3,
    y: 5,
  },
  {
    name: '黑猫警长',
    map: '初始大陆',
    x: 7,
    y: 2,
  },
  {
    name: '村民',
    map: '初始大陆',
    x: 7,
    y: 5,
  },
  {
    name: '村民',
    map: '初始大陆',
    x: 7,
    y: 6,
  },
  {
    name: '村民',
    map: '初始大陆',
    x: 8,
    y: 5,
  },
  {
    name: '老奶奶',
    map: '初始大陆',
    x: 10,
    y: 2,
  },
  {
    name: '村民',
    map: '初始大陆',
    x: 8,
    y: 6,
  },
  {
    name: '铝矿商人',
    map: '初始大陆',
    x: 24,
    y: 50,
  },
  {
    name: '铁矿商人',
    map: '初始大陆',
    x: 26,
    y: 50,
  },
];
export const npcMap = arrayToMap(npc, (v) =>
  [v.map, v.x, v.y, v.name].join('-'),
);

export const io: IoData[] = [
  {
    name: '血色森林',
    map: '初始大陆',
    x: 50,
    y: 0,
    toMap: '血色森林',
  },
  {
    name: '东部矿坑',
    map: '初始大陆',
    x: 25,
    y: 50,
    toMap: '东部矿坑',
  },
  {
    name: '封魔谷',
    map: '初始大陆',
    x: 50,
    y: 50,
    toMap: '封魔谷',
    requireLevel: 20,
  },
  {
    name: '初始大陆',
    map: '东部矿坑',
    x: 20,
    y: 0,
    toMap: '初始大陆',
  },
  {
    name: '矿坑东',
    map: '东部矿坑',
    x: 20,
    y: 40,
    toMap: '矿坑东',
  },
  {
    name: '矿坑北',
    map: '东部矿坑',
    x: 0,
    y: 20,
    toMap: '矿坑北',
  },

  {
    name: '东部矿坑',
    map: '矿坑东',
    x: 10,
    y: 0,
    toMap: '东部矿坑',
  },
  {
    name: '神秘通道',
    map: '矿坑东',
    x: 0,
    y: 20,
    toMap: '神秘坑道',
  },

  {
    name: '东部矿坑',
    map: '矿坑北',
    x: 40,
    y: 10,
    toMap: '东部矿坑',
  },
  {
    name: '矿坑深处',
    map: '矿坑北',
    x: 0,
    y: 10,
    toMap: '矿坑深处',
  },

  {
    name: '矿坑北',
    map: '矿坑深处',
    x: 18,
    y: 2,
    toMap: '矿坑北',
  },

  {
    name: '矿坑东',
    map: '神秘坑道',
    x: 1,
    y: 0,
    toMap: '矿坑东',
  },

  {
    name: '初始大陆',
    map: '血色森林',
    x: 0,
    y: 30,
    toMap: '初始大陆',
  },
  {
    name: '守护者大殿',
    map: '血色森林',
    x: 15,
    y: 15,
    toMap: '守护者大殿',
  },

  {
    name: '血色森林',
    map: '守护者大殿',
    x: 15,
    y: 8,
    toMap: '血色森林',
  },

  {
    name: '初始大陆',
    map: '封魔谷',
    x: 1,
    y: 0,
    toMap: '初始大陆',
  },
];
export const ioMap = arrayToMap(io, (v) => [v.map, v.x, v.y, v.name].join('-'));
export const ioRevEdgeMap = new Map<string, IoData[]>();
for (const item of io) {
  if (!ioRevEdgeMap.has(item.toMap)) {
    ioRevEdgeMap.set(item.toMap, [item]);
  } else {
    ioRevEdgeMap.get(item.toMap).push(item);
  }
}

export function findNextIo(start: string, end: string): IoData {
  const queue = [end];
  while (queue.length) {
    const curr = queue.shift();
    for (const edge of ioRevEdgeMap.get(curr) || []) {
      if (edge.map === start) {
        return edge;
      }
      queue.push(edge.map);
    }
  }
  return null;
}

export const PreferAttrConfigs1 = {
  melee: [
    (v: EquipInfo) =>
      ((v.maxAtk || 0) + (v.minAtk || 0)) / 2 + (v.neglectDef || 0),
    (v: EquipInfo) => (v.def || 0) + (v.magicDef || 0),
    (v: EquipInfo) => v.strCritsRate || 0,
    (v: EquipInfo) => v.strCritsDamageRate || 0,
    (v: EquipInfo) =>
      (v.speed || 0) + (v.attackSpeed || 0) + (v.moveSpeed || 0),
    (v: EquipInfo) => v.hpSec || 0,
    (v: EquipInfo) => v.mpSec || 0,
    (v: EquipInfo) => v.hp || 0,
    (v: EquipInfo) => v.attackDistance || 0,
    (v: EquipInfo) => v.vision || 0,
    (v: EquipInfo) => v.mp || 0,
    (v: EquipInfo) => v.lv || 0,
    (v: EquipInfo) => v.quality || 0,
  ],
  magic: [
    (v: EquipInfo) =>
      ((v.maxMagic || 0) + (v.minMagic || 0)) / 2 + (v.neglectMagicDef || 0),
    (v: EquipInfo) => (v.def || 0) + (v.magicDef || 0),
    (v: EquipInfo) => v.strCritsRate || 0,
    (v: EquipInfo) => v.strCritsDamageRate || 0,
    (v: EquipInfo) =>
      (v.speed || 0) + (v.attackSpeed || 0) + (v.moveSpeed || 0),
    (v: EquipInfo) => v.hpSec || 0,
    (v: EquipInfo) => v.mpSec || 0,
    (v: EquipInfo) => v.hp || 0,
    (v: EquipInfo) => v.attackDistance || 0,
    (v: EquipInfo) => v.vision || 0,
    (v: EquipInfo) => v.mp || 0,
    (v: EquipInfo) => v.lv || 0,
    (v: EquipInfo) => v.quality || 0,
  ],
};

export interface TaskData {
  id: string;
  condition?: (b: Bot) => boolean;
  npc: NpcData;
  once?: boolean;
}

export const tasks: TaskData[] = [
  {
    id: '新手任务',
    npc: npcMap.get('初始大陆-3-3-新手接待员'),
    once: true,
  },
  {
    id: '新手任务2',
    npc: npcMap.get('初始大陆-3-5-新手村长'),
    once: true,
  },
  {
    id: '妖狐',
    condition: (v) => v.hasGood('妖狐', 1),
    npc: npcMap.get('初始大陆-10-2-老奶奶'),
    once: true,
  },
  {
    id: '乌木剑',
    condition: (v) => v.hasGood('乌木', 10),
    npc: npcMap.get('初始大陆-5-3-乌树守护者'),
  },
  {
    id: '牛皮甲',
    condition: (v) => v.hasGood('牛皮', 10),
    npc: npcMap.get('初始大陆-20-20-牛皮狂热者'),
  },
  {
    id: '铁矿',
    condition: (v) => v.hasGood('铁矿', 500),
    npc: npcMap.get('初始大陆-26-50-铁矿商人'),
  },
  {
    id: '铝矿',
    condition: (v) => v.hasGood('铝矿', 500),
    npc: npcMap.get('初始大陆-24-50-铝矿商人'),
  },
];

export interface MapData {
  name: string;
  minLvl: number;
  maxLvl: number;
  requireGold?: number;
  requireHpRecovery?: number; // 低于这个值就回城了。
  requireMpRecovery?: number; // 低于这个值就回城了。
  targetHpRecovery: number; // 买到这个值
  targetMpRecovery: number; // 买到这个值
  prior: number; // 0: 打钱；1: 打装备；2:打boss
}

export const maps: MapData[] = [
  {
    name: '初始大陆',
    minLvl: 1,
    maxLvl: 99,
    prior: 0,
    requireHpRecovery: 1,
    requireMpRecovery: 1,
    targetHpRecovery: 50000,
    targetMpRecovery: 50000,
  },
  {
    name: '东部矿坑',
    minLvl: 10,
    maxLvl: 99,
    prior: 0,
    requireGold: 1e4,
    requireHpRecovery: 1000,
    requireMpRecovery: 1000,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },
  {
    name: '矿坑东',
    minLvl: 11,
    maxLvl: 22,
    prior: 1,
    requireGold: 1e6,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },
  {
    name: '矿坑北',
    minLvl: 14,
    maxLvl: 20,
    prior: 1,
    requireGold: 1e6,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },
  {
    name: '矿坑深处',
    minLvl: 18,
    maxLvl: 30,
    prior: 2,
    requireGold: 1e7,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },
  {
    name: '血色森林',
    minLvl: 15,
    maxLvl: 23,
    prior: 1,
    requireGold: 1e6,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },
  {
    name: '守护者大殿',
    minLvl: 20,
    maxLvl: 30,
    prior: 2,
    requireGold: 1e7,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },
  {
    name: '封魔谷',
    minLvl: 20,
    maxLvl: 32,
    prior: 1,
    requireGold: 1e6,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },

  {
    name: '神秘坑道',
    minLvl: 0,
    maxLvl: 0,
    prior: -1,
    targetHpRecovery: 1e6,
    targetMpRecovery: 1e6,
  },
];
export const mapMap = arrayToMap(maps, (v) => v.name);
//TODO: 长眠之地守护者 1根千年尸骨
