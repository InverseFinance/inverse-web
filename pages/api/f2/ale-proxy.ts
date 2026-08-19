import { getBestQuote, getSwapData } from '@app/util/aggregators';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getPendleSwapData, ptMarkets } from '@app/util/pendle';
import { isAddress } from 'ethers/lib/utils';
import 'source-map-support'

const { F2_ALE, DOLA, F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheDuration = 2;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

  const { method, buyToken, sellToken, sellAmount, slippagePercentage, isFullDeleverage, aggregator, routeSummary } = req.query;

  const pendleCollaterals = Object.keys(ptMarkets).map(k => k.toLowerCase());
  const isPendleCase = pendleCollaterals.includes(buyToken.toLowerCase()) || pendleCollaterals.includes(sellToken.toLowerCase());

  if (!['swap', 'quote'].includes(method) || !isAddress(buyToken) || !isAddress(sellToken) || (buyToken.toLowerCase() !== DOLA.toLowerCase() && sellToken.toLowerCase() !== DOLA.toLowerCase()) || (!/^[1-9]+[0-9]*$/.test(sellAmount) && isFullDeleverage !== 'true')) {
    return res.status(400).json({ msg: 'invalid request' });
  }

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
      const params = { aggregator, recipient: F2_ALE, chainId: 1, fromToken: sellToken, toToken: buyToken, amountIn: sellAmount, slippageTolerance: slippagePercentage }

      let swapCalldata;
      let selectedData;
      const { bestQuote } = await getBestQuote(params);

      if(method === 'swap' && !!bestQuote?.aggregator) {
        params.aggregator = aggregator || bestQuote.aggregator;
        params.routeSummary = routeSummary || bestQuote.routeSummary;
        selectedData = await getSwapData(params);
        swapCalldata = selectedData?.calldata;
      }
      
      if (method === 'swap' && !swapCalldata) {
        return res.status(500).json({ error: true, msg: 'Failed to fecth swap data, please try again' });
      }
  
      return res.status(200).json({
        buyAmount: bestQuote?.amountOut,
        bestProxyName: bestQuote?.aggregator,
        allowanceTarget: bestQuote?.exchangeProxy,
        exchangeProxy: bestQuote?.exchangeProxy,
        data: swapCalldata,
        gasPrice: bestQuote?.gasPrice,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, msg: 'Something went wrong' })
  }
}