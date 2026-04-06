# 在主网 Fork 上验证我们自己的合约

这一部分不是回放别人现成的交易，而是：

1. 先在 fork 上重放真实主网行为的一部分
2. 再在 fork 上部署我们自己的合约
3. 最后用我们自己的合约去执行类似动作

这样验证的不是“别人合约会不会工作”，而是：

- 我们自己的 `UnifiedOFTWorkflow`
- 我们自己的 adapter

在主网真实状态下，能不能完成同类事情。

## 已新增脚本

- `scripts/fork/validate-our-source-contract-on-polygon-fork.js`
- `scripts/fork/validate-our-destination-contract-on-base-fork.js`

## Polygon fork 验证什么

- 重放 Polygon 源链真实交易之前的主网状态
- 在 fork 上部署：
  - `UnifiedOFTWorkflow`
  - `UniswapV2SwapAdapter`
  - `ForkBridgeRecorderAdapter`
- 用我们自己的 workflow 走真实主网 Polygon 路由
- bridge 不做真实跨链，而是由 `ForkBridgeRecorderAdapter` 记录输出

## Base fork 验证什么

- 先回放 Base 的 receive / credit 交易，让用户拿到真实主网状态下的 HANDL
- 在 fork 上部署：
  - `UnifiedOFTWorkflow`
  - `FixedPairSwapAdapter`
- 用我们自己的 workflow 把 HANDL 卖成 USDC

## 为什么这样验证

因为你真正关心的是：

- 测试部署的合约效果是不是满足需求

这比单纯 replay 别人的 tx 更直接。

## 这一步的边界

它仍然不是“真实跨链网络本身”验证。

但它已经可以验证：

- 我们自己的链上主流程合约
- 在主网真实状态下
- 能不能完成同类业务动作
