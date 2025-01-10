import { getNetworkConfigConstants } from '@app/util/networks';
import { getPendleSwapData } from '@app/util/pendle';
import { isAddress } from 'ethers/lib/utils';
import 'source-map-support'

// const BASE_URL = 'https://api.1inch.dev/swap/v5.2/1';
const BASE_URL = 'https://api.1inch.dev/swap/v6.0/1';

const { F2_ALE, DOLA } = getNetworkConfigConstants();

// default limit is 1 Request Per Sec
const fetch1inchWithRetry = async (
  url: string,
  maxRetries = 40,
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

  const { method, buyToken, sellToken, sellAmount, slippagePercentage, isFullDeleverage, market, aleTransformerType } = req.query;
  if (!['swap', 'quote'].includes(method) || !isAddress(buyToken) || !isAddress(sellToken) || (buyToken.toLowerCase() !== DOLA.toLowerCase() && sellToken.toLowerCase() !== DOLA.toLowerCase()) || (!/^[1-9]+[0-9]*$/.test(sellAmount) && isFullDeleverage !== 'true')) {
    return res.status(400).json({ msg: 'invalid request' });
  }
  try {
    if (aleTransformerType === 'pendle') {
      const { amountOut, callData, allowanceTarget } = await getPendleSwapData(sellToken, buyToken, sellAmount, slippagePercentage);
      return res.status(200).json({
        allowanceTarget,
        buyAmount: amountOut,
        data: callData,
        value: '0',
        gasPrice: 500_000,
      });
    } 
    // classic 1inch case
    else {
      let url = `${BASE_URL}/${method}?dst=${buyToken}&src=${sellToken}&slippage=${slippagePercentage}&disableEstimate=true&from=${F2_ALE}`;
      url += `&amount=${sellAmount || ''}`;

      if (connectors[buyToken?.toLowerCase()] || connectors[sellToken?.toLowerCase()]) {
        const connectorsList = (connectors[buyToken?.toLowerCase()] || connectors[sellToken?.toLowerCase()]).join(',');
        url += `&connectorTokens=${connectorsList}`;
      }

      const [
        response,
        allowanceResponse,
      ] = await Promise.all([
        fetch1inchWithRetry(url),
        fetch1inchWithRetry('https://api.1inch.dev/swap/v6.0/1/approve/spender'),
      ]);

      if (!response) {
        return res.status(500).json({ error: true, msg: 'Failed to fecth swap data, please try again' });
      }

      const responseData = await response?.json();
      const allowanceResponseData = await allowanceResponse?.json();
      return res.status(response.status).json({
        ...responseData,
        url,
        buyAmount: responseData?.toAmount || responseData?.dstAmount,
        // 1inch router v5
        // allowanceTarget: '0x1111111254EEB25477B68fb85Ed929f73A960582',
        allowanceTarget: allowanceResponseData.address,
        data: responseData?.tx?.data,
        gasPrice: responseData?.tx?.gasPrice,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, msg: 'Failed to fecth swap data, please try again' })
  }
}