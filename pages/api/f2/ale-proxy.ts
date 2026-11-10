import { Aggregator, getBestQuote, getSwapData } from '@app/util/aggregators';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getPendleSwapData, ptMarkets } from '@app/util/pendle';
import { CHAIN_TOKEN_ADDRESSES } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import 'source-map-support'

const { F2_ALE, DOLA, F2_MARKETS } = getNetworkConfigConstants();

// aggregators allowed when buying or selling a token (default: all of them)
const { SwanUSD, sSwanUSD } = CHAIN_TOKEN_ADDRESSES["1"];
const TOKEN_AGGREGATORS: { [token: string]: Aggregator[] } = {
  // sSwanUSD market: SwanUSD is the swapped token, sSwanUSD the collateral
  [SwanUSD.toLowerCase()]: ['enso'],
  [sSwanUSD.toLowerCase()]: ['enso'],
};

export default async function handler(req, res) {
  const cacheDuration = 2;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

  const { method, buyToken, sellToken, sellAmount, slippagePercentage, isFullDeleverage, aggregator, routeSummary, recipient, deadline } = req.query;

  const pendleCollaterals = Object.keys(ptMarkets).map(k => k.toLowerCase());
  const isPendleCase = pendleCollaterals.includes(buyToken.toLowerCase()) || pendleCollaterals.includes(sellToken.toLowerCase());

  if (!['swap', 'quote'].includes(method) || !isAddress(buyToken) || !isAddress(sellToken) || (buyToken.toLowerCase() !== DOLA.toLowerCase() && sellToken.toLowerCase() !== DOLA.toLowerCase()) || (!/^[1-9]+[0-9]*$/.test(sellAmount) && isFullDeleverage !== 'true')) {
    return res.status(400).json({ msg: 'invalid request' });
  }

  // Optional, for an account swapping without the ALE (a Safe's leverage rounds): the
  // swap's sender and recipient, and when its swap data stops being valid (unix seconds)
  const now = Math.floor(Date.now() / 1000);
  const swapDeadline = deadline ? parseInt(deadline) : undefined;
  if ((!!recipient && !isAddress(recipient)) || (!!deadline && (!/^[0-9]+$/.test(deadline) || swapDeadline! <= now || swapDeadline! > now + 86400))) {
    return res.status(400).json({ msg: 'invalid recipient or deadline' });
  }
  const swapRecipient = recipient || F2_ALE;

  // Optional, comma-separated: what to route around (e.g. pools a batch's earlier swaps
  // drained), in the aggregator's names from a route this returned. Pools are only
  // taken by KyberSwap; protocols by both (Enso's standards or aggregators)
  const listOf = (value: unknown) =>
    typeof value === 'string' && value ? value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) : [];
  const excludedPools = listOf(req.query.excludedPools);
  const excludedProtocols = listOf(req.query.excludedProtocols);
  // KyberSwap's pool ids: an address, a Uniswap v4 pool id, or an address with tokens (e.g. 0x…_0x…_0x…)
  const poolId = /^0x(?:[0-9a-f]{40}|[0-9a-f]{64})(?:_0x[0-9a-f]{40}){0,4}$/;
  if (excludedPools.length > 20 || excludedPools.some(pool => !poolId.test(pool))
    || excludedProtocols.length > 20 || excludedProtocols.some(protocol => !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(protocol))) {
    return res.status(400).json({ msg: 'invalid excluded pools or protocols' });
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
      const params = {
        aggregator,
        recipient: swapRecipient,
        chainId: 1,
        fromToken: sellToken,
        toToken: buyToken,
        amountIn: sellAmount,
        slippageTolerance: slippagePercentage,
        deadline: swapDeadline,
        // routing leftovers go back to an account swapping for itself
        refundReceiver: recipient || undefined,
        // and its swap, which can be executed minutes later, isn't routed through quotes expiring by then
        durableOnly: !!recipient,
        excludedPools,
        excludedProtocols,
      }
      const allowedAggregators = TOKEN_AGGREGATORS[buyToken.toLowerCase()] || TOKEN_AGGREGATORS[sellToken.toLowerCase()];
      // a requested aggregator, when allowed for the tokens, is the only one quoted: a Safe's
      // rounds all go through the same one
      const requestedAggregators = !!aggregator && (!allowedAggregators || allowedAggregators.includes(aggregator)) ? [aggregator] : undefined;

      let swapCalldata;
      let selectedData;
      const { bestQuote } = await getBestQuote(params, requestedAggregators || allowedAggregators);

      if(method === 'swap' && !!bestQuote?.aggregator) {
        // a requested aggregator must be allowed for the tokens
        params.aggregator = !!aggregator && (!allowedAggregators || allowedAggregators.includes(aggregator)) ? aggregator : bestQuote.aggregator;
        params.routeSummary = routeSummary || bestQuote.routeSummary;
        selectedData = await getSwapData(params);
        swapCalldata = selectedData?.calldata;
      }
      
      // a failure (the aggregators rate-limit, routes don't always come back) isn't
      // kept by the browser: asked again, it's tried again
      if (!bestQuote?.amountOut || bestQuote.amountOut === '0' || (method === 'swap' && !swapCalldata)) {
        res.setHeader('Cache-Control', 'no-store');
      }
      if (method === 'swap' && !swapCalldata) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch swap data, please try again' });
      }

      return res.status(200).json({
        buyAmount: bestQuote?.amountOut,
        bestProxyName: bestQuote?.aggregator,
        allowanceTarget: bestQuote?.exchangeProxy,
        exchangeProxy: bestQuote?.exchangeProxy,
        data: swapCalldata,
        gasPrice: bestQuote?.gasPrice,
        // what the swap data was built for: its own expected output (the minimum it
        // enforces derives from it), and who it pays
        ...(method === 'swap' ? { swapAmountOut: selectedData?.amountOut, recipient: swapRecipient, deadline: swapDeadline } : {}),
        // the route it goes through, when the aggregator describes it (RouteHop[])
        route: (method === 'swap' ? selectedData?.route : bestQuote?.route) || undefined,
      });
    }
  } catch (err) {
    console.error(err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: true, msg: 'Something went wrong' })
  }
}