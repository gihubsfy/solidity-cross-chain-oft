const fs = require('fs');
const https = require('https');

const cfg = JSON.parse(fs.readFileSync('D:/探索/crypto_chance/okx_swap/config.json','utf8'));
const api = String(cfg['OK-ACCESS-KEY']).trim();
const secret = String(cfg['SECRET-KEY']).trim();
const pass = String(cfg['OK-ACCESS-PASSPHRASE']).trim();

let raw = fs.readFileSync('base_50_tokens_okx_search.json','utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const baseTokens = JSON.parse(raw).filter(x => x.found === true);

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function sign(ts, method, path){
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(ts + method + path).digest('base64');
}
function okxGet(path){
  return new Promise((resolve) => {
    const ts = new Date().toISOString().replace('Z','').slice(0,23)+'Z';
    const options = {
      hostname: 'web3.okx.com',
      path,
      method: 'GET',
      headers: {
        'OK-ACCESS-KEY': api,
        'OK-ACCESS-SIGN': sign(ts,'GET',path),
        'OK-ACCESS-PASSPHRASE': pass,
        'OK-ACCESS-TIMESTAMP': ts,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res)=>{
      let data='';
      res.on('data', c=>data+=c);
      res.on('end', ()=>{
        try { resolve({status: res.statusCode, body: JSON.parse(data||'{}')}); }
        catch(e){ resolve({status: res.statusCode, body: {error:String(e), raw:data}}); }
      });
    });
    req.on('error', e=> resolve({status:0, body:{error:String(e)}}));
    req.end();
  });
}

(async()=>{
  const results = [];
  let i = 0;
  for (const base of baseTokens) {
    i += 1;
    const path = `/api/v6/dex/market/token/search?chains=137&search=${encodeURIComponent(base.symbol)}`;
    const resp = await okxGet(path);
    const entry = {
      baseToken: base.token,
      baseSymbol: base.symbol,
      baseName: base.name,
      basePrice: base.price,
      baseLiquidity: base.liquidity,
      candidates: [],
      selected: null,
      note: ''
    };
    if (resp.status === 200 && resp.body.code === '0' && Array.isArray(resp.body.data)) {
      const candidates = resp.body.data
        .filter(t => String(t.tokenSymbol || '').toUpperCase() === String(base.symbol || '').toUpperCase())
        .map(t => ({
          address: t.tokenContractAddress,
          symbol: t.tokenSymbol,
          name: t.tokenName,
          decimal: t.decimal,
          price: t.price,
          liquidity: t.liquidity,
          explorerUrl: t.explorerUrl,
          priceDiffPct: (Number(base.price) > 0 && Number(t.price) > 0) ? Math.abs(Number(t.price) - Number(base.price)) / Number(base.price) * 100 : null
        }));
      entry.candidates = candidates;
      if (candidates.length > 0) {
        candidates.sort((a,b)=>{
          const aDiff = a.priceDiffPct === null ? Number.POSITIVE_INFINITY : a.priceDiffPct;
          const bDiff = b.priceDiffPct === null ? Number.POSITIVE_INFINITY : b.priceDiffPct;
          if (aDiff !== bDiff) return aDiff - bDiff;
          return Number(b.liquidity||0) - Number(a.liquidity||0);
        });
        entry.selected = candidates[0];
      } else {
        entry.note = 'No exact symbol match on Polygon from OKX search';
      }
    } else {
      entry.note = `Search failed: status=${resp.status} code=${resp.body.code || ''}`;
    }
    results.push(entry);
    console.log(`[${i}/${baseTokens.length}] ${base.symbol} -> ${entry.selected ? entry.selected.address : 'NO_MATCH'}`);
    await sleep(350);
  }
  fs.writeFileSync('base50_to_polygon_mapping_okx.json', JSON.stringify({generatedAt:new Date().toISOString(), results}, null, 2), 'utf8');
  console.log('WROTE=base50_to_polygon_mapping_okx.json');
})();
