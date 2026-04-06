# OFT Cross-Chain Workflow

这个仓库当前实现的是一套通用的 OFT 跨链交易系统，目标是支持：

- 源链把 `tokenIn` 换成 `OFT`
- 通过 LayerZero 跨链
- 目标链收到 `OFT` 后卖成 `payoutToken`
- 链下 watcher 自动监控到账并触发卖出

## 当前状态

已经完成：

- 测试网真实跨链闭环
- 测试网真实 DEX 风格池子
- 链下 watcher / executor
- 主网双 fork 行为回放
- 在主网 fork 上验证我们自己的合约

## 你应该先看哪份文档

### 1. 总入口

- `docs/总览-复现与部署路径.md`

### 2. 当前测试网运行

- `docs/amoy-base-sepolia-当前运行手册.md`

### 3. 测试网联调步骤

- `docs/amoy-base-sepolia-联调清单.md`

### 4. 参数边界与职责

- `docs/参数边界说明.md`

### 5. 通用架构

- `docs/通用多链多OFT架构设计说明.md`

### 6. 主网双 fork

- `docs/主网双fork复刻方案.md`
- `docs/fork上验证我们自己的合约.md`

### 7. 链下 watcher

- `docs/链下监控卖出脚本说明.md`

## 常用命令

编译：

```bash
npm run compile
```

本地测试：

```bash
npm run test
```

目标链 watcher：

```bash
npm run watch:destination
```

主网三步 fork 回放：

```bash
npm run fork:replay:three
```

单笔主网 fork 回放：

```bash
npm run fork:replay:one
```

## 当前系统边界

链上：
- `UnifiedOFTWorkflow`
- bridge adapter
- swap adapter
- OFT

链下：
- watcher / executor
- 测试网部署脚本
- 主网 fork 回放脚本

## 说明

这个仓库目前已经具备“可运行、可复现、可继续向真实部署收敛”的工程基础。

后面如果继续推进，建议优先完善：
- watcher 的重试与日志
- 主网配置模板
- 文档索引与环境分层
