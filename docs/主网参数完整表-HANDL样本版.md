# 主网参数完整表：HANDL 样本版

这份文档的目标不是解释抽象概念，而是让接手的人可以直接照着做：

1. 知道这条主网样本路线是什么
2. 知道要部署哪些合约
3. 知道每个参数该填什么
4. 知道部署完怎么配置
5. 知道怎么测试
6. 知道怎么实际使用

适用样本路线：

```text
Polygon:
USDT -> USDC -> HANDL -> LayerZero -> Base

Base:
HANDL -> USDC
```

当前这份文档针对的是：
- 源链：Polygon 主网
- 目标链：Base 主网
- OFT：HANDL

## 一、这条样本路线里已经确认的真实地址

### 1. 源链 Polygon

- 输入币 `USDT`
  - `0xc2132d05d31c914a87c6611c10748aeb04b58e8f`
- 中间币 `USDC`
  - `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359`
- OFT `HANDL`
  - `0xf4c3fac9c98aa62474998e299495b699dfdb00eb`

### 2. 目标链 Base

- OFT `HANDL`
  - `0x3bbcb624cb9a1f73163a886f460f47603e5e4425`
- 输出币 `USDC`
  - `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

### 3. Polygon 样本路径

已从主网样本交易确认：

- `USDT -> USDC -> HANDL`

### 4. Base 样本卖出路径

已从主网样本交易确认：

- `HANDL -> USDC`

## 二、建议的主网部署形态

为了降低第一版主网上线复杂度，建议先采用：

### Polygon 主网

- `UnifiedOFTWorkflow`
- `LayerZeroOFTBridgeAdapter`
- `AggregatorAdapter`

### Base 主网

- `UnifiedOFTWorkflow`
- `FixedPairSwapAdapter`

这样做的原因：

- 源链 Polygon 的买入路径更像多段执行
- 目标链 Base 的卖出路径当前已经有明确样本池子
- 所以先让源链用聚合执行，目标链用固定卖出池子，最稳

## 三、部署参数表

下面这些是部署时就要定的。

| 参数名 | 示例值 | 用在哪 | 作用 | 是否建议当前固定 |
|---|---|---|---|---|
| `owner` | `0x1e274433D138708C36aF002395aEf3C173a35eC6` | 所有主合约/adapter | 管理员地址，负责配置 route、白名单、权限 | 是 |
| `source_aggregator_executor` | 后续用 OKX / 其他聚合执行目标地址 | `AggregatorAdapter` | 源链聚合 swap 的执行目标 | 暂定，部署前最终确认 |
| `base_pair` | `0x186696a647c554c7dbea30e295259aa46d40effc` | `FixedPairSwapAdapter` | Base 上固定卖出池子 | 是 |

## 四、链上配置参数表

这些不是部署时传，而是部署后由 `owner` 写进链上。

### 1. 白名单

| 参数名 | 示例值 | 用在哪 | 作用 |
|---|---|---|---|
| `caller` | `0x1e274433D138708C36aF002395aEf3C173a35eC6` | `setCallerApproval` | 谁能调用 workflow 主函数 |
| `watcher` | `0x1e274433D138708C36aF002395aEf3C173a35eC6` | `setCallerApproval` | 目标链监控到账并发起卖出的地址，通常也在 caller 白名单里 |
| `source_swapAdapter` | Polygon 上部署出的 `AggregatorAdapter` 地址 | `setSwapAdapterApproval` | Polygon 源链允许使用哪个 swap adapter |
| `dest_swapAdapter` | Base 上部署出的 `FixedPairSwapAdapter` 地址 | `setSwapAdapterApproval` | Base 目标链允许使用哪个 swap adapter |
| `bridgeAdapter` | Polygon 上部署出的 `LayerZeroOFTBridgeAdapter` 地址 | `setBridgeAdapterApproval` | Polygon 源链允许使用哪个 bridge adapter |

### 2. Polygon 源链 route

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | `keccak256("polygon-base-handl-usdt")` | 这条路线的唯一编号 |
| `tokenIn` | `0xc2132d05d31c914a87c6611c10748aeb04b58e8f` | 源链输入币，Polygon USDT |
| `oftToken` | `0xf4c3fac9c98aa62474998e299495b699dfdb00eb` | 源链要买入并跨链发送的 OFT |
| `swapAdapter` | Polygon `AggregatorAdapter` 地址 | 源链执行 swap 的 adapter |
| `bridgeAdapter` | Polygon `LayerZeroOFTBridgeAdapter` 地址 | 源链执行 bridge 的 adapter |
| `dstEid` | Base 主网 eid | 目标链 LayerZero endpoint id |
| `enabled` | `true` | 是否启用该 route |

### 3. Base 目标链 route

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | 与源链相同 | 保持 source/destination route 对应 |
| `oftToken` | `0x3bbcb624cb9a1f73163a886f460f47603e5e4425` | Base 上收到的 HANDL |
| `payoutToken` | `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` | Base 上最终卖成的 USDC |
| `swapAdapter` | Base `FixedPairSwapAdapter` 地址 | Base 目标链卖出 adapter |
| `enabled` | `true` | 是否启用该 route |

### 4. Bridge adapter 自身配置

| 参数名 | 示例值 | 用在哪 | 作用 |
|---|---|---|---|
| `supportedOft` | `0xf4c3fac9c98aa62474998e299495b699dfdb00eb` | `setSupportedOft` | 允许 Polygon HANDL 被 bridge 发送 |

## 五、每次调用时的参数

这些是每次发交易时才带的。

### 1. Polygon 源链调用 `swapAndBridge(...)`

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | `keccak256("polygon-base-handl-usdt")` | 选择源链 route |
| `amountIn` | 例如 `10000000` | 本次要用多少 USDT |
| `minBridgeAmount` | 例如略低于聚合器报价 | 最少要换出多少 HANDL |
| `recipient` | Base 上接收 HANDL 的地址，编码为 `bytes32` | 指定目标链接收者 |
| `sourceSwapData` | 聚合器执行数据，后面由链下脚本构造 | 源链 swap 的真实执行参数 |
| `bridgeOptions` | LayerZero gas 选项 | 目标链接收所需 gas |
| `composeMsg` | `0x` | 当前通常不使用 |
| `msg.value` | LayerZero 报价返回的原生费 | 支付跨链手续费 |

### 2. Base 目标链调用 `swapReceivedOFT(...)`

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | 与源链相同 | 选择目标链 route |
| `oftAmountIn` | 本次卖出的 HANDL 数量 | 卖出多少 OFT |
| `minAmountOut` | 例如略低于预估卖出值 | 最少卖出多少 USDC |
| `recipient` | 最终收 USDC 的地址 | 卖出结果打给谁 |
| `destinationSwapData` | 固定路径 `[HANDL, USDC]` 编码 | 目标链卖出路径 |

## 六、链下脚本参数表

这些不写到链上，只给脚本自己用。

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `watcher` | `0x1e274433D138708C36aF002395aEf3C173a35eC6` | 目标链监控并发起卖出的地址 |
| `POLYGON_MAINNET_RPC_URL` | 你实际使用的 Polygon RPC | Polygon 链接入 |
| `BASE_MAINNET_RPC_URL` | 你实际使用的 Base RPC | Base 链接入 |
| `SELL_SLIPPAGE_BPS` | `500` | watcher 卖出滑点 |
| `POLL_INTERVAL_MS` | `15000` | 轮询间隔 |
| `MAX_SELL_RETRIES` | `3` | 最大重试次数 |

## 七、实际部署顺序

### 第一步：部署 Polygon 主网合约

顺序建议：
1. `LayerZeroOFTBridgeAdapter`
2. `AggregatorAdapter`
3. `UnifiedOFTWorkflow`

### 第二步：部署 Base 主网合约

顺序建议：
1. `FixedPairSwapAdapter`
2. `UnifiedOFTWorkflow`

## 八、部署后配置顺序

### Polygon
1. 设置 `caller` 白名单
2. 设置 `swapAdapter` 白名单
3. 设置 `bridgeAdapter` 白名单
4. 设置 `supportedOft`
5. 设置 `sourceRoute`

### Base
1. 设置 `caller` 白名单
2. 设置 `swapAdapter` 白名单
3. 设置 `destinationRoute`

## 九、测试顺序

### 1. 源链只测 swap + bridge 前半段
先做：
- Polygon fork 验证
- 看 `USDT -> HANDL` 的聚合执行是否稳定

### 2. 目标链只测卖出
先做：
- Base fork 验证
- 看 `HANDL -> USDC` 是否稳定

### 3. 小额真实主网联调
最后再做：
- 小额 Polygon `swapAndBridge`
- 等 Base 到账
- 用 watcher 或手动调用 `swapReceivedOFT`

## 十、怎么看结果是不是正常

### 源链正常的标志
- `tokenIn` 余额减少
- bridge adapter 或 bridge 记录里有对应 OFT 数量
- LayerZero 报价和发送成功

### 目标链正常的标志
- 收到 `HANDL`
- `HANDL` 被 workflow 拉走
- `USDC` 增加
- watcher 能记录到账和卖出 tx 对应关系

## 十一、当前最关键的提醒

### 1. 这套参数是针对 `HANDL` 样本路线的
不是通用所有 token 的最终版本。

### 2. 当前最不稳定的部分是源链聚合执行
因为这里要依赖：
- 路径
- calldata
- 聚合器执行入口

### 3. Base 卖出这半边更稳定
因为：
- 样本池子明确
- 路径更简单

## 十二、当前最推荐的使用方式

先按这套参数做：

- Polygon `USDT -> HANDL`
- Base `HANDL -> USDC`

验证通过后，再扩：
- Polygon `USDC -> HANDL`
- `ZRO` 路线
- 后续更多 OFT

## 十三、一句话总结

如果你现在就是要先试一条主网路线，那我建议：

- Polygon 源链：`USDT -> HANDL`
- Base 目标链：`HANDL -> USDC`
- 源链用 `AggregatorAdapter`
- 目标链用 `FixedPairSwapAdapter`

这是当前最容易收敛成可部署、可测试、可解释的一条路线。
