import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { watch } from 'fs';
import { readFileSync, writeFileSync } from 'fs';
import {
  findNextIo,
  goods,
  goodsMap,
  goodsRev,
  ioMap,
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
  skillList: SkillInfo[];

  randomMoveTarget?: { x: number; y: number };
  lastTarget?: string;
  lastKilled?: string;

  mapName: string;
  lastBuyAt = Date.now() + 600000;

  constructor(
    private readonly service: AppService,
    public username: string,
    public token: string,
    public config: BotConfig,
  ) {
    this.axios = axios.create({
      baseURL: 'http://119.91.99.233:8088/api',
      timeout: 10000,
    });
    axiosRetry(this.axios, {
      retries: 100,
      shouldResetTimeout: true,
      retryCondition: (err) => {
        this.log(err.config.url + err.message);
        return true;
      },
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
    try {
      while (!this.destroyed) {
        this.debug('step');
        await this.think();
        // await new Promise((resolve) => setTimeout(resolve, 500));
      }
      this.log('退出');
    } catch (e) {
      this.log(e.message);
      console.error(e.stack);
      // 干掉所有进程，确保我能看到错误
      if (!axios.isAxiosError(e)) {
        for (const [k, v] of this.service.bots.entries()) {
          v.destroyed = true;
        }
        this.service.bots.clear();
      } else {
        this.service.bots.delete(this.username);
      }
    }
  }

  async think() {
    if (!this.config.skillId) {
      throw new Error('未配置技能。');
    }
    switch (this.config.script) {
      case 'idle': {
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

    // 回城补给
    if (this.needBuy()) {
      this.debug('needBuy');
      if (this.mapName) {
        this.log('回城补给');
        this.mapName = null;
        this.lastBuyAt = Date.now() + Math.random() * 1800000 + 1800000;
      }
      return await this.thinkBuy();
    }

    // 完成任务，但是仅当
    const task = this.findValidTask();
    if (task) {
      await this.completeTask(task);
      return;
    }

    // 选择刷怪地图
    if (!this.mapName) {
      if (this.config.mapName) {
        this.mapName = this.config.mapName;
      } else {
        this.mapName = this.findBestMap();
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

  findBestMap() {
    if (this.config.wishLevel > this.player.lv && this.player.gold >= 100000) {
      return Math.random() < 0.5 ? '练功房①' : '练功房②';
    }
    const choices = maps.filter(
      (v) => v.minLvl <= this.player.lv && v.maxLvl >= this.player.lv,
    );
    if (choices.length === 0) {
      throw new Error('没有可去的地图！');
    }
    return choices[Math.floor(Math.random() * choices.length)].name;
  }

  findValidTask() {
    for (const task of tasks) {
      if (task.condition(this)) {
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
    if (data && data.confirm) {
      this.log(`${data.confirm.title}：${data.confirm.content}`);
      await this.task(data.confirm.npc, data.confirm.tid);
    }
  }

  async thinkBattle(isFindPath?: boolean) {
    this.debug('thinkBattle');
    if (this.lastKilled && !this.lastTarget) {
      await this.randomMove();
      this.lastKilled = null;
      return true;
    }
    await this.tryUseGoods();
    await this.thinkEquips();

    const target = this.findMonster(isFindPath);
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
    this.debug(`attack: ${target.name} ${target.x},${target.y}`);
    this.lastKilled = target.name;

    // this.log(`攻击目标: ${target.name} ${target.hp_c}/${target.hp}`);

    const data = await this.hey(target);
    if (
      data &&
      data.normalNews &&
      data.normalNews.substr(0, 4) === '你获得了'
    ) {
      const items = data.normalNews
        .substr(4, data.normalNews.length - 5)
        .split('，');
      const monsterData = monsterMap.get(target.name);
      for (const item of items) {
        const idx1 = (monsterData.dropGoods || []).indexOf(item);
        const idx2 = (monsterData.dropEquips || []).indexOf(item);
        if (idx1 < 0 && idx2 < 0) {
          this.log(items.join(','));
          console.log(
            `${this.username}: 未记录的掉落：${target.name}：${item}`,
          );
        }
      }
    }
    if (
      data &&
      data.normalNews &&
      data.normalNews.substr(0, 4) === '你已阵亡'
    ) {
      this.lastBuyAt = 0;
      console.log(`警告：${this.username}阵亡`);
    }
    // this.log(
    //   `血量：${this.player.hp_c}/${this.player.hp}，金钱：${this.player.gold}，经验：${this.player.exp}/${this.player.lvUpExp}`,
    // );
  }

  isInAttackRange(
    monster: { x: number; y: number },
    range = this.player.attackDistance,
  ) {
    const dx = monster.x - this.pos.x;
    const dy = monster.y - this.pos.y;
    if (Math.abs(dx) > range || Math.abs(dy) > range) {
      return false;
    }
    return true;
  }

  needBuy() {
    // 有战斗目标时不回城。
    if (this.lastTarget || this.player.gold < 1000) {
      return false;
    }
    // 每小时必然购买一次。
    if (this.lastBuyAt < Date.now()) {
      return true;
    }
    const map: { [key: string]: GoodInfo } = {};
    for (const item of this.goodsList) {
      map[item.id] = item;
    }
    for (const item of goods) {
      if (!item.shouldBuy || !item.shouldBuy(this)) {
        continue;
      }
      const currCount = map[item.id]?.count || 0;
      if (currCount < (this.config.minBuyCount || 10)) {
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
    if (battle && (await this.thinkBattle(true))) {
      return;
    }
    const nextIo = findNextIo(this.pos.name, targetMap);
    if (!nextIo) {
      throw new Error(`找不到路径前往${targetMap}`);
    }
    this.debug(`nextIo: ${JSON.stringify(nextIo)}`);
    const target = this.mapUnits.find(
      (v) => v.name === nextIo.name && v.x == nextIo.x && v.y == nextIo.y,
    );
    if (!target) {
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
    if (this.pos.name !== nextIo.toMap) {
      if (this.pos.name !== nextIo.map) {
        console.log(
          `${this.username}: 错误的入口数据： ${nextIo.map} ${nextIo.x} ${nextIo.y} ${nextIo.name} ${this.pos.name}`,
        );
      }
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
    const { shop } = await this.hey(target);
    if (!shop) {
      throw new Error('店铺交互失败');
    }
    this.log(`在店铺${shop.name}补给`);

    let gold = this.player.gold;
    const prices = {};
    for (const item of shop.goods) {
      prices[item.goodsId] = Number(item.sellGold);
      if (!goodsMap.has(item.goodsId)) {
        console.log(
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

    // 剩下的尽可能买到平均
    const keys = shop.goods
      .filter((v) => !!v.sellGold)
      .map((v) => v.goodsId)
      .filter((v) => goodsMap.get(v).shouldBuy?.(this));
    // 按当前数量从少到多排序
    keys.sort((a, b) => (map[a]?.count || 0) - (map[b]?.count || 0));

    let unitPrice = 0;
    let buyToCount = 0;
    for (const key of keys) {
      const myCount = map[key]?.count || 0;
      let buyCount = myCount - buyToCount;
      if (unitPrice > 0) {
        const maxCount = Math.floor(gold / unitPrice);
        buyCount = Math.min(buyCount, maxCount);
      }
      gold -= unitPrice * buyCount;
      unitPrice += prices[key];
      buyToCount += buyCount;
    }

    {
      const maxCount = Math.floor(gold / unitPrice);
      buyToCount += maxCount;
    }
    buyToCount = Math.min(buyToCount, this.config.maxBuyCount);

    for (const key of keys) {
      const myCount = map[key]?.count || 0;
      if (myCount < buyToCount) {
        buyItems.push({
          goodsId: key,
          count: buyToCount - myCount,
        });
      }
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
      }
      break;
    }
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
            const resp = await this.axios.post('/equip', {
              id: item._id,
            });
            this.handleResponse(resp.data.data);
          }
        } else {
          this.log('出售装备：' + item.name);
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

  async useGood(item: GoodInfo) {
    this.debug(`useGood: ${item.name}`);
    this.log(`使用道具：${item.name}，剩余数量：${item.count - 1}`);
    const resp = await this.axios.post('/goods', {
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
    this.debug(`moveTo ${target.x}, ${target.y}`);

    const dx = target.x - this.pos.x,
      dy = target.y - this.pos.y;
    let { x, y } = this.pos;
    if (Math.abs(dx) > Math.abs(dy)) {
      const dis = Math.min(this.player.speed, Math.abs(dx));
      x += Math.sign(dx) * dis;
    } else {
      const dis = Math.min(this.player.speed, Math.abs(dy));
      y += Math.sign(dy) * dis;
    }

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

  findMonster(isFindPath: boolean) {
    if (this.lastTarget) {
      const m = this.mapUnits.find((v) => v.id === this.lastTarget);
      if (m) {
        return m;
      }
      this.lastTarget = null;
      // 保证杀完怪移动一下，获取掉落。
      return null;
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
            console.log(
              `${this.username}: 未知怪物：${v.name}, hp: ${v.hp}, lv: ${v.lv}, type: ${v.type}, maps: ${this.pos.name}`,
            );
            continue;
          }
          const rec = monsterMap.get(v.name);
          if (rec.hp !== v.hp || rec.lv !== v.lv || rec.type !== v.type) {
            console.log(
              `${this.username}: 错误的怪物信息：${v.name}, hp: ${v.hp}, lv: ${v.lv}, type: ${v.type}, maps: ${this.pos.name}`,
            );
          }
          if (rec.maps.indexOf(this.pos.name) < 0) {
            console.log(
              `${this.username}: 未知怪物出现地图：${v.name} ${this.pos.name}`,
            );
          }
        } else if (v.type === 'npc') {
          const key = [this.pos.name, v.x || 0, v.y || 0, v.name].join('-');
          if (!npcMap.has(key) && !ioMap.has(key)) {
            console.log(
              `${this.username}: 未知NPC： ${v.name}, x:${v.x}, y:${v.y} maps: ${this.pos.name}`,
            );
            continue;
          }
        } else if (v.type === 'io') {
          const key = [this.pos.name, v.x, v.y, v.name].join('-');
          if (!ioMap.has(key)) {
            console.log(
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

    if (tempDropMsg) {
      for (const item of tempDropMsg) {
        this.log('掉落物品：' + item);
      }
    }

    if (tempDropMsg && this.lastKilled) {
      const monsterData = monsterMap.get(this.lastKilled);
      for (const item of tempDropMsg) {
        const idx1 = (monsterData.dropGoods || []).indexOf(item);
        const idx2 = (monsterData.dropEquips || []).indexOf(item);
        if (idx1 < 0 && idx2 < 0) {
          this.log(tempDropMsg.join(','));
          console.log(
            `${this.username}: 未记录的掉落：${this.lastKilled}：${item}`,
          );
        }
      }
    }
  }
}

@Injectable()
export class AppService {
  configs: AccountConfig[] = [];
  bots: Map<string, Bot> = new Map();

  async init() {
    await this.load();
    let timer = null;

    watch('config.json', {}, () => {
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          this.load();
        }, 1000);
      }
    });
  }
  async load() {
    console.log('刷新配置');
    this.configs = JSON.parse(readFileSync('config.json', 'utf-8'));
    let dirty = false;
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
        console.log('重新登录');
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
        dirty = true;
        await bot.init();
      }
      this.bots.set(config.username, bot);
      bot.run();
    }
    if (dirty) {
      writeFileSync('config.json', JSON.stringify(this.configs, null, 2));
    }
  }
}
