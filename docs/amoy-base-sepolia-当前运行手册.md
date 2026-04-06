# Amoy / Base Sepolia 当前运行手册

这份文档记录当前已经部署并验证通过的测试网环境。

目标流程：

1. Amoy 上真实池子 swap
2. LayerZero 跨链
3. Base Sepolia 上真实池子卖出
4. 链下 watcher 监控到账并自动触发卖出

## 已验证通过的闭环

真实 DEX + 跨链 + 目标链卖出已经跑通。

关键交易：

- Amoy 源链真实 DEX + 跨链
  - `0x3eaed937ae59037afe43ede4e7aef52be08ef9bc817a2677a606b65a95854418`
- Base Sepolia 目标链真实 DEX 卖出
  - `0x2a605dd1a794f49255e15ffe26a07feb2aeda5605f1fe800f445e9dbe3f52369`

## 主网 Fork 验证结果

除了测试网闭环，这个项目还额外做了“主网状态下验证我们自己合约”的两半验证。

### 1. Polygon 主网 fork：验证我们自己的源链 workflow

已验证内容：
- 回放 Polygon 源链真实交易对应的主网状态
- 在 fork 上部署我们自己的：
  - `UnifiedOFTWorkflow`
  - `UniswapV2SwapAdapter`
  - `ForkBridgeRecorderAdapter`
- 用我们自己的 workflow 走真实主网 Polygon 路径

结果：
- 验证交易 hash：
  - `0x3ae8eea43dd9acb6daa3db46fdd872a69f24abd48b25e5e5a6157e8c589fb526`

### 2. Base 主网 fork：验证我们自己的目标链 workflow

已验证内容：
- 回放 Base 的 receive / credit 行为
- 在 fork 上部署我们自己的：
  - `UnifiedOFTWorkflow`
  - `FixedPairSwapAdapter`
- 用我们自己的 workflow 在真实主网 Base 池子状态下把 HANDL 卖成 USDC

结果：
- 验证交易 hash：
  - `0xcf8ad3bfbb669c8e6a00019d9ae7a6be12dded017eb8ff945754707e56447ce0`

结论：
- 测试网已经证明整条闭环成立
- 主网 fork 又证明我们自己的合约在真实主网状态下也能完成对应的两半动作

## Route

- `routeId`
  - `0xc6d4bc2d1e6f133282c79e25c4973bb28f691db444463accf426524bbbfa6609`
- `routeLabel`
  - `amoy-base-sepolia-direct`

## Amoy 地址

- OFT
  - `0x85B11FD310e001bD0931eE4d97e267831cdD49Df`
- UnifiedOFTWorkflow
  - `0x5261D06617649d40e647c7f33430b1228a038581`
- LayerZeroOFTBridgeAdapter
  - `0xB35756c199a7E0fcc1B5a70104A324EC5E9e385b`
- Mock tokenIn
  - `0xF3E6709EC2B1272f7519b660de3509306E4e5E1E`
- Mock payoutToken
  - `0xe8c1922295a893E64572efC4b2B2e8236749dd7C`

### Amoy DEX

- UniswapV2Factory
  - `0xC177e3a2a1FBba950fE93510dd510d04f298c70E`
- WETH9
  - `0x26078A1CD788e0046C9635CC5DC7695abC98C99b`
- UniswapV2Router02
  - `0xB1fC45433caEf19b24A25E8C1707626408f251B4`
- Router 风格 adapter
  - `0xd8b82A5dDDdD59c249e5823C2A1373b1932B2138`
- Pair 直连 adapter
  - `0xF66beeD326661f0e21320545c6b99f42b389A3E0`
- 当前实际 source route 使用的 adapter
  - `0xF66beeD326661f0e21320545c6b99f42b389A3E0`
- `tokenIn / OFT` pair
  - `0xECFC1b7256321E84104f31EEb0e91f87D32E7b11`

## Base Sepolia 地址

- OFT
  - `0x85B11FD310e001bD0931eE4d97e267831cdD49Df`
- UnifiedOFTWorkflow
  - `0x5261D06617649d40e647c7f33430b1228a038581`
- Mock tokenIn
  - `0xF3E6709EC2B1272f7519b660de3509306E4e5E1E`
- Mock payoutToken
  - `0xe8c1922295a893E64572efC4b2B2e8236749dd7C`

### Base Sepolia DEX

- UniswapV2Factory
  - `0xa8aE3a65963fd770e7261100773bcD8223928CB1`
- WETH9
  - `0xcF35D3F4A5D87D220c80B79Ab3f3e6aBC561c68f`
- UniswapV2Router02
  - `0x4E7203D478273e77146afC582882F23768aD9a83`
- Router 风格 adapter
  - `0xfBe05c25f12b93bd16bcD75C024B2B8587099a55`
- Pair 直连 adapter
  - `0xd0dD922c140Ec199a4B182d972dD1d691d23781e`
- 当前实际 destination route 使用的 adapter
  - `0xd0dD922c140Ec199a4B182d972dD1d691d23781e`
- `OFT / payoutToken` pair
  - `0x00aBb39065540e844864CD3BD7e39F8ef3A9080D`

## LayerZero 配置

- Amoy endpoint
  - `0x6EDCE65403992e310A62460808c4b910D972f10f`
- Base Sepolia endpoint
  - `0x6EDCE65403992e310A62460808c4b910D972f10f`
- Base Sepolia eid
  - `40245`
- Amoy eid
  - `40267`

双向 `setPeer` 已完成。

## 当前架构

链上：

- 源链
  - `swapAndBridge(...)`
- 目标链
  - `swapReceivedOFT(...)`

链下：

- watcher / executor
  - `scripts/testnet/watch-destination-balance-and-sell.js`

## 常用命令

### 1. 源链发起

```powershell
$env:WORKFLOW_ADDRESS='0x5261D06617649d40e647c7f33430b1228a038581'
$env:TOKEN_IN_ADDRESS='0xF3E6709EC2B1272f7519b660de3509306E4e5E1E'
$env:OFT_TOKEN_ADDRESS='0x85B11FD310e001bD0931eE4d97e267831cdD49Df'
$env:RECIPIENT_ADDRESS='0x1e274433D138708C36aF002395aEf3C173a35eC6'
$env:AMOUNT_IN='10000000000000000'
$env:MIN_BRIDGE_AMOUNT='9000000000000000'
$env:LZ_RECEIVE_GAS='50000'
$env:LZ_RECEIVE_VALUE='0'
npx hardhat run scripts/testnet/send-source-flow.js --network amoy
```

### 2. 目标链手动卖出

```powershell
$env:WORKFLOW_ADDRESS='0x5261D06617649d40e647c7f33430b1228a038581'
$env:OFT_TOKEN_ADDRESS='0x85B11FD310e001bD0931eE4d97e267831cdD49Df'
$env:PAYOUT_TOKEN_ADDRESS='0xe8c1922295a893E64572efC4b2B2e8236749dd7C'
$env:RECIPIENT_ADDRESS='0x1e274433D138708C36aF002395aEf3C173a35eC6'
$env:OFT_AMOUNT_IN='9871000000000000'
$env:MIN_AMOUNT_OUT='9000000000000000'
npx hardhat run scripts/testnet/execute-destination-swap.js --network base-sepolia
```

### 3. 目标链 watcher 自动卖出

```powershell
$env:WORKFLOW_ADDRESS='0x5261D06617649d40e647c7f33430b1228a038581'
$env:OFT_TOKEN_ADDRESS='0x85B11FD310e001bD0931eE4d97e267831cdD49Df'
$env:PAYOUT_TOKEN_ADDRESS='0xe8c1922295a893E64572efC4b2B2e8236749dd7C'
$env:FACTORY_ADDRESS='0xa8aE3a65963fd770e7261100773bcD8223928CB1'
$env:WATCH_ADDRESS='0x1e274433D138708C36aF002395aEf3C173a35eC6'
$env:RECIPIENT_ADDRESS='0x1e274433D138708C36aF002395aEf3C173a35eC6'
$env:SELL_SLIPPAGE_BPS='500'
$env:POLL_INTERVAL_MS='15000'
npx hardhat run scripts/testnet/watch-destination-balance-and-sell.js --network base-sepolia
```

只跑一次检查：

```powershell
$env:WATCH_ONCE='true'
npx hardhat run scripts/testnet/watch-destination-balance-and-sell.js --network base-sepolia
```

## 当前最重要的边界

- 主流程合约已经满足需求
- 真实 DEX 池子已经接进来了
- 链下 watcher 也已经补上

所以现在系统已经不是“单独跨链”，而是：

- 源链真实池子 swap
- LayerZero 跨链
- 目标链真实池子卖出
- 链下 watcher 自动触发卖出
- 主网 fork 上验证我们自己的合约行为

## 下一步建议

如果后面要继续往可长期运行推进，优先做这几件事：

1. watcher 增加更细的失败分类
2. watcher 增加更明确的日志目录规范
3. watcher 增加 source tx 与 sell tx 关联统计
4. 将 `.env` 和文档同步成最终版本
