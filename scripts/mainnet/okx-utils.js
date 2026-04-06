const fs = require("fs");
const https = require("https");
const crypto = require("crypto");

function readOkxConfig(configPath) {
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
  return {
    apiKey: String(cfg["OK-ACCESS-KEY"] || "").trim(),
    secret: String(cfg["SECRET-KEY"] || "").trim(),
    passphrase: String(cfg["OK-ACCESS-PASSPHRASE"] || "").trim(),
  };
}

function sign(secret, ts, method, path) {
  return crypto.createHmac("sha256", secret).update(ts + method + path).digest("base64");
}

function okxGet(path, configPath) {
  const { apiKey, secret, passphrase } = readOkxConfig(configPath);
  return new Promise((resolve, reject) => {
    const ts = new Date().toISOString().replace("Z", "").slice(0, 23) + "Z";
    const req = https.request(
      {
        hostname: "web3.okx.com",
        path,
        method: "GET",
        headers: {
          "OK-ACCESS-KEY": apiKey,
          "OK-ACCESS-SIGN": sign(secret, ts, "GET", path),
          "OK-ACCESS-PASSPHRASE": passphrase,
          "OK-ACCESS-TIMESTAMP": ts,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body || "{}") });
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function getApproveTransaction({ chainId, tokenAddress, amount, configPath }) {
  const path = `/api/v6/dex/aggregator/approve-transaction?chainIndex=${chainId}&tokenContractAddress=${tokenAddress}&approveAmount=${amount}`;
  return okxGet(path, configPath);
}

async function getSwapTransaction({ chainId, fromToken, toToken, amount, slippagePercent, userWalletAddress, configPath }) {
  const path = `/api/v6/dex/aggregator/swap?chainIndex=${chainId}&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&slippagePercent=${slippagePercent}&userWalletAddress=${userWalletAddress}`;
  return okxGet(path, configPath);
}

module.exports = {
  getApproveTransaction,
  getSwapTransaction,
};