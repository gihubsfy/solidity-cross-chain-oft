# Amoy + Base Sepolia 联调清单

这份清单对应当前仓库里的最稳方案：

1. 真实 LayerZero OFT 负责跨链
2. `MockSwapAdapter` 先负责两边 swap
3. `UnifiedOFTWorkflow` 负责把流程串起来

## 你现在已经有的

- 测试钱包私钥
- Amoy gas
- Base Sepolia gas
- 本地编译测试环境

## 还需要你确认或补充的

- `AMOY_ENDPOINT_V2`
- `BASE_SEPOLIA_ENDPOINT_V2`

说明：
- 这两个地址建议从 LayerZero 官方部署页确认后填进 `.env`
- 当前仓库已经给了 `.env.example`

## 这次联调的推荐顺序

### 第一步：准备环境变量

复制 `.env.example` 为 `.env`，至少填写：

- `PRIVATE_KEY`
- `AMOY_RPC_URL`
- `BASE_SEPOLIA_RPC_URL`
- `AMOY_ENDPOINT_V2`
- `BASE_SEPOLIA_ENDPOINT_V2`
- `OWNER_ADDRESS`

### 第二步：在 Amoy 部署 OFT

命令示例：

```bash
$env:ENDPOINT_V2=$env:AMOY_ENDPOINT_V2
$env:OFT_NAME='Test Omnichain Token'
$env:OFT_SYMBOL='TOFT'
$env:OFT_INITIAL_SUPPLY='1000000000000000000000000'
npx hardhat run scripts/testnet/deploy-oft.js --network amoy
```

记录：
- Amoy OFT 地址
- 把它填到 `.env` 的 `AMOY_OFT_ADDRESS`

### 第三步：在 Base Sepolia 部署 OFT

命令示例：

```bash
$env:ENDPOINT_V2=$env:BASE_SEPOLIA_ENDPOINT_V2
$env:OFT_NAME='Test Omnichain Token'
$env:OFT_SYMBOL='TOFT'
$env:OFT_INITIAL_SUPPLY='0'
npx hardhat run scripts/testnet/deploy-oft.js --network base-sepolia
```

记录：
- Base Sepolia OFT 地址
- 把它填到 `.env` 的 `BASE_SEPOLIA_OFT_ADDRESS`

### 第四步：双向设置 peer

Amoy 上设置 Base peer：

```bash
$env:OFT_ADDRESS=$env:AMOY_OFT_ADDRESS
$env:PEER_OFT_ADDRESS=$env:BASE_SEPOLIA_OFT_ADDRESS
$env:PEER_EID='40245'
npx hardhat run scripts/testnet/set-peer.js --network amoy
```

Base Sepolia 上设置 Amoy peer：

```bash
$env:OFT_ADDRESS=$env:BASE_SEPOLIA_OFT_ADDRESS
$env:PEER_OFT_ADDRESS=$env:AMOY_OFT_ADDRESS
$env:PEER_EID='40267'
npx hardhat run scripts/testnet/set-peer.js --network base-sepolia
```

已从本地 LayerZero definitions 包确认：
- `BASESEP_V2_TESTNET = 40245`
- `AMOY_V2_TESTNET = 40267`

### 第五步：部署 workflow 相关合约

Amoy：

```bash
$env:OFT_TOKEN_ADDRESS=$env:AMOY_OFT_ADDRESS
$env:DEPLOY_BRIDGE_ADAPTER='true'
npx hardhat run scripts/testnet/deploy-workflow-stack.js --network amoy
```

Base Sepolia：

```bash
$env:OFT_TOKEN_ADDRESS=$env:BASE_SEPOLIA_OFT_ADDRESS
$env:DEPLOY_BRIDGE_ADAPTER='false'
npx hardhat run scripts/testnet/deploy-workflow-stack.js --network base-sepolia
```

记录：
- 两边 `UnifiedOFTWorkflow`
- 两边 `MockSwapAdapter`
- Amoy 上的 `LayerZeroOFTBridgeAdapter`
- 两边测试代币地址

### 第六步：给 MockSwapAdapter 预充值

你需要手动给：

- Amoy 的 `MockSwapAdapter` 充入足够 `OFT`
  - 用来模拟 `tokenIn -> oftToken`
- Base Sepolia 的 `MockSwapAdapter` 充入足够 `payoutToken`
  - 用来模拟 `oftToken -> payoutToken`

### 第七步：初始化白名单和路由

需要配置：

- `approvedCallers`
- `approvedSwapAdapters`
- `approvedBridgeAdapters`
- `sourceRoutes`
- `destinationRoutes`

对应文档：
- `docs/参数边界说明.md`

### 第八步：执行真实两步联调

Amoy：
- approve `tokenIn` 给 `UnifiedOFTWorkflow`
- 调 `swapAndBridge(...)`

Base Sepolia：
- 等 OFT 到账
- approve OFT 给 `UnifiedOFTWorkflow`
- 调 `swapReceivedOFT(...)`

## 当前仓库里新增的关键文件

- `src/testnet/TestOFT.sol`
- `scripts/testnet/deploy-oft.js`
- `scripts/testnet/set-peer.js`
- `scripts/testnet/deploy-workflow-stack.js`
- `.env.example`

## 当前最现实的下一步

你先部署出两边 OFT，把这两个地址补进 `.env`：

1. `AMOY_OFT_ADDRESS`
2. `BASE_SEPOLIA_OFT_ADDRESS`

然后我下一步可以继续帮你把：

- route 初始化脚本
- 白名单初始化脚本
- 一键联调脚本

都接着补进去。