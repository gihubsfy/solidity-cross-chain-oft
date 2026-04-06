# 主网部署前检查清单：HANDL 样本版

这份清单回答的是一个实际问题：

> 如果现在要把 `Polygon USDT -> HANDL -> Base -> USDC` 这条路线部署到主网，离真正可上线还差什么？

它不是参数表，也不是原理说明，而是一份可执行检查清单。

适用路线：

```text
Polygon:
USDT -> USDC -> HANDL -> LayerZero -> Base

Base:
HANDL -> USDC
```

## 一、当前已经完成的验证

### 1. 主流程架构已完成

- `UnifiedOFTWorkflow`
- `LayerZeroOFTBridgeAdapter`
- `swapAdapter` 体系
- watcher / executor

### 2. 测试网真实闭环已完成

已验证：
- 真实跨链
- 真实 DEX 风格池子
- 目标链卖出
- watcher 自动卖出

### 3. 主网 fork 验证已完成

已验证：
- Polygon fork 上，我们自己的源链 workflow 可以完成同类动作
- Base fork 上，我们自己的目标链 workflow 可以完成同类动作
- Polygon fork 上，`AggregatorAdapter + OKX payload + HANDL` 的 source side 已执行成功

### 4. HANDL 路线信息已明确

已确认地址：
- Polygon `USDT`
  - `0xc2132d05d31c914a87c6611c10748aeb04b58e8f`
- Polygon `USDC`
  - `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359`
- Polygon `HANDL`
  - `0xf4c3fac9c98aa62474998e299495b699dfdb00eb`
- Base `HANDL`
  - `0x3bbcb624cb9a1f73163a886f460f47603e5e4425`
- Base `USDC`
  - `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

## 二、部署前必须确认的事项

### 1. 管理与执行地址

- [ ] `owner` 是否最终确定
- [ ] `caller` 是否最终确定
- [ ] `watcher` 是否最终确定
- [ ] 是否都使用同一个地址
- [ ] 是否要换成多签 / 分角色地址

当前建议值：
- `0x1e274433D138708C36aF002395aEf3C173a35eC6`

### 2. 目标链 `dstEid`

- [ ] Base 主网 `dstEid` 是否已经用官方信息最终确认

说明：
- 这是 route 配置里的关键参数
- 不能沿用测试网值
- 上主网前必须再核一次

### 3. 真实 OFT 状态

- [ ] Polygon `HANDL` 是否确认为真实可用 OFT
- [ ] Base `HANDL` 是否确认为对应 OFT
- [ ] 两边 OFT 的 peer 是否已正确配置
- [ ] 真实主网上是否允许正常发送

### 4. Bridge adapter 白名单

- [ ] Polygon 上 `HANDL` 是否已加入 `setSupportedOft(...)`

### 5. 目标链卖出池子

- [ ] Base `HANDL -> USDC` 的样本卖出池子是否仍然可用
- [ ] `0x186696a647c554c7dbea30e295259aa46d40effc` 是否仍是首选
- [ ] 如果不是，是否要切换为其他 pair 或聚合执行

### 6. 源链执行策略

必须明确：
- [ ] 是否接受第一版主网先使用 `AggregatorAdapter`
- [ ] 是否接受依赖 OKX / 其他聚合执行入口
- [ ] 如果不接受，是否要先实现 `MultiStepSwapAdapter`

当前建议：
- Polygon 源链第一版先走 `AggregatorAdapter`
- Base 目标链第一版先走 `FixedPairSwapAdapter`

## 三、部署对象清单

### Polygon 主网需要部署

- [ ] `LayerZeroOFTBridgeAdapter`
- [ ] `AggregatorAdapter`
- [ ] `UnifiedOFTWorkflow`

### Base 主网需要部署

- [ ] `FixedPairSwapAdapter`
- [ ] `UnifiedOFTWorkflow`

## 四、链上初始化清单

### Polygon

- [ ] `setCallerApproval(caller, true)`
- [ ] `setSwapAdapterApproval(sourceAggregatorAdapter, true)`
- [ ] `setBridgeAdapterApproval(layerZeroBridgeAdapter, true)`
- [ ] `setSupportedOft(Polygon HANDL, true)`
- [ ] `setSourceRoute(...)`

### Base

- [ ] `setCallerApproval(watcher, true)`
- [ ] `setSwapAdapterApproval(baseFixedPairAdapter, true)`
- [ ] `setDestinationRoute(...)`

## 五、调用参数检查

### 源链

- [ ] `amountIn` 是否为小额测试量
- [ ] `minBridgeAmount` 是否不是过于严格
- [ ] `recipient` 是否是目标链 watcher 地址
- [ ] `sourceSwapData` 是否来自当前最新可执行 payload
- [ ] `bridgeOptions` 是否已按主网报价调整
- [ ] `msg.value` 是否来自最新 `quoteBridgeFee(...)`

### 目标链

- [ ] `oftAmountIn` 是否与到账数量一致
- [ ] `minAmountOut` 是否合理
- [ ] `recipient` 是否正确
- [ ] `destinationSwapData` 是否与当前卖出池子匹配

## 六、watcher 检查

- [ ] watcher 使用的私钥与 `WATCH_ADDRESS` 一致
- [ ] watcher 地址已在目标链 caller 白名单中
- [ ] watcher 的 `FACTORY_ADDRESS` / 路由参数正确
- [ ] watcher 状态文件路径正确
- [ ] `MAX_SELL_RETRIES` 已确认
- [ ] `SELL_SLIPPAGE_BPS` 已确认
- [ ] `POLL_INTERVAL_MS` 已确认

## 七、小额实盘建议

### 第一步
- [ ] 先用极小 `USDT` 数量在 Polygon 主网试一次 source side
- [ ] 确认 bridge 发出成功

### 第二步
- [ ] 在 Base 主网确认 `HANDL` 到账
- [ ] 手动执行一次 `swapReceivedOFT(...)`

### 第三步
- [ ] watcher 自动运行一次
- [ ] 观察到账、卖出、日志、状态文件是否都正常

### 第四步
- [ ] 再决定是否放大金额

## 八、当前真正的阻塞项

如果只问“现在离主网第一笔最小测试还差什么”，核心就是这些：

- [ ] 最终确认 `dstEid`
- [ ] 最终确认源链聚合执行方案
- [ ] 把 `AggregatorAdapter` 的 `spender / target / payload` 组装流程固化成可重复脚本

## 九、上线判断标准

只有当下面这些都满足时，才建议上线第一笔主网小额测试：

- [ ] 参数表已最终确认
- [ ] Polygon / Base 部署地址已落表
- [ ] route 已配置
- [ ] 白名单已配置
- [ ] `supportedOft` 已配置
- [ ] source side fork 验证通过
- [ ] destination side fork 验证通过
- [ ] watcher 跑通
- [ ] 主网 gas / bridge fee 可接受

## 十、一句话总结

现在离主网试一笔已经不远了。

当前最关键的不是再补很多新功能，而是：
- 确认 `HANDL` 这条路线的主网最终参数
- 确认源链聚合执行方式
- 然后做一轮最小金额实盘