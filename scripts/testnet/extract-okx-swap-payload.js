const fs = require('fs');
const https = require('https');

const cfg = JSON.parse(fs.readFileSync('D:/探索/crypto_chance/okx_swap/config.json','utf8'));
const api = String(cfg['OK-ACCESS-KEY']).trim();
const secret = String(cfg['SECRET-KEY']).trim();
const pass = String(cfg['OK-ACCESS-PASSPHRASE']).trim();
const wallet = process.env.USER_WALLET || '0x1e274433D138708C36aF002395aEf3C173a35eC6';

function sign(ts, method, path) {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(ts + method + path).digest('base64');
}

function okxGet(path) {
  return new Promise((resolve) => {
    const ts = new Date().toISOString().replace('Z', '').slice(0, 23) + 'Z';
    const options = {
      hostname: 'web3.okx.com',
      path,
      method: 'GET',
      headers: {
        'OK-ACCESS-KEY': api,
        'OK-ACCESS-SIGN': sign(ts, 'GET', path),
        'OK-ACCESS-PASSPHRASE': pass,
        'OK-ACCESS-TIMESTAMP': ts,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, body: { error: String(e), raw: data } });
        }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: { error: String(e) } }));
    req.end();
  });
}

async function main() {
  const chainId = process.env.CHAIN_ID || '137';
  const fromToken = process.env.FROM_TOKEN;
  const toToken = process.env.TO_TOKEN;
  const amount = process.env.AMOUNT;
  const slippage = process.env.SLIPPAGE || '0.5';

  if (!fromToken || !toToken || !amount) {
    throw new Error('Missing FROM_TOKEN, TO_TOKEN, or AMOUNT');
  }

  const path = `/api/v6/dex/aggregator/swap?chainIndex=${chainId}&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&slippagePercent=${slippage}&userWalletAddress=${wallet}`;
  const resp = await okxGet(path);

  if (resp.status !== 200 || resp.body.code !== '0' || !resp.body.data || resp.body.data.length === 0) {
    console.log(JSON.stringify(resp, null, 2));
    process.exit(1);
  }

  const data = resp.body.data[0];
  const out = {
    chainId,
    fromToken,
    toToken,
    amount,
    route: data.router,
    estimatedGas: data.estimateGasFee,
    tx: data.tx,
    dexRouterList: data.dexRouterList,
  };

  const file = process.env.OUT_FILE || 'okx_swap_payload.json';
  fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf8');
  console.log(file);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
