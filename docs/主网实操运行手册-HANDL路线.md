# 主网实操运行手册：HANDL 路线

这份手册只服务一件事：

- 把目前已经验证并实际跑通过的一条主网路线，沉淀成接手就能执行的步骤

适用路线：

```text
Polygon:
USDT -> HANDL -> LayerZero -> Base

Base:
HANDL -> USDC
```

这份手册覆盖：
- 合约部署
- 路由初始化
- 源链调用
- 目标链监听与卖出
- 实际结果怎么确认

## 一、当前已部署的主网地址

### Polygon source side

- `workflow`
  - `0x85B11FD310e001bD0931eE4d97e267831cdD49Df`
- `bridgeAdapter`
  - `0x556638CB4f529e3ED7F1547b26dda3Be8b980548`
- `aggregatorAdapter`
  - `0xF3E6709EC2B1272f7519b660de3509306E4e5E1E`

### Base destination side

- `workflow`
  - `0x85B11FD310e001bD0931eE4d97e267831cdD49Df`
- `fixedPairAdapter`
  - `0x556638CB4f529e3ED7F1547b26dda3Be8b980548`
- `HANDL/USDC pair`
  - `0x186696a647c554c7dbea30e295259aa46d40effc`

### 共用 routeId

- `0x5951953aad82ce27ceb3a70b756d3655f67b98142def755bf1608ac765832de5`

> 注意：两条链上的部分地址一样是正常的，因为部署者和 nonce 节奏相同；不同链上地址相同不代表冲突。

## 二、当前已确认的资产地址

### Polygon

- `USDT`
  - `0xc2132d05d31c914a87c6611c10748aeb04b58e8f`
- `HANDL`
  - `0xf4c3fac9c98aa62474998e299495b699dfdb00eb`

### Base

- `HANDL`
  - `0x3bbcb624cb9a1f73163a886f460f47603e5e4425`
- `USDC`
  - `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

## 三、当前已完成的主网初始化

### Polygon

已经完成：
- `AggregatorAdapter` 的 target / spender 授权
  - target: `0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - spender: `0x3B86917369B83a6892f553609F3c2F439C184e31`
- `bridgeAdapter.setSupportedOft(Polygon HANDL, true)`
- `workflow.setSourceRoute(...)`

### Base

已经完成：
- `workflow.setDestinationRoute(...)`
- `HANDL -> USDC` 固定池卖出 route 已配置

## 四、主网脚本总览

### 1. Polygon 源链部署

- `scripts/mainnet/deploy-polygon-source-stack.js`
- npm 入口：
  - `npm run mainnet:deploy:polygon`

### 2. Base 目标链部署

- `scripts/mainnet/deploy-base-destination-stack.js`
- npm 入口：
  - `npm run mainnet:deploy:base`

### 3. 聚合器授权

- `scripts/mainnet/set-aggregator-approvals.js`
- npm 入口：
  - `npm run mainnet:set-aggregator`

### 4. 初始化 source route

- `scripts/testnet/init-source-route.js`
- npm 入口：
  - `npm run mainnet:init:source`

### 5. 初始化 destination route

- `scripts/testnet/init-destination-route.js`
- npm 入口：
  - `npm run mainnet:init:destination`

### 6. 检查 Polygon source state

- `scripts/mainnet/check-polygon-source-state.js`
- npm 入口：
  - `npm run mainnet:check:source`

### 7. 探测 LayerZero bridge 报价

- `scripts/mainnet/probe-handl-bridge-quote.js`
- npm 入口：
  - `npm run mainnet:probe:bridge`

### 8. 发起 Polygon 实盘 source 交易

- `scripts/mainnet/send-polygon-handl-live.js`
- npm 入口：
  - `npm run mainnet:send:handl`

### 9. Base 监听并卖出

- `scripts/mainnet/watch-base-handl-and-sell.js`
- npm 入口：
  - `npm run mainnet:watch:handl`

## 五、实际调用顺序

### 步骤 1：确认 Polygon 侧 ready

检查：
- Polygon `workflow`
- Polygon `aggregatorAdapter`
- Polygon `bridgeAdapter`
- `sourceRoute`
- `supportedOft`

可用脚本：
- `npm run mainnet:check:source`

### 步骤 2：准备 Polygon 上的 USDT

最小建议：
- 先用 `0.01 USDT`
- 第一次大于 1 USDT 的测试已经跑过，不建议继续拿大额试

### 步骤 3：发起 source 交易

脚本：
- `scripts/mainnet/send-polygon-handl-live.js`

作用：
1. 先向 OKX 获取最新 approve 信息和 swap payload
2. 生成 `sourceSwapData`
3. 通过 `bridgeAdapter.quoteBridge(...)` 计算 LayerZero 原生费
4. 调 `workflow.swapAndBridge(...)`

这个脚本的关键点：
- 不再用旧的静态路径字符串
- 而是用 OKX 的最新 payload 作为源链 swap 执行数据
- bridge fee 也是按当前主网实时报价获取

### 步骤 4：Base 监听并自动卖出

脚本：
- `scripts/mainnet/watch-base-handl-and-sell.js`

作用：
1. 轮询 Base 上 watcher 地址的 `HANDL` 余额
2. 一旦检测到到账
3. 用当前固定池储备估算 `expectedOut`
4. 推导 `minAmountOut`
5. 调 `workflow.swapReceivedOFT(...)`

这个脚本适合当前 `HANDL -> USDC` 固定池版本。

## 六、这次已经实际跑通的一次主网闭环

### 1. Polygon source 交易

- tx hash:
  - `0xc35f30aa5e980885055a14badd87d75f632ad48103c01fdb28e6a578f99676a0`

这笔交易已经确认：
- `status = 1`
- `1 USDT` 已花掉
- Polygon `HANDL` 已成功跨到 Base

### 2. Base destination 卖出交易

- tx hash:
  - `0x36bfec44ded7b062986ac8edd5a0188a10a9827b38a87790fd2f7260868989a4`

这笔交易已经确认：
- Base 上收到的 `HANDL` 已卖出
- 最终 `USDC = 1.003341`

## 七、怎么验证结果

### 1. Polygon 侧

看：
- `USDT` 余额是否减少
- `swapAndBridge` tx 是否成功
- receipt 中是否有 LayerZero / OFT 发送相关日志

### 2. Base 侧

看：
- watcher 地址上是否收到 `HANDL`
- 卖出后 `HANDL` 是否归零或减少
- `USDC` 是否增加

## 八、当前最重要的运行边界

### 1. 这套手册当前是 HANDL 专用版

- 源链：Polygon
- 目标链：Base
- OFT：HANDL
- 目标链卖出：固定池 `HANDL -> USDC`

### 2. source swap 依赖 OKX payload

也就是：
- `send-polygon-handl-live.js` 会取 OKX 的最新 quote / payload
- 如果 OKX 路由发生明显变化，source 脚本行为也会跟着变化

### 3. destination sell 当前不是聚合器版

当前 Base 侧 `HANDL` 用的是：
- 固定 pair 卖出

所以它稳定，但通用性不如聚合器版。

## 九、最推荐的实盘策略

### 第一轮
- `0.01 USDT`
- 跑一笔完整闭环

### 第二轮
- 再考虑 `0.1 USDT`

### 不建议
- 还没连续跑稳之前直接放大金额

## 十、一句话总结

现在这条 `Polygon USDT -> HANDL -> Base -> USDC` 主网路线，已经不是概念验证，而是：
- 合约已部署
- route 已初始化
- source 脚本已具备
- destination watcher / sell 脚本已具备
- 并且已经真实跑通过一笔闭环

后面接手的人，只要按这份手册，就可以继续重复调用这条路线。