import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { watch } from 'fs';
import { readFileSync, writeFileSync } from 'fs';
import {
  findNextIo,
  goodsMap,
  goodsRev,
  ioMap,
  mapMap,
  maps,
  monsterMap,
  npcMap,
  PreferAttrConfigs1,
  TaskData,
  tasks,
} from './data';
import {
  AccountConfig,
  BotConfig,
  EquipInfo,
  FbInfo,
  GoodInfo,
  MapUnit,
  PlayerInfo,
  PosInfo,
  SkillInfo,
} from './types';

export class Bot {
  axios: AxiosInstance;
  destroyed = false;

  equipList: EquipInfo[];
  goodsList: GoodInfo[];
  mapUnits: MapUnit[];
  player: PlayerInfo;
  pos: PosInfo;
  fb: FbInfo;
  skillList: SkillInfo[];

  randomMoveTarget?: { x: number; y: number };
  lastTarget?: string;
  lastKilled?: string;

  mapName: string;
  lastBuyAt = Date.now() + 3600000;

  lastRefreshAt = 0;

  visitedTasks = new Set<string>();

  constructor(
    private readonly service: AppService,
    public username: string,
    public token: string,
    public config: BotConfig,
  ) {
    this.axios = axios.create({
      baseURL: 'http://119.91.99.233:8088/api',
      timeout: 20000,
    });
    this.axios.interceptors.request.use((req) => {
      if (this.destroyed) {
        throw new Error('Destroyed.');
      }
      this.debug(`${req.method} ${req.url} ${JSON.stringify(req.data)}`);
      req.headers = req.headers || {};
      req.headers.token = this.token;
      return req;
    });
    this.axios.interceptors.response.use((resp) => {
      if (resp.data.status < 0 || resp.data.status === 500) {
        this.log(`${resp.request.path} ${JSON.stringify(resp.data)}`);
        throw new Error('错误码' + resp.data.status);
      }
      this.debug(`${JSON.stringify(resp.data)}`);
      return resp;
    });
  }

  log(msg: string) {
    if (this.config.log) {
      console.log(`${this.username}: ${msg}`);
    }
  }
  debug(msg: string) {
    if (this.config.debug) {
      console.log(`[DEBUG] ${this.username}: ${msg}`);
    }
  }

  hasGood(id: string, cnt: number) {
    const rec = this.goodsList.find((v) => v.id === id || v.name === id);
    if (!rec || rec.count < cnt) {
      return false;
    }
    return true;
  }

  async init() {
    if (!this.token) {
      throw new Error('未指定token');
    }
    const resp = await this.axios.get('/init');
    if (resp.data.status < 0) {
      console.log(resp.data);
      throw new Error('初始化失败');
    }
    this.handleResponse(resp.data.data);
    if (this.player.username !== this.username) {
      throw new Error('用户名不匹配');
    }
  }

  async run() {
    while (!this.destroyed) {
      try {
        while (!this.destroyed) {
          this.debug('step');
          await this.think();
          // await new Promise((resolve) => setTimeout(resolve, 500));
        }
        this.log('退出');
      } catch (e) {
        console.error(this.username, e.stack);
        // 干掉所有进程，确保我能看到错误
        if (!axios.isAxiosError(e)) {
          for (const [k, v] of this.service.bots.entries()) {
            v.destroyed = true;
          }
          this.service.bots.clear();
          return;
        }
      }
    }
  }

  async think() {
    if (!this.config.skillId) {
      throw new Error('未配置技能。');
    }
    switch (this.config.script) {
      case 'idle': {
        this.lastTarget = '';
        this.mapName = null;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        break;
      }
      case 'scriptHome': {
        await this.scriptHome();
        break;
      }
      case 'scriptBattle': {
        await this.scriptBattle();
        break;
      }
    }
  }

  async scriptHome() {
    if (this.pos.name === '初始大陆') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }
    return this.findPathHome();
  }

  /**
   * 脚本：新手村刷怪
   */
  async scriptBattle() {
    this.debug('scriptBattle');

    if (this.lastRefreshAt < Date.now()) {
      this.lastRefreshAt = Date.now() + Math.random() * 300000 + 60000;
      await this.refreshEquips();
    }

    // 完成任务，仅当在附近时
    const task = this.findValidTask();
    if (task) {
      await this.completeTask(task);
      return;
    }

    if (this.config.fbUpgrade) {
      await this.fbLvUp();
    }

    // 选择刷怪地图
    if (!this.mapName) {
      if (this.config.mapName) {
        this.mapName = this.config.mapName;
      } else {
        this.mapName = this.findBestMap();
      }
    }

    // 回城补给
    if (this.needBuy()) {
      await this.tryUseGoods();
      if (this.needBuy()) {
        this.debug('needBuy');
        return await this.thinkBuy();
      }
    }

    // 边打边前往刷怪地图
    if (this.pos.name !== this.mapName) {
      return this.findPath(this.mapName, true);
    }
    // 自由战斗
    if (!(await this.thinkBattle())) {
      await this.randomMove();
    }
  }
  async fbLvUp() {
    if (!this.fb.readyLvUp) {
      const maxExp = Math.pow(1 + this.fb.quality, 2) * 100;
      if (this.fb.exp < maxExp || this.fb.lv >= 10) {
        return;
      }
      this.log('法宝升级');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const resp = await this.axios.post('/readyToLvUpFB', {});
      this.handleResponse(resp.data.data);
    }
    this.log('法宝升级保存');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const resp = await this.axios.post('/confirmToLvUpFB', { ok: true });
    this.handleResponse(resp.data.data);
  }

  findBestMap() {
    let choices = maps.filter(
      (v) =>
        v.minLvl <= this.player.lv &&
        v.maxLvl >= this.player.lv &&
        (v.requireGold || 0) <= this.player.gold,
    );
    const maxPrior = choices
      .map((v) => v.prior)
      .reduce((a, b) => Math.max(a, b), -Infinity);
    choices = choices.filter((v) => v.prior === maxPrior);
    if (choices.length === 0) {
      throw new Error('没有可去的地图！');
    }
    return choices[Math.floor(Math.random() * choices.length)].name;
  }

  findValidTask() {
    for (const task of tasks) {
      if (task.once && this.visitedTasks.has(task.id)) {
        continue;
      }
      if (!task.condition || task.condition(this)) {
        const npc = this.mapUnits.find(
          (v) =>
            v.x == task.npc.x && v.y == task.npc.y && v.name === task.npc.name,
        );
        if (npc) {
          return task;
        }
      }
    }
  }

  async completeTask(task: TaskData) {
    this.debug(`completeTask: ${task.id}`);
    if (this.pos.name !== task.npc.map) {
      return this.findPath(task.npc.map, true);
    }
    const npc = this.mapUnits.find(
      (v) => v.x == task.npc.x && v.y == task.npc.y && v.name === task.npc.name,
    );

    if (!npc || !this.isInAttackRange(npc, 1)) {
      if (await this.thinkBattle(true)) {
        return;
      }
      return this.moveTo(task.npc);
    }
    const data = await this.hey(npc);
    if (data && data.confirm && data.confirm.tid) {
      this.log(`${data.confirm.title}：${data.confirm.content}`);
      try {
        await new Promise((resolve) => setTimeout(resolve, 650));
        await this.task(data.confirm.npc, data.confirm.tid);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (e) {
        this.log('提交任务失败，刷新后重试');
      }
      await this.refreshEquips();
    }
    if (task.once) {
      this.visitedTasks.add(task.id);
    }
  }

  async refreshEquips() {
    {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const resp = await this.axios.get('/getEquip');
      this.handleResponse(resp.data.data);
    }
    {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const resp = await this.axios.get('/getGoods');
      this.handleResponse(resp.data.data);
    }
    await this.thinkEquips();
  }

  async thinkBattle(isFindPath?: boolean) {
    this.debug('thinkBattle');
    if (this.lastKilled && !this.lastTarget) {
      await this.randomMove();
      this.lastKilled = null;
      return true;
    }

    const target = await this.findMonster(isFindPath);
    if (!target) {
      this.debug('no target');
      return false;
    }

    if (!this.isInAttackRange(target)) {
      this.debug('move to target');
      await this.moveTo(target);
      return true;
    }
    await this.attack(target);
    return true;
  }

  async attack(target: MapUnit) {
    if (this.player.hp_c < monsterMap.get(target.name).requireHp) {
      throw new Error('低血量保护，停止战斗');
    }
    this.debug(
      `attack: ${target.name} ${target.x},${target.y} curr: ${this.pos.x}, ${this.pos.y}`,
    );
    this.lastKilled = target.name;
    const hp = this.player.hp_c;

    const data = await this.hey(target);
    if (
      data &&
      data.normalNews &&
      data.normalNews.substr(0, 4) === '你已阵亡'
    ) {
      this.lastBuyAt = 0;
      throw new Error(
        `警告：${this.username}阵亡，目标：${target.name}，血量：${hp}`,
      );
    }
    const hpRate = this.player.hp_c / this.player.hp;
    if (hpRate < 0.5) {
      // 血量少于50%后，每减少一半多停手1秒
      await new Promise((resolve) => setTimeout(resolve, -Math.log2(hpRate)));
    }
  }

  isInAttackRange(
    monster: { x: number; y: number },
    range = this.player.attackDistance,
  ) {
    const dx = monster.x - this.pos.x;
    const dy = monster.y - this.pos.y;
    if (dx * dx + dy * dy >= (range + 1) * (range + 1)) {
      return false;
    }
    return true;
  }

  needBuy() {
    // 有战斗目标时不回城。
    if (
      (this.lastTarget && this.lastKilled !== '沙包') ||
      this.player.gold < 1000
    ) {
      return false;
    }
    // 每小时必然购买一次，用于切换地图。
    if (this.lastBuyAt < Date.now()) {
      return true;
    }
    const mapData = mapMap.get(this.mapName);

    if (mapData) {
      if (
        this.player.hpRecovery <= mapData.requireHpRecovery ||
        this.player.mpRecovery <= mapData.requireMpRecovery
      ) {
        return true;
      }
    }
    return false;
  }

  async findPathHome() {
    this.debug('findPathHome');
    if (this.pos.name === '初始大陆') {
      return;
    }
    const rune = this.goodsList.find(
      (v) => v.id === '62258de568314c57c17abef8',
    );
    if (rune && rune.count > 0) {
      return await this.useGood(rune);
    }
    return this.findPath('初始大陆');
  }

  async findPath(targetMap, battle?: boolean) {
    this.debug(`findPath: ${targetMap} battle=${battle}`);

    const nextIo = findNextIo(this.pos.name, targetMap);
    if (!nextIo) {
      throw new Error(`找不到路径前往${targetMap}`);
    }
    this.debug(`nextIo: ${JSON.stringify(nextIo)}`);
    const target = this.mapUnits.find(
      (v) => v.name === nextIo.name && v.x == nextIo.x && v.y == nextIo.y,
    );
    if (!target) {
      if (battle && (await this.thinkBattle(true))) {
        return;
      }
      this.debug('No io target, move to.');
      return this.moveTo(nextIo);
    }
    if (!this.isInAttackRange(target, 1)) {
      this.debug('Not in attack range, move to');
      return this.moveTo(target);
    }
    const data = await this.hey(target);
    if (data && data.confirm) {
      this.log(`${data.confirm.title}：${data.confirm.content}`);
      await this.task(data.confirm.npc, data.confirm.tid);
    }
    if (this.pos.name !== nextIo.toMap && this.pos.name !== nextIo.map) {
      console.log(
        `${this.username}: 错误的入口数据： ${nextIo.map} ${nextIo.x} ${nextIo.y} ${nextIo.name} ${this.pos.name}`,
      );
    }
  }

  async task(npc, tid) {
    this.debug(`/task`);
    const resp = await this.axios.post('/task', {
      npc,
      tid,
    });
    this.handleResponse(resp.data.data);
    return resp.data.data;
  }

  async hey(target) {
    this.debug(
      `/hey: ${target.name} ${target.x} ${target.y} ${target.hp_c}/${target.hp}`,
    );
    const resp = await this.axios.post('/hey', {
      id: target.id,
      sklid: this.config.skillId,
      x: target.x,
      y: target.y,
    });
    this.handleResponse(resp.data.data);
    await new Promise((resolve) =>
      setTimeout(resolve, 650 * (1 - this.player.attackSpeed)),
    );
    return resp.data.data;
  }

  async tryUseGoods() {
    this.debug(`tryUseGoods`);
    retry: for (;;) {
      const map = new Map();
      for (const item of this.goodsList) {
        map.set(item.id, item);
      }
      for (const good of goodsRev) {
        const item = map.get(good.id);
        if (!item) {
          continue;
        }
        if (good.usable?.(this)) {
          await this.useGood(item);
          continue retry;
        }
        if (good.usableAll?.(this)) {
          await this.useGood(item, true);
          continue retry;
        }
      }
      break;
    }
  }
  async thinkBuy() {
    this.debug('thinkBuy');
    const target = this.mapUnits.find((v) => v.type === 'shop');
    if (!target) {
      if (this.pos.name !== '初始大陆') {
        return this.findPathHome();
      }
      return this.moveTo({ x: 4, y: 3 });
    }
    const map: { [key: string]: GoodInfo } = {};
    for (const item of this.goodsList) {
      map[item.id] = item;
    }

    if (!this.isInAttackRange(target, 1)) {
      await this.moveTo(target);
      return;
    }
    const data = await this.hey(target);
    if (!data || !data.shop) {
      this.log('店铺交互失败');
      return;
    }
    const { shop } = data;
    this.log(`在店铺${shop.name}补给`);

    let gold = this.player.gold;
    const prices = {};
    for (const item of shop.goods) {
      prices[item.goodsId] = Number(item.sellGold);
      if (!goodsMap.has(item.goodsId)) {
        throw new Error(
          `${this.username}: 未知物品：${item.goodsId} ${item.name} ${item.mark}`,
        );
      }
    }
    const buyItems = [];
    if (
      this.player.lv >= 10 &&
      !map['62258de568314c57c17abef8'] &&
      gold >= 10000
    ) {
      // 10级以上买回城石
      buyItems.push({
        goodsId: '62258de568314c57c17abef8',
        count: 1,
      });
      gold -= prices['62258de568314c57c17abef8'];
    }

    const mapData = mapMap.get(this.mapName);
    this.mapName = null;
    this.lastBuyAt = Date.now() + Math.random() * 7200000 + 1800000;

    if (!mapData) {
      return;
    }

    // 切换地图

    let requireHp = Math.ceil(
      (mapData.targetHpRecovery - this.player.hpRecovery) / 1000,
    );
    let requireMp = Math.ceil(
      (mapData.targetMpRecovery - this.player.mpRecovery) / 1000,
    );
    const maxBuyCount = Math.floor((this.player.gold - 10000) / 3000);

    if (requireHp + requireMp > maxBuyCount) {
      if (requireHp > requireMp) {
        if (requireHp - requireMp > maxBuyCount) {
          requireHp = maxBuyCount;
          requireMp = 0;
        } else {
          requireHp -= requireMp;
          const adds = Math.ceil((maxBuyCount - requireHp) / 2);
          requireHp += adds;
          requireMp += adds;
        }
      } else {
        if (requireMp - requireHp > maxBuyCount) {
          requireHp = 0;
          requireMp = maxBuyCount;
        } else {
          requireMp -= requireHp;
          const adds = Math.ceil((maxBuyCount - requireMp) / 2);
          requireHp += adds;
          requireMp += adds;
        }
      }
    }

    if (requireHp > 0) {
      buyItems.push({
        goodsId: '62304f75ce3754301855fb75',
        count: requireHp,
      });
    }

    if (requireMp > 0) {
      buyItems.push({
        goodsId: '62304fb4ce3754301855fb7e',
        count: requireMp,
      });
    }

    for (const item of shop.goods) {
      if (!item.sellGold) {
        continue;
      }
      if (!goodsMap.has(item.goodsId)) {
        console.log(
          `${this.username}: 未知的物品：${item.goodsId}, ${item.name}, ${item.mark}`,
        );
      }
    }
    this.debug('买进物品：' + JSON.stringify(buyItems));

    this.debug(`/buy`);
    const resp1 = await this.axios.post('/buy', {
      npc: shop.npc,
      shopId: shop.shopId,
      buyItems,
    });
    this.handleResponse(resp1.data.data);

    await this.tryUseGoods();
  }

  async thinkEquips() {
    this.debug(`thinkEquips`);
    const map = {};
    for (const item of this.equipList) {
      if (item.status) {
        map[item.type] = item;
      }
    }
    for (const item of this.equipList) {
      if (!item.status) {
        if (!map[item.type] || this.bestEquip(item, map[item.type])) {
          if (item.lv <= this.player.lv) {
            this.log('替换装备：' + item.name);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const resp = await this.axios.post('/equip', {
              id: item._id,
            });
            this.handleResponse(resp.data.data);
            map[item.type] = item;
          }
        } else {
          this.log('出售装备：' + item.name);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const resp = await this.axios.post('/sell', {
            equipId: item._id,
          });
          this.handleResponse(resp.data.data);
        }
      }
    }
  }

  bestEquip(a: EquipInfo, b: EquipInfo) {
    for (const f of PreferAttrConfigs1[this.config.preferAttr]) {
      const av = f(a);
      const bv = f(b);
      if (av < bv) {
        return false;
      }
      if (av > bv) {
        return true;
      }
    }
    return false;
  }

  async useGood(item: GoodInfo, all?: boolean) {
    this.debug(`useGood: ${item.name}`);
    this.log(`使用道具：${item.name}，剩余数量：${item.count - 1}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const resp = await this.axios.post(all ? '/allgoods' : '/goods', {
      id: item.id,
    });
    this.handleResponse(resp.data.data);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  /**
   * 随机移动
   */
  async randomMove() {
    this.debug(`randomMove`);

    while (
      !this.randomMoveTarget ||
      (this.pos.x === this.randomMoveTarget.x &&
        this.pos.y === this.randomMoveTarget.y)
    ) {
      this.randomMoveTarget = {
        x: Math.floor(Math.random() * (this.pos.sizeX + 1)),
        y: Math.floor(Math.random() * (this.pos.sizeY + 1)),
      };
    }
    return this.moveTo(this.randomMoveTarget);
  }

  async moveTo(target: { x: number; y: number }) {
    this.debug(
      `moveTo ${target.x}, ${target.y}, current ${this.pos.x}, ${this.pos.y}`,
    );

    const dx = target.x - this.pos.x,
      dy = target.y - this.pos.y;
    let { x, y } = this.pos;
    let dis = this.player.speed;
    if (dx) {
      dis = Math.min(dis, Math.abs(dx));
    }
    if (dy) {
      dis = Math.min(dis, Math.abs(dy));
    }

    x += Math.sign(dx) * dis;
    y += Math.sign(dy) * dis;

    // this.log(`移动到：${x},${y}（目标：${target.x},${target.y}）`);

    // TODO: 高移动速度一次可以移动多格。
    const resp = await this.axios.post('/go', {
      x,
      y,
    });
    this.handleResponse(resp.data.data);
    await new Promise((resolve) =>
      setTimeout(resolve, 650 * (1 - this.player.moveSpeed)),
    );
  }

  async findMonster(isFindPath: boolean) {
    if (this.lastTarget) {
      const m = this.mapUnits.find((v) => v.id === this.lastTarget);
      if (m) {
        return m;
      }
      this.lastTarget = null;
    }
    if (this.needBuy()) {
      return null;
    }

    const { x, y } = this.pos;
    let m = null;
    let minDis = Infinity;
    for (const v of this.mapUnits) {
      if (
        v.type !== 'm1' &&
        v.type !== 'm2' &&
        v.type !== 'm3' &&
        v.type !== 'm4' &&
        v.type !== 'herb'
      ) {
        continue;
      }
      if (v.type === 'herb' && !this.config.herb) {
        continue;
      }
      const data = monsterMap.get(v.name);
      if (isFindPath && data.notInPath) {
        continue;
      }
      if (this.player.lv < data.minLv || this.player.lv > data.maxLv) {
        continue;
      }
      if (data.immutableType === this.config.preferAttr) {
        continue;
      }
      const dis =
        Math.max(0, Math.abs(x - v.x) - this.player.attackDistance) +
        Math.max(0, Math.abs(y - v.y) - this.player.attackDistance);
      if (dis < minDis) {
        m = v;
        minDis = dis;
      }
    }
    if (m) {
      this.log(`攻击：${m.x},${m.y}: ${m.name}`);
      this.lastTarget = m.id;
    }
    return m;
  }

  handleResponse(data) {
    if (!data) {
      return;
    }
    const {
      mapUnits,
      player,
      normalNews,
      goodsList,
      goodsNews,
      equipList,
      pos,
      skillList,
      tempDropMsg,
      fb,
    } = data;
    this.player = { ...this.player, ...player };
    if (pos) {
      if (pos.name !== this.pos?.name) {
        this.randomMoveTarget = null;
      }
      this.pos = pos;
    }
    if (mapUnits) {
      this.mapUnits = mapUnits;
      for (const v of this.mapUnits) {
        if (
          v.type === 'm1' ||
          v.type === 'm2' ||
          v.type === 'm3' ||
          v.type === 'm4' ||
          v.type === 'herb'
        ) {
          if (!monsterMap.has(v.name)) {
            throw new Error(
              `${this.username}: 未知怪物：${v.name}, hp: ${v.hp}, lv: ${v.lv}, type: ${v.type}, maps: ${this.pos.name}`,
            );
            continue;
          }
          const rec = monsterMap.get(v.name);
          if (rec.hp !== v.hp || rec.lv !== v.lv || rec.type !== v.type) {
            throw new Error(
              `${this.username}: 错误的怪物信息：${v.name}, hp: ${v.hp}, lv: ${v.lv}, type: ${v.type}, maps: ${this.pos.name}`,
            );
          }
          if (rec.maps.indexOf(this.pos.name) < 0) {
            throw new Error(
              `${this.username}: 未知怪物出现地图：${v.name} ${this.pos.name}`,
            );
          }
        } else if (v.type === 'npc') {
          const key = [this.pos.name, v.x || 0, v.y || 0, v.name].join('-');
          if (!npcMap.has(key) && !ioMap.has(key)) {
            throw new Error(
              `${this.username}: 未知NPC： ${v.name}, x:${v.x}, y:${v.y} maps: ${this.pos.name}`,
            );
            continue;
          }
        } else if (v.type === 'io') {
          const key = [this.pos.name, v.x, v.y, v.name].join('-');
          if (!ioMap.has(key)) {
            throw new Error(
              `${this.username}: 未知出入口： ${v.id} ${v.name}, x:${v.x}, y:${v.y} maps: ${this.pos.name}`,
            );
            continue;
          }
        }
      }
    }
    if (skillList) {
      this.skillList = skillList;
    }
    if (goodsList) {
      this.goodsList = goodsList;
      for (const item of this.goodsList) {
        if (!goodsMap.has(item.id)) {
          throw new Error(`未知物品：${item.id}, ${item.name}, ${item.mark}`);
        }
      }
    }
    if (equipList) {
      this.equipList = equipList;
    }
    if (normalNews) {
      this.log(normalNews);
    }
    if (goodsNews) {
      this.log(goodsNews);
    }
    if (fb) {
      this.fb = { ...this.fb, ...fb };
    }

    if (tempDropMsg) {
      for (const item of tempDropMsg) {
        this.log('掉落物品：' + item);
      }
    }
  }
}

@Injectable()
export class AppService {
  configs: AccountConfig[] = [];
  bots: Map<string, Bot> = new Map();
  lastLoadPromise = null;

  init() {
    this.lastLoadPromise = this.load();
    let timer = null;

    watch('config.json', {}, () => {
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          this.lastLoadPromise = Promise.resolve(this.lastLoadPromise).then(
            () => this.load(),
          );
        }, 1000);
      }
    });
  }
  async load() {
    console.log('刷新配置');
    this.configs = JSON.parse(readFileSync('config.json', 'utf-8'));
    const set = new Set(this.configs.map((v) => v.username));
    for (const un of this.bots.keys()) {
      if (!set.has(un)) {
        const bot = this.bots.get(un);
        bot.destroyed = true;
        this.bots.delete(un);
      }
    }
    for (const config of this.configs) {
      if (this.bots.has(config.username)) {
        const curr = this.bots.get(config.username);
        curr.config = config.config;
        continue;
      }

      const bot = new Bot(this, config.username, config.token, config.config);
      try {
        console.log('登录账号：', config.username);
        await bot.init();
      } catch (e) {
        console.warn(e.stack);
        console.log('重新登录');
        await new Promise((resolve) => setTimeout(resolve, 10000));
        const { data } = await axios.post(
          'http://119.91.99.233:8088/api/login',
          {
            username: config.username,
            password: config.password,
          },
        );
        const token = data.data;
        bot.token = token;
        config.token = token;
        writeFileSync('config.json', JSON.stringify(this.configs, null, 2));
        await bot.init();
      }
      this.bots.set(config.username, bot);
      bot.run();
    }
  }
}
