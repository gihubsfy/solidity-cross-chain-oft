# 通用多链多 OFT 架构设计说明

这份文档不再围绕某一个样本链路来讲，而是直接回答系统应该如何具备通用性。

目标不是：
- 只支持 Polygon -> Base
- 只支持某一个 OFT
- 只支持某一个交易对

目标是：
- 支持多个源链
- 支持多个目标链
- 支持多个 OFT
- 支持多个输入币和输出币
- 尽量不因为新增一个链或一个 OFT 就重写 Solidity

## 一、正确的抽象层级

这个系统应该分成四层：

1. 链级部署层
2. Route 配置层
3. 每次交易调用层
4. 链下执行与监控层

这四层不要混在一起。

## 二、链级部署层

“链级部署层”指的是：

每条链上都部署同一份通用合约代码，但链与链之间是隔离的，所以每条链都需要自己的合约实例。

### 每条链上应部署的核心组件

#### 源链需要

- `UnifiedOFTWorkflow`
- `LayerZeroOFTBridgeAdapter`
- 一个或多个 `SwapAdapter`

#### 目标链需要

- `UnifiedOFTWorkflow`
- 一个或多个 `SwapAdapter`

#### 可选组件

- 真实 DEX adapter
- 特定协议 adapter
- 链下 watcher 配套使用的辅助合约

### 这一层的核心结论

- **同一份代码可以跨链复用**
- **每条链仍然要部署自己的实例**
- **不是每新增一个 token 都重部署**
- **而是每新增一条链，部署一次同样的通用实例**

## 三、Route 配置层

这是系统通用性的关键。

不应该把“Polygon -> Base -> HANDL -> USDC”这种样本流程写死在 Solidity 里。

应该写成：
- `routeId -> sourceRouteConfig`
- `routeId -> destinationRouteConfig`

### 1. SourceRouteConfig 应包含

- `tokenIn`
  - 源链输入币
- `oftToken`
  - 源链要买入并跨链发送的 OFT
- `swapAdapter`
  - 源链 swap 用哪个 adapter
- `bridgeAdapter`
  - 源链 bridge 用哪个 adapter
- `dstEid`
  - 目标链的 LayerZero eid
- `enabled`
  - 路由是否启用

### 2. DestinationRouteConfig 应包含

- `oftToken`
  - 目标链收到的 OFT
- `payoutToken`
  - 目标链最终要卖成的币
- `swapAdapter`
  - 目标链卖出用哪个 adapter
- `enabled`
  - 路由是否启用

### 3. 这一层的核心结论

新增一条新路线时，通常只需要：
- 在对应链上新增 route 配置
- 不需要重写主流程合约

例如：
- 新增一个新的 OFT
- 新增一个新的 `tokenIn`
- 新增一个新的 `payoutToken`
- 新增一个新的目标链

如果目标链已经部署了 workflow，只要补 route 即可。

## 四、每次交易调用层

这一层是每次用户或机器人实际发交易时带的参数。

### 源链调用

`swapAndBridge(...)`

应只关心这类会变化的参数：
- `routeId`
- `amountIn`
- `minBridgeAmount`
- `recipient`
- `sourceSwapData`
- `bridgeOptions`
- `composeMsg`
- `msg.value`

### 目标链调用

`swapReceivedOFT(...)`

应只关心这类会变化的参数：
- `routeId`
- `oftAmountIn`
- `minAmountOut`
- `recipient`
- `destinationSwapData`

### 这一层的核心结论

这层是“交易输入”，不是“系统配置”。

## 五、链下执行与监控层

这是系统真正能自动化运行的关键。

Solidity 合约不能自己监控余额，也不能自己定时执行，所以必须有链下程序。

### watcher / executor 应负责

- 监控目标链 OFT 到账
- 识别到账事件
- 读取目标链池子状态
- 估算卖出结果
- 计算 `minAmountOut`
- 调用 `swapReceivedOFT(...)`
- 做失败重试
- 做去重
- 记录 source tx 与 destination sell tx 的关联

### 这一层的核心结论

- 链下脚本不是附属品，而是系统核心部分
- 没有 watcher，就只能人工卖出

## 六、哪些情况需要重部署

### 需要重部署的情况

1. 新增一条从未部署过 workflow 的链
2. 需要新增一种新的 adapter 合约，而链上还没有该 adapter 实例
3. 需要修改 Solidity 逻辑本身

### 不需要重部署的情况

1. 新增一个新的 OFT 路线
2. 新增一个新的 `tokenIn`
3. 新增一个新的 `payoutToken`
4. 新增一个新的源链到目标链组合，但这两条链上已存在 workflow 实例
5. 替换某条 route 的参数

也就是说，系统应尽量做到：
- **新增业务路线靠配置完成**
- **新增链才需要部署实例**

## 七、为什么前面的样本链路仍然有价值

虽然 Polygon / Base / HANDL 只是样本，不是系统边界，但它们非常有价值，因为它们验证了：

1. 这套通用架构不是空想
2. 真实跨链闭环能跑通
3. 真实 DEX 池子能接进来
4. watcher 可以工作
5. 我们自己的合约在主网状态下也能完成同类动作

所以样本的作用是：
- 证明通用架构是成立的

而不是：
- 把系统限制死在某一条链路上

## 八、当前合约在这个架构里的位置

### 当前主合约

- `src/examples/UnifiedOFTWorkflow.sol`

它的角色是：
- 通用 workflow 核心

### 当前 bridge adapter

- `src/adapters/LayerZeroOFTBridgeAdapter.sol`

它的角色是：
- 通用桥接层

### 当前 swap adapter

- `src/adapters/UniswapV2SwapAdapter.sol`
- `src/adapters/V2PairSwapAdapter.sol`

它们的角色是：
- DEX 接入层

### 当前 watcher

- `scripts/testnet/watch-destination-balance-and-sell.js`

它的角色是：
- 链下目标链自动卖出执行器

## 九、当前最重要的设计原则

### 原则 1
主流程合约通用，route 配置具体。

### 原则 2
新增 token 或新增 route，优先通过配置解决，而不是通过重写 Solidity 解决。

### 原则 3
链上合约负责执行，链下 watcher 负责监控和调度。

### 原则 4
样本链路用于验证通用架构，不是系统边界。

## 十、后续建议

如果后面真的要往生产化收敛，建议按这个顺序：

1. 固化链级部署模板
2. 固化 route 配置模板
3. 固化 watcher 运行模板
4. 做主网只读验证和小额实测
5. 最后再扩大支持的链和 OFT 集合

## 十一、一句话总结

你真正要的不是“某个链、某个 token 的专用合约”。

你要的是：

- **每条链部署一份通用 workflow**
- **每条业务路线通过 route 配置扩展**
- **每个 OFT / token 组合通过配置接入**
- **链下 watcher 负责到账后的自动执行**

这才是具备通用性的多链多 OFT 系统。
