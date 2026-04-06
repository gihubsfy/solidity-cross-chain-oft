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
- `HANDL` 路线主网真实闭环一次

## 你应该先看哪份文档

### 1. 总入口

- `docs/总览-复现与部署路径.md`

### 2. 当前测试网运行

- `docs/amoy-base-sepolia-当前运行手册.md`
- `docs/amoy-base-sepolia-联调清单.md`

### 3. 参数与通用架构

- `docs/参数边界说明.md`
- `docs/通用多链多OFT架构设计说明.md`

### 4. 主网样本参数与上线检查

- `docs/主网参数完整表-HANDL样本版.md`
- `docs/主网部署前检查清单-HANDL样本版.md`
- `docs/主网参数完整表-ZRO样本版.md`

### 5. 主网实操手册

- `docs/主网实操运行手册-HANDL路线.md`

### 6. 路径与映射

- `docs/Base到Polygon-OFT映射说明.md`
- `docs/Polygon-已确认OFT路径总表.md`
- `docs/Polygon-三个OFT完整路径与执行数据.md`
- `docs/base-50-token-路径总表.md`

### 7. 主网 fork 验证

- `docs/主网双fork复刻方案.md`
- `docs/fork上验证我们自己的合约.md`

### 8. 链下 watcher

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

测试网 watcher：

```bash
npm run watch:destination
```

主网 fork 回放：

```bash
npm run fork:replay:three
npm run fork:replay:one
```

主网部署与实操：

```bash
npm run mainnet:deploy:polygon
npm run mainnet:deploy:base
npm run mainnet:set-aggregator
npm run mainnet:init:source
npm run mainnet:init:destination
npm run mainnet:check:source
npm run mainnet:probe:bridge
npm run mainnet:send:handl
npm run mainnet:watch:handl
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
- 主网实盘调用脚本

## 说明

这个仓库目前已经具备“可运行、可复现、可继续向真实部署收敛”的工程基础。

如果后面继续推进，建议优先：
- 固化主网运行脚本参数模板
- 完善 watcher 的重试与日志
- 扩展更多已验证路线