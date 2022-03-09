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

export interface BotConfig {
  script: 'idle' | 'scriptHome' | 'scriptBattle' | 'scriptExp';
  skillId: string;
  mapName?: string;
  maxBuyCount?: number;
  preferAttr: 'melee' | 'magic';
  log?: boolean;
  debug?: boolean;
}

export interface AccountConfig {
  username: string;
  password: string;
  token?: string;
  config: BotConfig;
}
