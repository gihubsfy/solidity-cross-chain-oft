# Base 50 个 Token 的 LayerZero 多链分布

这份文档只回答一件事：这些 Base token 在 LayerZero 维度上到底出现在哪些链。

## 统计

- 总数: 50
- 在 LayerZero 数据里找到: 19
- 没找到: 31

## 说明

- 这里优先使用本地 LayerZero 分组数据。
- 对于 `HANDL`，额外使用了交易样本确认的 Polygon <-> Base 映射。
- 这份文档不讲兑换路径，只讲“在哪些链有对应合约”。

### CARV

- Base Token: `0xc08cd26474722ce93f4d0c34d16201461c10aa8c`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Base (chain_id=8453): `0xc08cd26474722ce93f4d0c34d16201461c10aa8c`
  - BNB Chain (chain_id=56): `0xc08cd26474722ce93f4d0c34d16201461c10aa8c`
  - Arbitrum One (chain_id=42161): `0xc08cd26474722ce93f4d0c34d16201461c10aa8c`
  - Ethereum (chain_id=1): `0xc08cd26474722ce93f4d0c34d16201461c10aa8c`

### SIGN

- Base Token: `0x868fced65edbf0056c4163515dd840e9f287a4c3`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0x868fced65edbf0056c4163515dd840e9f287a4c3`
  - Base (chain_id=8453): `0x868fced65edbf0056c4163515dd840e9f287a4c3`
  - Ethereum (chain_id=1): `0x868fced65edbf0056c4163515dd840e9f287a4c3`

### RIVER

- Base Token: `0xda7ad9dea9397cffddae2f8a052b82f1484252b3`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0xda7ad9dea9397cffddae2f8a052b82f1484252b3`
  - Base (chain_id=8453): `0xda7ad9dea9397cffddae2f8a052b82f1484252b3`
  - Ethereum (chain_id=1): `0xda7ad9dea9397cffddae2f8a052b82f1484252b3`

### UNKNOWN

- Base Token: `0xbb146326778227a8498b105a18f84e0987a684b4`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### HANDL

- Base Token: `0x3bbcb624cb9a1f73163a886f460f47603e5e4425`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Polygon (chain_id=137): `0xf4c3fac9c98aa62474998e299495b699dfdb00eb` | source=tx-confirmed
  - Base (chain_id=8453): `0x3bbcb624cb9a1f73163a886f460f47603e5e4425` | source=tx-confirmed

### Anon

- Base Token: `0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Base (chain_id=8453): `0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c`
  - BNB Chain (chain_id=56): `0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c`
  - Arbitrum One (chain_id=42161): `0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c`
  - Ethereum (chain_id=1): `0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c`
  - Avalanche C (chain_id=43114): `0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c`

### ZBT

- Base Token: `0xfab99fcf605fd8f4593edb70a43ba56542777777`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0xfab99fcf605fd8f4593edb70a43ba56542777777`
  - Ethereum (chain_id=1): `0xfab99fcf605fd8f4593edb70a43ba56542777777`
  - Base (chain_id=8453): `0xfab99fcf605fd8f4593edb70a43ba56542777777`

### RWA

- Base Token: `0xe2b1dc2d4a3b4e59fdf0c47b71a7a86391a8b35a`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0x9c8b5ca345247396bdfac0395638ca9045c6586e`
  - Base (chain_id=8453): `0xe2b1dc2d4a3b4e59fdf0c47b71a7a86391a8b35a`
  - BNB Chain (chain_id=56): `0xe2b1dc2d4a3b4e59fdf0c47b71a7a86391a8b35a`
  - Arbitrum One (chain_id=42161): `0xe2b1dc2d4a3b4e59fdf0c47b71a7a86391a8b35a`

### UNKNOWN

- Base Token: `0x7431ada8a591c955a994a21710752ef9b882b8e3`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xd5390300c5db71f80d46f0fa9983fc72d4d1e3da`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x30c7235866872213f68cb1f08c37cb9eccb93452`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### USR

- Base Token: `0x35e5db674d8e93a03d814fa0ada70731efe8a4b9`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Ethereum (chain_id=1): `0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110`
  - Base (chain_id=8453): `0x35e5db674d8e93a03d814fa0ada70731efe8a4b9`
  - BNB Chain (chain_id=56): `0x2492d0006411af6c8bbb1c8afc1b0197350a79e9`

### UNKNOWN

- Base Token: `0x3d2a83cfa8fbf8d647d65bf708caed693aae9a34`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xbcaba0bac0f4bff8cc8659f2218c6d5324b46061`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x9d0e8f5b25384c7310cb8c6ae32c8fbeb645d083`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x1393ad734ea3c52865b4b541cf049dafd25c23a5`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x9cfe02eb040c6f5718126128dbba0c1d364d9c07`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x3e12b9d6a4d12cd9b4a6d613872d0eb32f68b380`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### RAVE

- Base Token: `0x1aa8fd5bcce2231c6100d55bf8b377cff33acfc3`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0x97693439ea2f0ecdeb9135881e49f354656a911c`
  - Base (chain_id=8453): `0x1aa8fd5bcce2231c6100d55bf8b377cff33acfc3`
  - Ethereum (chain_id=1): `0x17205fab260a7a6383a81452ce6315a39370db97`

### UNKNOWN

- Base Token: `0x0b2558bdbc7ffec0f327fb3579c23dabd1699706`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x9cd44eca3d1e0ada6fbdaf5793031c3a500089b1`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xc6c1be6c6d828f9cea70f1b8351879510fbf0065`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xa749de6c28262b7ffbc5de27dc845dd7ecd2b358`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xc227717ef4ae4d982e14789eb33ba942243c3fee`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xce6170ea245dc8d1f275a710a062b70f125f0110`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xdefa1d21c5f1cbeac00eeb54b44c7d86467cc3a3`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x93402f62aeda632b9d768092b61887c4e9a13079`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xc5fed7c8ccc75d8a72b601a66dffd7a489073f0b`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x968be3f7bfef0f8edc3c1ad90232ebb0da0867aa`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xe9f6d9898f9269b519e1435e6ebaff766c7f46bf`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### BOX

- Base Token: `0x37d2adc008118d04f259fc0c16ff66bf5a637d20`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0x6386adc4bc9c21984e34fd916bb349dd861742af`
  - Ethereum (chain_id=1): `0x32b77729cd87f1ef2bea4c650c16f89f08472c69`
  - Base (chain_id=8453): `0x37d2adc008118d04f259fc0c16ff66bf5a637d20`

### UNKNOWN

- Base Token: `0xc31389794ffac23331e0d9f611b7953f90aa5fdc`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### weETH

- Base Token: `0x04c0599ae5a44757c0af6f9ec3b93da8976c150a`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Ethereum (chain_id=1): `0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee`
  - Base (chain_id=8453): `0x04c0599ae5a44757c0af6f9ec3b93da8976c150a`
  - Arbitrum One (chain_id=42161): `0x35751007a407ca6feffe80b3cb397736d2cf4dbe`
  - Linea (chain_id=59144): `0x1bf74c010e6320bab11e2e5a532b5ac15e0b8aa6`
  - Avalanche C (chain_id=43114): `0xa3d68b74bf0528fdd07263c60d6488749044914b`
  - BNB Chain (chain_id=56): `0x04c0599ae5a44757c0af6f9ec3b93da8976c150a`
  - Scroll (chain_id=534352): `0x01f0a31698c4d065659b9bdc21b3610292a1c506`
  - Optimism (chain_id=10): `0x5a7facb970d094b6c7ff1df0ea68d99e6e73cbff`
  - zkSync Era (chain_id=324): `0xc1fa6e2e8667d9be0ca938a54c7e0285e9df924a`

### UNKNOWN

- Base Token: `0xb67675158b412d53fe6b68946483ba920b135ba1`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### ORA

- Base Token: `0x333333c465a19c85f85c6cfbed7b16b0b26e3333`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Ethereum (chain_id=1): `0x33333333fede34409fb7f67c6585047e1f653333`
  - Base (chain_id=8453): `0x333333c465a19c85f85c6cfbed7b16b0b26e3333`
  - BNB Chain (chain_id=56): `0x333333c465a19c85f85c6cfbed7b16b0b26e3333`

### MASA

- Base Token: `0xab1e131c6984cc149ef45931073d11ae35497191`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Ethereum (chain_id=1): `0x944824290cc12f31ae18ef51216a223ba4063092`
  - Base (chain_id=8453): `0xab1e131c6984cc149ef45931073d11ae35497191`
  - BNB Chain (chain_id=56): `0x944824290cc12f31ae18ef51216a223ba4063092`

### ORDER

- Base Token: `0x4e200fe2f3efb977d5fd9c430a41531fb04d97b8`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0x4e200fe2f3efb977d5fd9c430a41531fb04d97b8`
  - Ethereum (chain_id=1): `0xabd4c63d2616a5201454168269031355f4764337`
  - Arbitrum One (chain_id=42161): `0x4e200fe2f3efb977d5fd9c430a41531fb04d97b8`
  - Base (chain_id=8453): `0x4e200fe2f3efb977d5fd9c430a41531fb04d97b8`

### SQUID

- Base Token: `0xfafb7581a65a1f554616bf780fc8a8acd2ab8c9b`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0xfafb7581a65a1f554616bf780fc8a8acd2ab8c9b`
  - Base (chain_id=8453): `0xfafb7581a65a1f554616bf780fc8a8acd2ab8c9b`

### UNKNOWN

- Base Token: `0x3073f7aaa4db83f95e9fff17424f71d4751a3073`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x959fc04dbf97a27073f89237cd62605f4d1b906d`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0xa100000000000d6e18bc155f425685e4badfe11c`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### SOPH

- Base Token: `0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742`
  - Ethereum (chain_id=1): `0x6b7774cb12ed7573a7586e7d0e62a2a563ddd3f0`
  - Arbitrum One (chain_id=42161): `0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742`
  - Base (chain_id=8453): `0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742`
  - Polygon (chain_id=137): `0xeb971fd26783f32694dbb392dd7289de23109148`

### UNKNOWN

- Base Token: `0x35e0966208f518371e79cc9fd35559112068ddad`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x365b481bc61240aaa261ee637c9d2f9c1735ef3e`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### SOON

- Base Token: `0xb9e1fd5a02d3a33b25a14d661414e6ed6954a721`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - BNB Chain (chain_id=56): `0xb9e1fd5a02d3a33b25a14d661414e6ed6954a721`
  - Base (chain_id=8453): `0xb9e1fd5a02d3a33b25a14d661414e6ed6954a721`

### UNKNOWN

- Base Token: `0x590830dfdf9a3f68afcdde2694773debdf267774`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### UNKNOWN

- Base Token: `0x370923d39f139c64813f173a1bf0b4f9ba36a24f`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### ZRO

- Base Token: `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Arbitrum One (chain_id=42161): `0x6985884c4392d348587b19cb9eaaf157f13271cd`
  - Ethereum (chain_id=1): `0x6985884c4392d348587b19cb9eaaf157f13271cd`
  - Base (chain_id=8453): `0x6985884c4392d348587b19cb9eaaf157f13271cd`
  - Optimism (chain_id=10): `0x6985884c4392d348587b19cb9eaaf157f13271cd`
  - BNB Chain (chain_id=56): `0x6985884c4392d348587b19cb9eaaf157f13271cd`
  - Polygon (chain_id=137): `0x6985884c4392d348587b19cb9eaaf157f13271cd`
  - Avalanche C (chain_id=43114): `0x6985884c4392d348587b19cb9eaaf157f13271cd`

### UNKNOWN

- Base Token: `0x407a5fb66cb1b3d50004f7091c08a27b42ba6d6f`
- LayerZero 中是否找到: 否
- 其他链: 未在当前 LayerZero 数据中确认

### frxUSD

- Base Token: `0xe5020a6d073a794b6e7f05678707de47986fb0b6`
- LayerZero 中是否找到: 是
- 已确认链列表:
  - Ethereum (chain_id=1): `0xcacd6fd266af91b8aed52accc382b4e165586e29`
  - BNB Chain (chain_id=56): `0x80eede496655fb9047dd39d9f418d5483ed600df`
  - Base (chain_id=8453): `0xe5020a6d073a794b6e7f05678707de47986fb0b6`
  - Linea (chain_id=59144): `0xc7346783f5e645aa998b106ef9e7f499528673d8`

