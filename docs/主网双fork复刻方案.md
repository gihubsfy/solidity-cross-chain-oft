# 主网双 Fork 复刻方案

这份文档说明如何围绕下面 3 笔真实主网交易，做一套本地可复现的双 fork 行为回放：

- Polygon 源链：
  - `0x66fdd4c84e47a80db7124979c76591078e57dbf984958d64f7b60147ae3d3db8`
- Base 到账：
  - `0xdccbd94bd8dc9c875108e6b30dbd9842c7d8d1ac05bd64a3c4b06e9b854b1d7f`
- Base 卖出：
  - `0xaa38ca9584c265838fd0da4564b01dc3d4ce98e0f54f87d62e76bea26002efb3`

## 背景

真实主网资金少时，不适合直接拿主网资金去试完整流程。

但如果只做测试网验证，又无法完全反映主网真实池子状态、真实路由和真实成交行为。

所以更合理的办法是：

1. 用测试网验证“系统架构是否成立”
2. 用主网双 fork 验证“真实行为能否重放”

这里的双 fork 不是要真实模拟 LayerZero 网络本身，而是：

- Polygon fork：重放源链真实 swap + bridge 前半段行为
- Base fork：重放到账行为和卖出行为

## 重要前提：必须有归档 RPC

主网双 fork 不等于“任何 RPC 都能回放历史交易”。

要回放旧区块交易，你需要的 RPC 必须支持对应区块高度的历史状态读取。

如果 RPC 不支持，会报类似错误：
- `historical state ... is not available`

所以：

- Polygon 需要：`POLYGON_MAINNET_RPC_URL`
- Base 需要：`BASE_MAINNET_RPC_URL`

这两个最好使用归档能力较强的 RPC。

## 这 3 笔交易对应什么

### 1. Polygon tx

`0x66fdd4c84e47a80db7124979c76591078e57dbf984958d64f7b60147ae3d3db8`

对应：
- 源链 swap
- 源链 bridge send

抽象流程：
- USDT -> USDC -> HANDL -> LayerZero send

### 2. Base tx

`0xdccbd94bd8dc9c875108e6b30dbd9842c7d8d1ac05bd64a3c4b06e9b854b1d7f`

对应：
- LayerZero 到达 Base 后的 receive / credit
- 用户收到 Base 上的 HANDL

### 3. Base tx

`0xaa38ca9584c265838fd0da4564b01dc3d4ce98e0f54f87d62e76bea26002efb3`

对应：
- 用户在目标链把 HANDL 卖成 USDC

## 已实现脚本

### 1. 通用 tx replay

- `scripts/fork/replay-tx-on-hardhat-fork.js`

用途：
- 给定链和 tx hash
- 自动把 hardhat network reset 到该 tx 前一个区块
- impersonate 原始发起地址
- 用原始 calldata 和 value 重放该交易
- 可选打印指定地址的 token 余额变化

### 2. 三步回放脚本

- `scripts/fork/replay-three-step-mainnet-flow.js`

用途：
- 顺序重放上面 3 笔交易
- 打印关键地址在关键 token 上的余额变化

### 3. 在 fork 上验证我们自己的合约

新增脚本：

- `scripts/fork/validate-our-source-contract-on-polygon-fork.js`
- `scripts/fork/validate-our-destination-contract-on-base-fork.js`

用途：
- 不只是 replay 别人的主网交易
- 而是在 fork 状态下部署我们自己的 workflow / adapter
- 再让我们自己的合约去执行同类动作

## 已完成的验证结果

### 测试网层

已经完成：
- 真实跨链
- 真实 DEX 风格池子
- 目标链卖出
- watcher 自动卖出

### 主网行为 replay 层

已经完成：
- Polygon 源链交易 replay
- Base 到账交易 replay
- Base 卖出交易 replay

### 我们自己的合约在主网状态下的验证层

已经完成：

1. Polygon 主网 fork
   - 部署我们自己的源链 workflow
   - 部署我们自己的 swap adapter
   - 通过 bridge recorder 记录输出
   - 验证交易 hash：
     - `0x3ae8eea43dd9acb6daa3db46fdd872a69f24abd48b25e5e5a6157e8c589fb526`

2. Base 主网 fork
   - 部署我们自己的目标链 workflow
   - 部署我们自己的 fixed-pair adapter
   - 在真实主网池子状态下完成卖出
   - 验证交易 hash：
     - `0xcf8ad3bfbb669c8e6a00019d9ae7a6be12dded017eb8ff945754707e56447ce0`

这一步的重要性在于：
- 它验证的不是“别人主网合约能不能工作”
- 而是“我们自己部署的合约，在主网真实状态下能不能完成同类事情”

## 与真实可部署系统的关系

这一套 fork 回放，不是替代你真实要部署的系统，而是验证层。

你最终还是会得到两类东西：

### 1. 真实可部署系统

- `UnifiedOFTWorkflow`
- 真实 DEX adapter
- bridge adapter
- route config
- watcher / executor

### 2. 复刻与验证系统

- 双 fork 回放脚本
- 主网行为分析脚本
- 操作文档

换句话说：

- fork 方案负责“验证主网行为模型”
- 测试网方案负责“验证真实执行链路”
- 正式部署方案负责“最后上线运行”

## 总结

当前建议路线是：

1. 测试网已经证明：
   - 真跨链
   - 真实 DEX 池子
   - 链下 watcher
   - 整体闭环成立

2. 接下来用双 fork：
   - 复刻你给的主网真实行为
   - 验证主网路由和成交逻辑
   - 验证我们自己的合约在主网状态下也能完成同类动作

3. 最后再收敛到：
   - 可部署到真实环境的正式版本

这套路线既省钱，也最接近真实主网行为。
