import { getNetworkConfigConstants } from '@app/util/networks';
import { getPendleSwapData, ptMarkets } from '@app/util/pendle';
import { isAddress, parseUnits } from 'ethers/lib/utils';
import 'source-map-support'

const { F2_ALE, DOLA, F2_MARKETS } = getNetworkConfigConstants();

const PROXYS = {
  '1inch': {
    // V6
    exchangeProxy: '0x111111125421cA6dc452d289314280a0f8842A65',
    apiBaseUrl: 'https://api.1inch.dev/swap/v6.1/1',
  },
}

// default limit is 1 Request Per Sec
const fetch1inchWithRetry = async (
  url: string,
  maxRetries = 20,
  currentRetry = 0,
): Promise<Response | undefined> => {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_KEY}`,
        'accept': 'application/json',
      },
    });
  } catch (e) {
    
  }

  if (response?.status !== 200 && currentRetry < maxRetries) {
    await new Promise((r) => setTimeout(() => r(true), 1050));
    return await fetch1inchWithRetry(url, maxRetries, currentRetry + 1);
  };
  return response;
}

const connectors = {
  // cvxFXS
  '0xfeef77d3f69374f66429c91d732a244f074bdf74': ['0x853d955acef822db058eb8505911ed77f175b99e', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0'],
  // yCrv for st-yCrv
  '0xfcc5c47be19d06bf83eb04298b026f81069ff65b': ['0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E', '0xD533a949740bb3306d119CC777fa900bA034cd52'],
}

export default async function handler(req, res) {
  const cacheDuration = 2;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

  const { method, buyToken, buyAmount, sellToken, sellAmount, slippagePercentage, isFullDeleverage } = req.query;

  const pendleCollaterals = Object.keys(ptMarkets).map(k => k.toLowerCase());
  const isPendleCase = pendleCollaterals.includes(buyToken.toLowerCase()) || pendleCollaterals.includes(sellToken.toLowerCase());

  if (!['swap', 'quote'].includes(method) || !isAddress(buyToken) || !isAddress(sellToken) || (buyToken.toLowerCase() !== DOLA.toLowerCase() && sellToken.toLowerCase() !== DOLA.toLowerCase()) || (!/^[1-9]+[0-9]*$/.test(sellAmount) && isFullDeleverage !== 'true')) {
    return res.status(400).json({ msg: 'invalid request' });
  }

  const oneInchSubPath = method;

  try {
    if (isPendleCase) {
      const firmMarket = F2_MARKETS.find(m => [buyToken.toLowerCase(), sellToken.toLowerCase()].includes(m.collateral.toLowerCase()));
      const isExpired = firmMarket?.expiry ? new Date(firmMarket.expiry) < new Date() : false;
     
      const pendleData = await getPendleSwapData(buyToken, sellToken, sellAmount, slippagePercentage, isExpired);
      return res.status(200).json({
        error: pendleData.error,
        msg: pendleData.msg,
        bestProxyName: 'pendle',
        buyAmount: pendleData.buyAmount,
        data: '0x',
        extraHelperData: pendleData.data,
        gasPrice: undefined,
        // not actually needed
        exchangeProxy: pendleData.to,
        allowanceTarget: pendleData.to,
        isExpiredPendleMarket: isExpired,
      });
    } else {
      let oneInchUrl = `${PROXYS['1inch'].apiBaseUrl}/${oneInchSubPath}?dst=${buyToken}&src=${sellToken}&slippage=${slippagePercentage}&disableEstimate=true&from=${F2_ALE}`;
      oneInchUrl += `&amount=${sellAmount || ''}`;

      if (connectors[buyToken?.toLowerCase()] || connectors[sellToken?.toLowerCase()]) {
        const connectorsList = (connectors[buyToken?.toLowerCase()] || connectors[sellToken?.toLowerCase()]).join(',');
        oneInchUrl += `&connectorTokens=${connectorsList}`;
      }
      
      const [
        oneInchResponse,
        // oneInchAllowanceResponse,
        
      ] = await Promise.all([
        fetch1inchWithRetry(oneInchUrl),
        // fetch1inchWithRetry('https://api.1inch.dev/swap/v6.0/1/approve/spender'),
      ]);

      if (!oneInchResponse) {
        return res.status(500).json({ error: true, msg: 'Failed to fecth swap data, please try again' });
      }

      const oneInchResponseData = await oneInchResponse?.json();
      // const oneInchAllowanceResponseData = await oneInchAllowanceResponse?.json();

      const status = (oneInchResponse?.status === 200) ? 200 : 500;

      const oneInchOutput = oneInchResponseData?.toAmount || oneInchResponseData?.dstAmount;

      const bestProxyName = '1inch'// no alternative
      const bestProxy = PROXYS[bestProxyName];
      const buyAmount = oneInchOutput

      let txInfo = oneInchResponseData?.tx;
      
      if (method === 'swap' && !txInfo?.data) {
        return res.status(500).json({ error: true, msg: 'Failed to fecth swap data, please try again' });
      }
  
      return res.status(status).json({
        buyAmount: buyAmount,
        oneInchOutput,
        bestProxyName,
        allowanceTarget: bestProxy.exchangeProxy,
        exchangeProxy: bestProxy.exchangeProxy,
        data: txInfo?.data,
        gasPrice: txInfo?.gasPrice,
        oneInchTx: oneInchResponseData?.tx,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, msg: 'Something went wrong' })
  }
}