# fork 上验证我们自己的合约

这部分不是单纯 replay 别人的交易，而是：

1. 先在 fork 上还原真实主网状态
2. 再在 fork 上部署我们自己的合约
3. 最后用我们自己的合约去执行同类动作

这样验证的重点不是“别人合约会不会工作”，而是：
- 我们自己的 `UnifiedOFTWorkflow`
- 我们自己的各类 adapter

在主网真实状态下，能不能完成同类业务动作。

## 已有脚本

- `scripts/fork/replay-three-step-mainnet-flow.js`
- `scripts/fork/replay-tx-on-hardhat-fork.js`
- `scripts/fork/validate-our-source-contract-on-polygon-fork.js`
- `scripts/fork/validate-our-destination-contract-on-base-fork.js`
- `scripts/fork/validate-handl-sample-b-source-on-polygon-fork.js`
- `scripts/fork/validate-handl-sample-b-destination-on-base-fork.js`
- `scripts/fork/validate-aggregator-source-on-polygon-fork.js`
- `scripts/fork/validate-aggregator-destination-on-base-fork.js`

## 已验证的内容

### 1. Polygon source side

已验证：
- `UnifiedOFTWorkflow + UniswapV2SwapAdapter + ForkBridgeRecorderAdapter`
- 在 Polygon 主网 fork 状态下，可以完成 source side 的同类动作

### 2. Base destination side

已验证：
- `UnifiedOFTWorkflow + FixedPairSwapAdapter`
- 在 Base 主网 fork 状态下，可以把到账 OFT 卖成目标稳定币

### 3. HANDL 的聚合执行 source side

已验证：
- `UnifiedOFTWorkflow + AggregatorAdapter + ForkBridgeRecorderAdapter`
- 使用 OKX 返回的真实 swap payload
- 在 Polygon 主网 fork 上完成 `USDT -> HANDL -> bridge 前半段`

结果：
- fork block: `85168819`
- approved target: `0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
- approved spender: `0x3B86917369B83a6892f553609F3c2F439C184e31`
- bridge recorded amount: `938445635368320483055`
- validation tx: `0x07c1f3a931c4aec1deb66822af5ef8aa4208e55d4cbbc79fc8b3c0c4f6def3b2`

### 4. ZRO 的聚合执行 source side

已验证：
- `UnifiedOFTWorkflow + AggregatorAdapter + ForkBridgeRecorderAdapter`
- 使用 OKX 返回的真实 swap payload
- 在 Polygon 主网 fork 上完成 `USDT -> ZRO -> bridge 前半段`

结果：
- fork block: `85171111`
- approved target: `0x057cfd839aa88994d1a8a8c6d336cf21550f05ef`
- approved spender: `0x3B86917369B83a6892f553609F3c2F439C184e31`
- bridge recorded amount: `526153721769485812`
- validation tx: `0x9007e22c8dba434292a8581a8e4ab8adce7dab882b4a4d0b3560ec82c8aac48f`

### 5. ZRO 的聚合执行 destination side

已验证：
- `UnifiedOFTWorkflow + AggregatorAdapter`
- 使用 OKX 返回的真实 sell payload
- 在 Base 主网 fork 上完成 `ZRO -> USDC`

结果：
- fork block: `44337028`
- approved target: `0x4409921ae43a39a11d90f7b7f96cfd0b8093d9fc`
- approved spender: `0x57df6092665eb6058DE53939612413ff4B09114E`
- validation tx: `0xd7e489ad820bd49561ceb7120b3e285d69b07cacf1fcee53aad23dc908908a09`
- user `USDC` before: `0`
- user `USDC` after: `1863263`

## 这一步的边界

这仍然不是“真实 LayerZero 网络消息在本地完整跑通”。

它验证的是：
- 我们自己的链上主流程
- 在主网真实链状态下
- 能不能完成 source side 和 destination side 的同类动作

跨链网络本身仍然通过：
- source side 的 `ForkBridgeRecorderAdapter`
- destination side 的到账回放 / credit 状态

来衔接。

## 当前意义

这一步已经足以回答一个核心问题：

> 我们自己部署的主流程合约，在真实主网状态下能不能工作？

当前答案是：
- `HANDL` 路线已经可以回答“可以，而且 source side 的聚合执行已经验证通过”
- `ZRO` 路线进一步证明“更复杂的多 DEX 聚合路径，source side 和 destination side 两半都能被我们自己的 workflow + AggregatorAdapter 在 fork 上执行成功”