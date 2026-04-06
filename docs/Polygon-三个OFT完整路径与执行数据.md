# Polygon 三个 OFT 完整路径与执行数据

这份文档覆盖当前重点分析的 3 个 Polygon OFT：
- `HANDL`
- `ZRO`
- `SOPH`

目标是把两层信息放在一起：
1. 人能看懂的可读路径
2. OKX 聚合器是否能返回可执行交易 payload（`tx.to / tx.data / tx.value`）

## 数据来源

路径来源：
- `polygon_confirmed_oft_paths_okx.json`

OKX payload 可执行性来源：
- `polygon_three_ofts_okx_swap_payloads.json`
- `polygon_handl_usdt_to_oft_swap.json`

说明：
- 路径表用于判断“这条路怎么走”。
- payload 结果用于判断“能不能继续推进到 AggregatorAdapter 执行层”。
- 如果两者冲突，以 JSON 原始结果为准。

## 结论先看

### 当前可继续推进主网执行的 Polygon OFT

- `HANDL`
- `ZRO`

### 当前不建议优先推进的 Polygon OFT

- `SOPH`

原因：
- `HANDL` 和 `ZRO` 不仅有可读路径，OKX 还返回了可执行 payload。
- `HANDL` 的 source side 还已经用我们自己的 `AggregatorAdapter` 在 fork 上执行成功。
- `SOPH` 当前连 quote 都不稳定，OKX 直接提示高风险，不适合继续往执行层推进。

## HANDL

- Polygon OFT:
  - `0xf4c3fac9c98aa62474998e299495b699dfdb00eb`
- Base OFT:
  - `0x3bbcb624cb9a1f73163a886f460f47603e5e4425`
- 映射来源：
  - 主网交易样本确认

### 可读路径

- `USDT -> HANDL`
  - `USDT -> USDC.e -> USDC -> HANDL`
  - 主要涉及：`QuickSwap V3 -> QuickSwap V3 -> QuickSwap`

- `USDC -> HANDL`
  - `USDC -> HANDL`
  - 主要涉及：`QuickSwap`

- `HANDL -> USDT`
  - `HANDL -> USDC -> USDT`
  - 主要涉及：`QuickSwap -> Uniswap V4`

- `HANDL -> USDC`
  - `HANDL -> USDC`
  - 主要涉及：`QuickSwap`

### OKX payload 可执行性

- `USDT -> HANDL`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 3978`
  - `value = 0`

- `USDC -> HANDL`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 522`
  - `value = 0`

- `HANDL -> USDT`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 4554`
  - `value = 0`

- `HANDL -> USDC`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 522`
  - `value = 0`

### 进一步验证：AggregatorAdapter fork 成功

除了 quote 和 swap payload 结果，`HANDL` 这条 Polygon source 路线还已经完成了一次我们自己合约的 fork 执行验证：

- fork block: `85168819`
- approved target: `0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
- approved spender: `0x3B86917369B83a6892f553609F3c2F439C184e31`
- source side validation tx: `0x07c1f3a931c4aec1deb66822af5ef8aa4208e55d4cbbc79fc8b3c0c4f6def3b2`
- bridge recorded amount: `938445635368320483055`

这说明 `HANDL` 不只是“可以拿到 payload”，而是：
- `UnifiedOFTWorkflow`
- `AggregatorAdapter`
- `ForkBridgeRecorderAdapter`

已经在 Polygon 主网 fork 上成功完成了 `USDT -> HANDL -> bridge 前半段`。

### 解释

`HANDL` 是当前最稳的 Polygon 主网样本：
- 路径信息完整
- 主网交易样本已验证
- OKX payload 可执行性完整
- source side 的聚合执行 fork 也已经跑通

如果要先挑一条主网路线做聚合执行侧落地，`HANDL` 仍然是第一优先级。

## ZRO

- Polygon OFT:
  - `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- Base OFT:
  - `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- 映射来源：
  - LayerZero 分组数据

### 可读路径

- `USDT -> ZRO`
  - `USDT -> ZRO`
  - 主要涉及：`Uniswap V3`

- `USDC -> ZRO`
  - `USDC -> USDT -> ZRO`
  - 主要涉及：`Uniswap V4 -> Uniswap V3`

- `ZRO -> USDT`
  - `ZRO -> WPOL -> USDC -> USDT`
  - 主要涉及多个主流池子，具体以 JSON 为准

- `ZRO -> USDC`
  - `ZRO -> WPOL -> LINK -> USDC`
  - 主要涉及：`Uniswap V3 -> Uniswap V3 -> QuickSwap V3`

### OKX payload 可执行性

- `USDT -> ZRO`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 4234`
  - `value = 0`

- `USDC -> ZRO`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 1930`
  - `value = 0`

- `ZRO -> USDT`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 1930`
  - `value = 0`

- `ZRO -> USDC`
  - `quoteOk = true`
  - `swapOk = true`
  - `tx.to = 0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
  - `hasData = true`
  - `dataLength = 4234`
  - `value = 0`

### 解释

`ZRO` 比 `HANDL` 更复杂：
- 多跳更常见
- 更依赖聚合执行层
- 但 OKX payload 也已经完整可拿

所以它是第二优先级，尤其适合作为 `AggregatorAdapter` 的能力样本。

## SOPH

- Polygon OFT:
  - `0xeb971fd26783f32694dbb392dd7289de23109148`
- Base OFT:
  - `0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742`
- 映射来源：
  - LayerZero 分组数据

### 可读路径

当前不建议依赖路径表推进执行。

### OKX payload 可执行性

- `USDT -> SOPH`
  - `quoteOk = false`
  - `swapOk = false`
  - 错误：交易价值与报价路径偏差过大，存在资产风险

- `USDC -> SOPH`
  - `quoteOk = false`
  - `swapOk = false`
  - 错误：交易价值与报价路径偏差过大，存在资产风险

- `SOPH -> USDT`
  - `quoteOk = false`
  - `swapOk = false`

- `SOPH -> USDC`
  - `quoteOk = false`
  - `swapOk = false`

### 解释

`SOPH` 当前的问题不是“地址找不到”，而是：
- Polygon 映射虽然存在
- 但 OKX 不认为这条路在执行上足够安全

所以现在不建议优先把它接进主网路线。

## 建议的优先级

### 第一优先级
- `HANDL`

### 第二优先级
- `ZRO`

### 当前不建议推进
- `SOPH`

## 下一步建议

如果要继续往主网真实部署方向收敛：

1. 先用 `HANDL` 做第一条主网试运行路线
2. 再用 `ZRO` 验证 `AggregatorAdapter` 的复杂路径能力
3. 暂时不要把 `SOPH` 纳入首批主网路线