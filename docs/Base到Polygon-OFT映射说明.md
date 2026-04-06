# Base 到 Polygon OFT 映射说明

这份文档只回答一件事：

- 这批 Base token 中，哪些可以确认在 Polygon 上有对应 OFT 合约地址

这里的映射优先级如下：

1. **交易样本已验证**
   - 优先级最高
   - 例如 HANDL
2. **LayerZero 本地分组数据**
   - 次优先级
   - 例如 ZRO / SOPH
3. **仅 symbol / price 相似**
   - 不作为最终确认依据
   - 只能做候选

## 当前已确认映射

### 1. HANDL

- Base:
  - `0x3bbcb624cb9a1f73163a886f460f47603e5e4425`
- Polygon:
  - `0xf4c3fac9c98aa62474998e299495b699dfdb00eb`
- 映射来源：
  - **交易样本已验证**

说明：
- 这组映射不是靠本地 LayerZero 分组文件找到的
- 而是通过你给的主网交易样本直接证明的

### 2. ZRO

- Base:
  - `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- Polygon:
  - `0x6985884c4392d348587b19cb9eaaf157f13271cd`
- 映射来源：
  - `layerzero_oft_tokens_grouped.json`

### 3. SOPH

- Base:
  - `0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742`
- Polygon:
  - `0xeb971fd26783f32694dbb392dd7289de23109148`
- 映射来源：
  - `layerzero_oft_tokens_grouped.json`

## 当前统计

- 50 个 Base token 中，按本地 LayerZero 分组数据能匹配到 Base 侧条目的：18 个
- 在这些条目里，当前能直接确认 Polygon 对应地址的：
  - 通过 LayerZero 分组直接确认：2 个（ZRO / SOPH）
  - 通过交易样本确认：1 个（HANDL）

也就是目前明确可用的 Base -> Polygon 对应 OFT 一共有 3 组。

## 注意

这份文档只讲“映射关系”，不讲 Polygon 上的兑换路径。

Polygon 上的路径请看：
- `docs/Polygon-已确认OFT路径总表.md`
