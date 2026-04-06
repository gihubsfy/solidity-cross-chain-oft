# Polygon 已确认 OFT 路径总表

这份文档只覆盖**已经确认有 Polygon 对应地址**的 OFT。

当前包含：
- HANDL
- ZRO
- SOPH

其中：
- HANDL 映射来自交易样本确认
- ZRO / SOPH 映射来自本地 LayerZero 分组数据

## 说明

- `USDC_TO_TOKEN`: Polygon 上用 1 USDC 买入 OFT 的路径
- `TOKEN_TO_USDC`: Polygon 上把 OFT 卖回 USDC 的路径
- `USDT_TO_TOKEN`: Polygon 上用 1 USDT 买入 OFT 的路径
- `TOKEN_TO_USDT`: Polygon 上把 OFT 卖回 USDT 的路径

## 全量结果

### HANDL

- Polygon Token: `0xf4c3fac9c98aa62474998e299495b699dfdb00eb`
- Base Token: `0x3bbcb624cb9a1f73163a886f460f47603e5e4425`
- 映射来源: tx-confirmed
- USDC_TO_TOKEN: 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359--0xf4c3fac9c98aa62474998e299495b699dfdb00eb
- DEX(USDC_TO_TOKEN): QuickSwap(100)
- TOKEN_TO_USDC: 0xf4c3fac9c98aa62474998e299495b699dfdb00eb--0x3c499c542cef5e3811e1192ce70d8cc03d5c3359
- DEX(TOKEN_TO_USDC): QuickSwap(100)
- USDT_TO_TOKEN: 0xc2132d05d31c914a87c6611c10748aeb04b58e8f--0x2791bca1f2de4661ed88a30c99a7a9449aa84174--0x3c499c542cef5e3811e1192ce70d8cc03d5c3359--0xf4c3fac9c98aa62474998e299495b699dfdb00eb
- DEX(USDT_TO_TOKEN): QuickSwap V3(100) -> QuickSwap V3(100) -> QuickSwap(100)
- TOKEN_TO_USDT: 0xf4c3fac9c98aa62474998e299495b699dfdb00eb--0x3c499c542cef5e3811e1192ce70d8cc03d5c3359--0xc2132d05d31c914a87c6611c10748aeb04b58e8f
- DEX(TOKEN_TO_USDT): QuickSwap(100) -> Uniswap V4(100)

### ZRO

- Polygon Token: `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- Base Token: `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- 映射来源: layerzero-grouped
- USDC_TO_TOKEN: 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359--0xc2132d05d31c914a87c6611c10748aeb04b58e8f--0x6985884c4392d348587b19cb9eaaf157f13271cd
- DEX(USDC_TO_TOKEN): Uniswap V4(100) -> Uniswap V3(100)
- TOKEN_TO_USDC: 0x6985884c4392d348587b19cb9eaaf157f13271cd--0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270--0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39--0x3c499c542cef5e3811e1192ce70d8cc03d5c3359
- DEX(TOKEN_TO_USDC): Uniswap V3(100) -> Uniswap V3(100) -> QuickSwap V3(100)
- USDT_TO_TOKEN: 0xc2132d05d31c914a87c6611c10748aeb04b58e8f--0x6985884c4392d348587b19cb9eaaf157f13271cd
- DEX(USDT_TO_TOKEN): Uniswap V3(100)
- TOKEN_TO_USDT: 0x6985884c4392d348587b19cb9eaaf157f13271cd--0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270--0x3c499c542cef5e3811e1192ce70d8cc03d5c3359--0xc2132d05d31c914a87c6611c10748aeb04b58e8f
- DEX(TOKEN_TO_USDT): Uniswap V3(100) -> Uniswap V4(100) -> Uniswap V4(100)

### SOPH

- Polygon Token: `0xeb971fd26783f32694dbb392dd7289de23109148`
- Base Token: `0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742`
- 映射来源: layerzero-grouped
- USDC_TO_TOKEN: 不可用: The value difference from this transactionâs quote route is higher than 90%, which may lead to a risk of loss to user assets.
- TOKEN_TO_USDC: 不可用: buy leg unavailable
- USDT_TO_TOKEN: 不可用: The value difference from this transactionâs quote route is higher than 90%, which may lead to a risk of loss to user assets.
- TOKEN_TO_USDT: 不可用: buy leg unavailable

