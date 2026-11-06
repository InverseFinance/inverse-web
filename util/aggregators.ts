
// important: no fee on leverage

export interface SwapQuote {
  aggregator: string;
  amountOut: string;
  // Estimated gas units for the transaction
  gasEstimate?: string;
  priceImpact?: number;
  route?: any[];
  calldata?: string;
  to?: string;
  value?: string;
  error?: string;
  routeSummary?: any;
  exchangeProxy?: string;
}

export interface QuotesResult {
  bestQuote: SwapQuote,
  quotes: SwapQuote[],
  validQuotes: SwapQuote[],
}

export interface SwapExecuteParams {
  aggregator: string;
  chainId: number;
  fromToken: string;
  toToken: string;
  amountIn: string;
  recipient: string;
  slippageTolerance: number;
  referrerAddress?: string;
  referrerFee?: number; // in basis points (100 = 1%)
  id?: string;
  routeSummary?: any;
  // unix seconds after which the swap data reverts (KyberSwap's default: 20 minutes)
  deadline?: number;
  // who gets the routing leftovers (Enso), when not the default one
  refundReceiver?: string;
  // a swap executed minutes after it's quoted (a Safe's): routed only through sources
  // whose prices still hold by then (KyberSwap)
  durableOnly?: boolean;
}

// KyberSwap sources whose quotes don't last until a multisig executes: RFQ and market
// makers' quotes, limit orders, prop AMMs (priced by their operator block by block) and
// Angstrom's pools. KyberSwap tags the RFQ ones; the rest go by name. Read from its
// source list, these as of 2026-11 the fallback.
const KYBER_SHORT_LIVED_SOURCES = [
  'bebop', 'hashflow-v3', 'kyber-pmm', 'native-v1', 'native-v2', 'pmm-1', 'pmm-2', 'pmm-3', 'pmm-4', 'pmm-5', 'pmm-6',
  'pmm-7', 'pmm-8', 'pmm-10', 'pmm-11', 'pmm-12', 'pmm-18', 'pmm-19', 'pmm-20', 'kyberswap-limit-order',
  'kyberswap-limit-order-v2', 'bebop-prop', 'elzorro-prop', 'goliath-prop', 'kaliber-prop', 'kaliber-rwa-prop',
  'kipseli-prop', 'metric-propamm', 'stelaxis-prop', 'taurusfi-prop', 'tempest-prop', 'titan-prop', 'uniswap-v4-angstrom',
];
const isShortLivedKyberSource = (dex: { dexId: string, tags?: { name: string }[] | null }) =>
  !!dex.tags?.some(tag => tag.name === 'RFQ sources') || /-prop$|propamm|limit-order|angstrom/.test(dex.dexId);

let kyberShortLived: { at: number, ids: string[] } | undefined;
async function getKyberShortLivedSources(): Promise<string[]> {
  if (kyberShortLived && Date.now() - kyberShortLived.at < 3600_000) return kyberShortLived.ids;
  const ids = new Set(KYBER_SHORT_LIVED_SOURCES);
  try {
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`https://ks-setting.kyberswap.com/api/v1/dexes?chain=ethereum&isEnabled=true&pageSize=100&page=${page}`);
      const dexes = (await res.json())?.data?.dexes || [];
      dexes.filter(isShortLivedKyberSource).forEach(dex => ids.add(dex.dexId));
      if (dexes.length < 100) break;
    }
    kyberShortLived = { at: Date.now(), ids: [...ids] };
  } catch (e) {
    // the fallback list, asked again next time
  }
  return [...ids];
}

const kyberswapCommon = { aggregator: "kyberswap", exchangeProxy: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5' }
// KyberSwap API
async function getKyberSwapQuote(params: SwapExecuteParams): Promise<SwapQuote> {
  try {
    const excluded = params.durableOnly ? `&excludedSources=${(await getKyberShortLivedSources()).join(',')}` : '';
    const response = await fetch(`https://aggregator-api.kyberswap.com/ethereum/api/v1/routes?tokenIn=${params.fromToken}&tokenOut=${params.toToken}&amountIn=${params.amountIn}${excluded}`, {
      headers: {
        "Accept": "application/json",
        "x-client-Id": "inverse-finance",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { ...kyberswapCommon, amountOut: "0", error: error || "KyberSwap API error" };
    }

    const data = await response.json();

    return {
      ...kyberswapCommon,
      amountOut: data.data.routeSummary.amountOut || "0",
      gasEstimate: data.data.routeSummary.gas?.toString(),
      routeSummary: data.data.routeSummary,
      id: data.requestId,
      priceImpact: data.data.routeSummary.priceImpact ? parseFloat(data.data.routeSummary.priceImpact) * 100 : undefined,
    };
  } catch (error: any) {
    return { ...kyberswapCommon, amountOut: "0", error: error.message || "KyberSwap error" };
  }
}

async function getKyberSwapSwapData(params: SwapExecuteParams): Promise<SwapQuote> {
  try {
    const response = await fetch(`https://aggregator-api.kyberswap.com/ethereum/api/v1/route/build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-Id": "inverse-finance",
      },
      body: JSON.stringify({
        routeSummary: params.routeSummary,
        sender: params.recipient,
        recipient: params.recipient,
        // origin: params.recipient,
        // enableGasEstimation: false,
        // ignoreCappedSlippage: false,
        slippageTolerance: parseInt((params.slippageTolerance * 100).toFixed(0)),
        ...(params.deadline ? { deadline: params.deadline } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { aggregator: "kyberswap", amountOut: "0", error: error || "KyberSwap API error" };
    }

    const { data } = await response.json();

    return {
      aggregator: "kyberswap",
      amountOut: data.amountOut || "0",
      calldata: data.data,
      to: data.routerAddress,
      value: data.transactionValue,
      gasEstimate: data.gas?.toString(),
    };
  } catch (error: any) {
    return { aggregator: "kyberswap", amountOut: "0", error: error.message || "KyberSwap error", exchangeProxy: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5' };
  }
}

const ensoCommon = { aggregator: "enso", exchangeProxy: '0xF75584eF6673aD213a685a1B58Cc0330B8eA22Cf' };
// // Enso (via @ensofinance/sdk — see lib/enso.ts)
async function getEnsoQuote(params: SwapExecuteParams): Promise<SwapQuote> {
  try {
    if (!process.env.NEXT_PUBLIC_ENSO_API_KEY) {
      return {
        ...ensoCommon,
        amountOut: "0",
        error: "ENSO_API_KEY is not set",
      };
    }

    const fromAddress = params.recipient;
    const tokenIn = params.fromToken;
    const tokenOut = params.toToken;
    const amountIn = params.amountIn;
    const slippage = (params.slippageTolerance * 100).toFixed(0);

    const res = await fetch(`https://api.enso.build/api/v1/shortcuts/quote?chainId=1&fromAddress=${fromAddress}&amountIn=${amountIn}&slippage=${slippage}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&priceImpact=true&routingStrategy=router`, {
      method: "GET",
      headers: {
        'accept': "*/*",
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ENSO_API_KEY}`,
      },
    });

    const data = await res.json();

    if (res.status !== 200 || !data.amountOut) {
      return {
        ...ensoCommon,
        amountOut: "0",
        error: data?.statusCode === 404 ? "No route found" : "Call failed",
      };
    }

    const amountOut = String(data.amountOut ?? "0");
    const priceImpactBps =
      data.priceImpact != null && data.priceImpact !== ""
        ? Number(data.priceImpact)
        : undefined;
    return {
      ...ensoCommon,
      amountOut,
      priceImpact:
        priceImpactBps !== undefined && !Number.isNaN(priceImpactBps)
          ? priceImpactBps / 100
          : undefined,
      route: data.route,
    };
  } catch (error: any) {
    return {
      ...ensoCommon,
      amountOut: "0",
      error: error.message || "Enso error",
    };
  }
}

async function getEnsoSwapData(params: SwapExecuteParams): Promise<SwapQuote> {
  try {
    if (!process.env.NEXT_PUBLIC_ENSO_API_KEY) {
      return {
        ...ensoCommon,
        aggregator: "enso",
        amountOut: "0",
        error: "ENSO_API_KEY is not set",
      };
    }

    const fromAddress = params.recipient;
    const tokenIn = params.fromToken;
    const tokenOut = params.toToken;
    const amountIn = params.amountIn;
    const slippage = (params.slippageTolerance * 100).toFixed(0);

    const refundReceiver = params.refundReceiver || '0x8dF2fBeBc0fe876e4001b9E89361C5aE02d663d2';

    const res = await fetch(`https://api.enso.build/api/v1/shortcuts/route?chainId=1&toEoa=true&fromAddress=${fromAddress}&amountIn=${amountIn}&slippage=${slippage}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&refundReceiver=${refundReceiver}&priceImpact=true&routingStrategy=router`, {
      method: "GET",
      headers: {
        'accept': "*/*",
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ENSO_API_KEY}`,
      }
    });
    const data = await res.json();

    const amountOut = String(data.amountOut ?? "0");
    const priceImpactBps =
      data.priceImpact != null && data.priceImpact !== ""
        ? Number(data.priceImpact)
        : undefined;
    return {
      ...ensoCommon,
      amountOut,
      calldata: data.tx.data,
      to: data.tx.to,
      value: String(data.tx.value ?? "0"),
      priceImpact:
        priceImpactBps !== undefined && !Number.isNaN(priceImpactBps)
          ? priceImpactBps / 100
          : undefined,
      gasEstimate:
        data.gas !== undefined && data.gas !== null
          ? String(data.gas)
          : undefined,
      route: data.route,
    };
  } catch (error: any) {
    return {
      ...ensoCommon,
      amountOut: "0",
      error: error.message || "Enso error",
    };
  }
}


export type Aggregator = 'kyberswap' | 'enso';

const quoteGetters: { [key in Aggregator]: (params: SwapExecuteParams) => Promise<SwapQuote> } = {
  kyberswap: getKyberSwapQuote,
  enso: getEnsoQuote,
};

// Get best quote from the aggregators (default: all of them), important: no fee on leverage
export async function getBestQuote(params: SwapExecuteParams, aggregators = Object.keys(quoteGetters) as Aggregator[]): Promise<QuotesResult> {
  const quotes = await Promise.allSettled(aggregators.map(aggregator => quoteGetters[aggregator](params)));

  const validQuotes: SwapQuote[] = [];

  for (const result of quotes) {
    if (result.status === "fulfilled" && !result.value.error && result.value.amountOut !== "0") {
      validQuotes.push(result.value);
    }
  }

  if (validQuotes.length === 0) {
    // Return the first error if available
    for (const result of quotes) {
      if (result.status === "fulfilled" && result.value.error) {
        // console.log(result)
        return result.value;
      }
    }
    return {
      quotes: [],
      validQuotes: [],
      bestQuote: { aggregator: "unknown", amountOut: "0", error: "No quotes available" },
    };
  }

  // Sort by amountOut (descending) to get the best quote
  validQuotes.sort((a, b) => {
    const aAmount = BigInt(a.amountOut || "0");
    const bAmount = BigInt(b.amountOut || "0");
    if (aAmount > bAmount) return -1;
    if (aAmount < bAmount) return 1;
    return 0;
  });

  // console.log('quotes')
  // console.log(quotes)
  console.log(validQuotes)

  return {
    quotes,
    validQuotes,
    bestQuote: validQuotes[0],
  };
}

// Get swap execution data, important: no fee on leverage
export async function getSwapData(params: SwapExecuteParams): Promise<SwapQuote> {
  switch (params.aggregator) {
    case "kyberswap":
      return getKyberSwapSwapData(params);
    case "enso":
      return getEnsoSwapData(params);
    default:
      return { aggregator: params.aggregator, amountOut: "0", error: "Unknown aggregator" };
  }
}
