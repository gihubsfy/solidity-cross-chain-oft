# 主网参数完整表：ZRO 样本版

这份文档的目标和 `HANDL` 样本版一致：

1. 让接手的人知道要部署哪些合约
2. 知道参数该填什么
3. 知道哪些值已经确认，哪些只是建议
4. 知道怎么测试和怎么实际使用

适用样本路线：

```text
Polygon:
USDT / USDC -> ZRO -> LayerZero -> Base

Base:
ZRO -> USDT / USDC
```

当前这份文档针对的是：
- 源链：Polygon 主网
- 目标链：Base 主网
- OFT：ZRO

## 一、这条样本路线里已确认的真实地址

### 1. 源链 Polygon

- 输入币 `USDT`
  - `0xc2132d05d31c914a87c6611c10748aeb04b58e8f`
- 输入币 `USDC`
  - `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359`
- OFT `ZRO`
  - `0x6985884c4392d348587b19cb9eaaf157f13271cd`

### 2. 目标链 Base

- OFT `ZRO`
  - `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- 输出币 `USDC`
  - `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`
- 输出币 `USDT`
  - `0xfde4c96c8593536e31f229ea8f37b2ada2699bb2`

### 3. Polygon 路径现状

当前已确认：
- `USDT -> ZRO`：可用
- `USDC -> ZRO`：可用
- `ZRO -> USDT`：可用
- `ZRO -> USDC`：可用

### 4. Base 路径现状

当前已确认：
- `ZRO -> USDC`：可用
- `ZRO -> USDT`：可用

注意：
- `ZRO` 的两边路径都更像聚合执行路线
- 相比 `HANDL`，它更适合用来证明 `AggregatorAdapter` 的通用性

## 二、建议的主网部署形态

### Polygon 主网

- `UnifiedOFTWorkflow`
- `LayerZeroOFTBridgeAdapter`
- `AggregatorAdapter`

### Base 主网

- `UnifiedOFTWorkflow`
- `AggregatorAdapter`

原因：
- `ZRO` 的源链买入和目标链卖出都更常见多跳 / 多 DEX 路径
- 因此两边都更适合直接走聚合执行

## 三、部署参数表

| 参数名 | 示例值 | 用在哪 | 作用 | 当前建议 |
|---|---|---|---|---|
| `owner` | `0x1e274433D138708C36aF002395aEf3C173a35eC6` | 所有主合约/adapter | 管理员地址 | 固定 |
| `source_aggregator_executor` | `0x057cfd839aa88994d1a8a8c6d336cf21550f05ef` | Polygon `AggregatorAdapter` | 源链执行聚合 swap 的目标地址 | 已确认 |
| `source_aggregator_spender` | `0x3B86917369B83a6892f553609F3c2F439C184e31` | Polygon `AggregatorAdapter` | Polygon 上 `tokenIn` 授权给 OKX 执行器的 spender | 已确认 |
| `dest_aggregator_executor` | `0x4409921ae43a39a11d90f7b7f96cfd0b8093d9fc` | Base `AggregatorAdapter` | 目标链执行聚合卖出的目标地址 | 已确认 |
| `dest_aggregator_spender` | `0x57df6092665eb6058DE53939612413ff4B09114E` | Base `AggregatorAdapter` | Base 上 `ZRO` 授权给 OKX 执行器的 spender | 已确认 |

## 四、链上配置参数表

### 1. 白名单

| 参数名 | 示例值 | 用在哪 | 作用 |
|---|---|---|---|
| `caller` | `0x1e274433D138708C36aF002395aEf3C173a35eC6` | `setCallerApproval` | 允许调用 workflow |
| `watcher` | `0x1e274433D138708C36aF002395aEf3C173a35eC6` | `setCallerApproval` | 目标链监控到账并卖出 |
| `source_swapAdapter` | Polygon `AggregatorAdapter` 地址 | `setSwapAdapterApproval` | Polygon 源链允许使用哪个 swap adapter |
| `dest_swapAdapter` | Base `AggregatorAdapter` 地址 | `setSwapAdapterApproval` | Base 目标链允许使用哪个 swap adapter |
| `bridgeAdapter` | Polygon `LayerZeroOFTBridgeAdapter` 地址 | `setBridgeAdapterApproval` | Polygon 源链允许使用哪个 bridge adapter |

### 2. Polygon 源链 route

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | `keccak256("polygon-base-zro-usdt")` 或 `polygon-base-zro-usdc` | 每条路线唯一编号 |
| `tokenIn` | Polygon `USDT` 或 `USDC` | 这条 route 的起始输入币 |
| `oftToken` | `0x6985884c4392d348587b19cb9eaaf157f13271cd` | Polygon 上的 ZRO |
| `swapAdapter` | Polygon `AggregatorAdapter` 地址 | 源链执行买入 |
| `bridgeAdapter` | Polygon `LayerZeroOFTBridgeAdapter` 地址 | 源链执行 bridge |
| `dstEid` | Base 主网 eid | 目标链 LayerZero endpoint id |
| `enabled` | `true` | 是否启用 |

### 3. Base 目标链 route

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | 与源链相同 | 保持 source/destination route 对应 |
| `oftToken` | `0x6985884c4392d348587b19cb9eaaf157f13271cd` | Base 上的 ZRO |
| `payoutToken` | Base `USDC` 或 `USDT` | 最终卖出的稳定币 |
| `swapAdapter` | Base `AggregatorAdapter` 地址 | Base 目标链卖出 adapter |
| `enabled` | `true` | 是否启用 |

## 五、调用参数表

### Polygon 源链 `swapAndBridge(...)`

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | `keccak256("polygon-base-zro-usdt")` | 选择源链 route |
| `amountIn` | 例如 `1000000` | 本次投入多少 `USDT` |
| `minBridgeAmount` | 小额测试时可先放宽 | 源链最少接受多少 `ZRO` |
| `recipient` | Base watcher 地址编码为 `bytes32` | 目标链接收者 |
| `sourceSwapData` | OKX 聚合器 payload 编码 | 源链真实执行参数 |
| `bridgeOptions` | LayerZero gas 选项 | 目标链接收所需 gas |
| `msg.value` | `quoteBridgeFee(...)` 返回的原生费 | 支付跨链手续费 |

### Base 目标链 `swapReceivedOFT(...)`

| 参数名 | 示例值 | 作用 |
|---|---|---|
| `routeId` | 与源链相同 | 选择目标链 route |
| `oftAmountIn` | 本次卖出的 ZRO 数量 | 卖出多少 OFT |
| `minAmountOut` | 例如略低于预估值 | 最少卖出多少稳定币 |
| `recipient` | 最终收稳定币的地址 | 卖出结果打给谁 |
| `destinationSwapData` | Base 侧聚合器 payload 编码 | 目标链卖出参数 |

## 六、当前验证结果

### 1. OKX payload 可执行性

Polygon 上已确认：
- `USDT -> ZRO`：`quoteOk = true`、`swapOk = true`
- `USDC -> ZRO`：`quoteOk = true`、`swapOk = true`
- `ZRO -> USDT`：`quoteOk = true`、`swapOk = true`
- `ZRO -> USDC`：`quoteOk = true`、`swapOk = true`

Base 上已确认：
- `ZRO -> USDC`：可拿到完整 payload
- `ZRO -> USDT`：可拿到完整 payload

### 2. Polygon source side fork 已通过

已完成一次我们自己合约的 fork 验证：
- fork block: `85171111`
- payload file: `polygon_zro_usdt_to_oft_swap.json`
- approved target: `0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
- approved spender: `0x3B86917369B83a6892f553609F3c2F439C184e31`
- bridge recorded amount: `526153721769485812`
- validation tx: `0x9007e22c8dba434292a8581a8e4ab8adce7dab882b4a4d0b3560ec82c8aac48f`

### 3. Base destination side fork 已通过

已完成一次我们自己合约的 fork 验证：
- fork block: `44337028`
- payload file: `base_zro_to_usdc_swap.json`
- approved target: `0x4409921ae43a39a11d90f7b7f96cfd0b8093d9fc`
- approved spender: `0x57df6092665eb6058DE53939612413ff4B09114E`
- validation tx: `0xd7e489ad820bd49561ceb7120b3e285d69b07cacf1fcee53aad23dc908908a09`
- user `ZRO` before: `190112323309274256779154`
- user `ZRO` after: `190111323309274256779154`
- user `USDC` before: `0`
- user `USDC` after: `1863263`

这说明：
- `ZRO` 不只是“有路径”
- 也不只是“能拿到 payload”
- 而是 source side 和 destination side 两半都已经被我们自己的 workflow + AggregatorAdapter 在主网 fork 状态下验证通过

## 七、推荐测试顺序

1. 先以 `USDT -> ZRO -> Base -> USDC` 作为小额主网候选路线
2. 继续补一份 Base `ZRO -> USDT` 的 destination payload 作为备用卖出方向
3. 如果你只想先上线一条更稳的路线，仍然建议 `HANDL` 第一、`ZRO` 第二

## 八、一句话结论

`ZRO` 现在已经不是“理论可做”，而是：
- Polygon source side 聚合执行 fork：通过
- Base destination side 聚合执行 fork：通过

所以它已经成为继 `HANDL` 之后，第二条完整度很高的 `Polygon -> Base` 主网样本路线。