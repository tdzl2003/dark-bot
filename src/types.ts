export interface Attrs {
  hp: number;
  mp: number;
  speed: number;
  moveSpeed: number;
  attackDistance: number;
  attackSpeed: number;
  vision: number;

  minAtk: number;
  maxAtk: number;
  def: number;
  strCritsRate: number;
  strCritsDamageRate: number;
  neglectDef: number;

  minMagic: number;
  maxMagic: number;
  magicDef: number;
  intCritsDamageRate: number;
  intCritsRate: number;
  neglectMagicDef: number;

  hpSec: number;
  mpSec: number;
}

export interface PlayerInfo extends Attrs {
  username: string;

  lv: number;
  gold: number;
  coin: number;
  exp: number;
  lvUpExp: number;
  vip: number;

  hp_c: number;
  mp_c: number;

  hpRecovery: number;
  mpRecovery: number;

  damage: number;
}

export interface EquipInfo extends Partial<Attrs> {
  equipId: number;
  lv: number;
  name: string;
  quality: number;
  status: 0 | 1;
  type: number;
  _id: number;
}

export interface GoodInfo {
  count: number;
  id: string;
  mark: string;
  name: string;
  quality: number;
  type: number;
}

export type UnitType =
  | 'npc'
  | 'shop'
  | 'm1'
  | 'm2'
  | 'm3'
  | 'm4'
  | 'herb'
  | 'player'
  | 'io';

export interface MapUnit {
  id: string;
  hp: number;
  hp_c: number;
  lv: number;
  name: string;
  type: UnitType;
  x: number;
  y: number;
}

export interface PosInfo {
  name: string;
  sizeX: number;
  sizeY: number;
  x: number;
  y: number;
}

export interface SkillInfo {
  ability: number;
  id: string;
  mark: string;
  maturity: number;
  name: string;
  type: number;
}

export interface FbInfo {
  lv: number;
  quality: number;
  exp: number;
  readyLvUp: boolean;
}

export interface BotConfig {
  /**
   * 选择任务。IDLE: 什么也不做。scriptHome：回城。scriptBattle：自动战斗打怪。
   */
  script: 'idle' | 'scriptHome' | 'scriptBattle';
  /**
   * 使用的技能ID
   */
  skillId: string;
  /**
   * 可选：指定地图。不然按等级自动选择地图
   */
  mapName?: string;
  /**
   * 装备策略，物理或魔法
   */
  preferAttr: 'melee' | 'magic';
  /**
   * 是否显示战斗过程和常规信息
   */
  log?: boolean;
  /**
   * 是否显示详细AI决策过程
   */
  debug?: boolean;
}

export interface AccountConfig {
  username: string;
  password: string;
  token?: string;
  config: BotConfig;
}
