

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
}

const kyberswapCommon = { aggregator: "kyberswap", exchangeProxy: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5' }
// KyberSwap API
async function getKyberSwapQuote(params: SwapExecuteParams): Promise<SwapQuote> {
  try {
    const response = await fetch(`https://aggregator-api.kyberswap.com/ethereum/api/v1/routes?tokenIn=${params.fromToken}&tokenOut=${params.toToken}&amountIn=${params.amountIn}`, {
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

    const res = await fetch(`https://api.enso.build/api/v1/shortcuts/route?chainId=1&toEoa=true&fromAddress=${fromAddress}&amountIn=${amountIn}&slippage=${slippage}&tokenIn=${tokenIn}&tokenOut=${tokenOut}&refundReceiver=0x8dF2fBeBc0fe876e4001b9E89361C5aE02d663d2&priceImpact=true&routingStrategy=router`, {
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


// Get best quote from all aggregators
export async function getBestQuote(params: SwapExecuteParams): Promise<QuotesResult> {
  const quotes = await Promise.allSettled([
    getKyberSwapQuote(params),
    getEnsoQuote(params),
  ]);

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

// Get swap execution data
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
