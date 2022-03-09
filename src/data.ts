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
  dropGoods?: string[];
  dropEquips?: string[];

  minLv: number;
  maxLv: number;
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
    name: '黑漆漆的树',
    hp: 1,
    lv: 1,
    type: 'herb',
    maps: ['初始大陆'],
    dropGoods: ['乌木'],
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
    maxLv: 6,
  },
  {
    name: '蜜蜂',
    hp: 15,
    lv: 1,
    type: 'm1',
    maps: ['初始大陆'],
    dropGoods: ['小血瓶', '小蓝瓶'],
    minLv: 1,
    maxLv: 6,
  },
  {
    name: '野鸡',
    hp: 30,
    lv: 2,
    type: 'm1',
    maps: ['初始大陆'],
    dropGoods: ['小血瓶', '小蓝瓶', '鸡蛋'],
    minLv: 2,
    maxLv: 7,
  },
  {
    name: '山羊',
    hp: 40,
    lv: 3,
    type: 'm1',
    maps: ['初始大陆'],
    dropEquips: ['小血瓶', '小蓝瓶', '羊角盔'],
    minLv: 3,
    maxLv: 8,
  },
  {
    name: '野狗',
    hp: 100,
    lv: 5,
    type: 'm1',
    maps: ['初始大陆'],
    dropEquips: ['小血瓶', '小蓝瓶', '犬齿项链'],
    minLv: 5,
    maxLv: 10,
  },
  {
    name: '旋角牛',
    hp: 130,
    lv: 8,
    type: 'm1',
    maps: ['初始大陆'],
    dropGoods: ['小血瓶', '小蓝瓶', '牛皮'],
    dropEquips: ['牛角戒指'],
    minLv: 8,
    maxLv: 13,
  },
  {
    name: '燕尾蝶',
    hp: 100,
    lv: 4,
    type: 'm2',
    maps: ['初始大陆'],
    dropGoods: ['小血瓶', '小蓝瓶'],
    dropEquips: ['羊角盔', '丝质短袍'],
    minLv: 4,
    maxLv: 14,
  },
  {
    name: '鬣狗',
    hp: 130,
    lv: 7,
    type: 'm2',
    maps: ['初始大陆'],
    dropGoods: ['小血瓶', '小蓝瓶'],
    dropEquips: ['羊角盔', '丝质短袍', '犬齿项链', '青铜剑'],
    minLv: 7,
    maxLv: 17,
  },
  {
    name: '妖狐',
    hp: 1000,
    lv: 10,
    type: 'm3',
    maps: ['初始大陆'],
    dropGoods: ['中血瓶'],
    dropEquips: ['妖狐之眼'],
    minLv: 10,
    maxLv: 999,
  },

  {
    name: '铝矿',
    hp: 1,
    lv: 1,
    type: 'herb',
    maps: ['东部矿坑', '矿坑东'],
    dropGoods: ['铝矿'],
    minLv: 1,
    maxLv: 999,
  },
  {
    name: '铁矿',
    hp: 1,
    lv: 1,
    type: 'herb',
    maps: ['东部矿坑', '矿坑东'],
    dropGoods: ['铁矿'],
    minLv: 1,
    maxLv: 999,
  },

  {
    name: '小僵尸',
    hp: 120,
    lv: 10,
    type: 'm1',
    maps: ['东部矿坑'],
    dropGoods: ['中血瓶', '中蓝瓶'],
    dropEquips: ['铁腰带'],
    minLv: 10,
    maxLv: 15,
  },
  {
    name: '蝙蝠',
    hp: 160,
    lv: 10,
    type: 'm1',
    maps: ['东部矿坑'],
    dropGoods: ['中蓝瓶'],
    dropEquips: ['皮手套'],
    minLv: 10,
    maxLv: 15,
  },
  {
    name: '绿毛僵尸',
    hp: 350,
    lv: 10,
    type: 'm2',
    maps: ['东部矿坑'],
    dropGoods: ['小血瓶', '小蓝瓶', '中血瓶', '中蓝瓶'],
    dropEquips: ['蛇眼戒指', '法力手环'],
    minLv: 10,
    maxLv: 20,
  },
  {
    name: '僵法尸',
    hp: 660,
    lv: 10,
    type: 'm2',
    maps: ['东部矿坑'],
    minLv: 10,
    maxLv: 20,
    dropGoods: ['小蓝瓶', '中蓝瓶'],
    dropEquips: ['玛瑙法杖'],
  },

  {
    name: '蛆虫',
    hp: 220,
    lv: 11,
    type: 'm1',
    maps: ['矿坑东'],
    minLv: 11,
    maxLv: 16,
    dropGoods: ['中蓝瓶'],
    dropEquips: ['法师之拳'],
  },
  {
    name: '蝎子',
    hp: 240,
    lv: 12,
    type: 'm1',
    maps: ['矿坑东'],
    minLv: 12,
    maxLv: 17,
  },
  {
    name: '幽魂',
    hp: 560,
    lv: 13,
    type: 'm1',
    maps: ['矿坑东'],
    minLv: 13,
    maxLv: 18,
  },
  {
    name: '大岩蛇',
    hp: 700,
    lv: 16,
    type: 'm2',
    maps: ['矿坑东'],
    minLv: 16,
    maxLv: 26,
  },

  {
    name: '基尔加丹',
    hp: 3000000,
    lv: 9999,
    type: 'm4',
    maps: ['初始大陆'],
    minLv: 99,
    maxLv: 99,
  },
];
export const monsterMap = arrayToMap(monsters, (v) => v.name);

function hpPotion(val) {
  return (bot: Bot) => {
    return bot.player.hp - bot.player.hp_c >= val;
  };
}

function mpPotion(val) {
  return (bot: Bot) => {
    return bot.player.mp - bot.player.mp_c >= val;
  };
}

export const goods: GoodData[] = [
  {
    id: '621f14fbae6d464b808814ab',
    name: '小血瓶',
    usable: hpPotion(20),
    shouldBuy: () => true,
  },
  {
    id: '62237ad3123d27297c06b54b',
    name: '小蓝瓶',
    usable: mpPotion(20),
    shouldBuy: () => true,
  },
  {
    id: '622572c968314c57c17abe8f',
    name: '鸡蛋',
    usable: hpPotion(40),
  },
  {
    id: '6225ce7a68314c57c17ac01b',
    name: '中血瓶',
    usable: hpPotion(50),
    shouldBuy: (v) => v.player.lv >= 15,
  },
  {
    id: '6225ce8568314c57c17ac01e',
    name: '中蓝瓶',
    usable: mpPotion(50),
    shouldBuy: (v) => v.player.lv >= 15,
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
    id: '6224e4219962680c308d3277',
    name: '火球术',
    usable: () => true,
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
    name: '练功房①',
    map: '初始大陆',
    x: 0,
    y: 0,
    toMap: '练功房①',
  },
  {
    name: '练功房②',
    map: '初始大陆',
    x: 0,
    y: 1,
    toMap: '练功房②',
  },
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
  },

  {
    name: '初始大陆',
    map: '练功房①',
    x: 0,
    y: 0,
    toMap: '初始大陆',
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
    toMap: '神秘通道',
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
    (v: EquipInfo) => (v.maxAtk || 0) + (v.minAtk || 0) + (v.neglectDef || 0),
    (v: EquipInfo) => (v.def || 0) + (v.magicDef || 0),
    (v: EquipInfo) => v.strCritsRate || 0,
    (v: EquipInfo) => v.strCritsDamageRate || 0,
    (v: EquipInfo) =>
      (v.speed || 0) + (v.attackSpeed || 0) + (v.moveSpeed || 0),
    (v: EquipInfo) => (v.hp || 0) + (v.mp || 0),
    (v: EquipInfo) => v.attackDistance || 0,
    (v: EquipInfo) => v.vision || 0,
    (v: EquipInfo) => v.lv || 0,
    (v: EquipInfo) => v.quality || 0,
  ],
  magic: [
    (v: EquipInfo) =>
      (v.maxMagic || 0) + (v.minMagic || 0) + (v.neglectMagicDef || 0),
    (v: EquipInfo) => (v.def || 0) + (v.magicDef || 0),
    (v: EquipInfo) => v.strCritsRate || 0,
    (v: EquipInfo) => v.strCritsDamageRate || 0,
    (v: EquipInfo) =>
      (v.speed || 0) + (v.attackSpeed || 0) + (v.moveSpeed || 0),
    (v: EquipInfo) => (v.hp || 0) + (v.mp || 0),
    (v: EquipInfo) => v.attackDistance || 0,
    (v: EquipInfo) => v.vision || 0,
    (v: EquipInfo) => v.lv || 0,
    (v: EquipInfo) => v.quality || 0,
  ],
};

export interface TaskData {
  id: string;
  condition: (b: Bot) => boolean;
  npc: NpcData;
}

export const tasks: TaskData[] = [
  {
    id: '新手任务',
    condition: (v) => v.equipList.length === 0,
    npc: npcMap.get('初始大陆-3-3-新手接待员'),
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
    condition: (v) => v.hasGood('铁矿', 100),
    npc: npcMap.get('初始大陆-26-50-铁矿商人'),
  },
  {
    id: '铝矿',
    condition: (v) => v.hasGood('铝矿', 100),
    npc: npcMap.get('初始大陆-24-50-铝矿商人'),
  },
];

export interface MapData {
  name: string;
  minLvl: number;
  maxLvl: number;
}

export const maps = [
  { name: '初始大陆', minLvl: 1, maxLvl: 9 },
  { name: '东部矿坑', minLvl: 10, maxLvl: 10 },
  { name: '矿坑东', minLvl: 11, maxLvl: 20 },
  { name: '矿坑北', minLvl: 15, maxLvl: 99 },
  { name: '血色森林', minLvl: 15, maxLvl: 99 },
  { name: '封魔谷', minLvl: 15, maxLvl: 99 },
];
