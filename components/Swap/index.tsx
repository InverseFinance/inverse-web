import { Text, Stack, SimpleGrid, Divider } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import Container from '@app/components/common/Container'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useAllowances, useStabilizerApprovals } from '@app/hooks/useApprovals'
import { useBalances, useStabilizerBalance } from '@app/hooks/useBalances'
import { useWeb3React } from '@web3-react/core'
import { useState, useEffect } from 'react'
import { getTokenBalance, hasAllowance } from '@app/util/web3'
import { getParsedBalance, getToken } from '@app/util/markets'
import { Token, Swappers } from '@app/types';
import { InverseAnimIcon } from '@app/components/common/Animation'
import { crvGetDyUnderlying, crvSwap, estimateCrvSwap, getERC20Contract, getStabilizerContract } from '@app/util/contracts'
import { handleTx, HandleTxOptions } from '@app/util/transactions';
import { constants, BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { STABILIZER_FEE } from '@app/config/constants'
import { AssetInput } from '@app/components/common/Assets/AssetInput'
import { SwapFooter } from './SwapFooter'
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { useGasPrice, usePrices } from '@app/hooks/usePrices'
import { InfoMessage } from '@app/components/common/Messages'

const routes = [
  { value: Swappers.crv, label: 'Curve' },
  { value: Swappers.stabilizer, label: 'Stabilizer' },
  // { value: Swappers.oneinch, label: '1Inch' },
]

// multiply by Gas Price to get Eth cost
const DEFAULT_STAB_BUY_COST = 0.000117044;
const DEFAULT_STAB_SELL_COST = 0.000145434;
const DEFAULT_CRV_COST = 0.000319716;

// TODO: refacto + add INV
export const SwapView = ({ from = '', to = '' }: { from?: string, to?: string }) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>()
  const gasPrice = useGasPrice();
  const { prices } = usePrices();
  const { TOKENS, DOLA, DAI, USDC, USDT, INV, DOLA3POOLCRV, STABILIZER } = getNetworkConfigConstants(chainId)

  const contracts: { [key: string]: string } = { [Swappers.crv]: DOLA3POOLCRV, [Swappers.stabilizer]: STABILIZER }

  const swapOptions = [DOLA, DAI, USDC, USDT]//, INV];

  const [fromAmount, setFromAmount] = useState<string>('')
  const [toAmount, setToAmount] = useState<string>('')
  const [exRates, setExRates] = useState<{ [key: string]: { [key: string]: number } }>({
    [Swappers.crv]: {},
    [Swappers.stabilizer]: { 'DAIDOLA': 1 - STABILIZER_FEE, 'DOLADAI': 1 - STABILIZER_FEE },
    [Swappers.oneinch]: {},
  })
  const [maxSlippage, setMaxSlippage] = useState<number>(1)
  const [isDisabled, setIsDisabled] = useState<boolean>(true)
  const { balance: stabilizerBalance } = useStabilizerBalance()
  const defaultFromToken = getToken(TOKENS, from) || getToken(TOKENS, 'DOLA')!;
  const defaultToToken = getToken(TOKENS, to) || getToken(TOKENS, 'DAI')!
  const [fromToken, setFromToken] = useState(defaultFromToken)
  const [toToken, setToToken] = useState(defaultToToken.symbol !== defaultFromToken.symbol ? defaultToToken : defaultFromToken.symbol === 'DOLA' ? TOKENS[DAI] : TOKENS[DOLA])
  const [bestRoute, setBestRoute] = useState<Swappers | ''>('')
  const [chosenRoute, setChosenRoute] = useState<Swappers>(Swappers.stabilizer)
  const [manualChosenRoute, setManualChosenRoute] = useState<Swappers | ''>('')
  const [swapDir, setSwapDir] = useState<string>(fromToken.symbol + toToken.symbol)
  const [canUseStabilizer, setCanUseStabilizer] = useState(true);
  const [noStabilizerLiquidity, setNoStabilizerLiquidity] = useState(false);
  const [notEnoughTokens, setNotEnoughTokens] = useState(false);

  const [isAnimStopped, setIsAnimStopped] = useState(true)

  const { balances: balancesWithCache } = useBalances(swapOptions)
  const { approvals } = useAllowances(swapOptions, DOLA3POOLCRV)
  const { approvals: stabilizerApprovals } = useStabilizerApprovals()
  const [freshApprovals, setFreshApprovals] = useState<{ [key: string]: boolean }>({})
  const [freshBalances, setFreshBalances] = useState<{ [key: string]: BigNumber }>({})

  const [isApproved, setIsApproved] = useState(hasAllowance(approvals, fromToken.address));
  const [txCosts, setTxCosts] = useState({ [Swappers.crv]: 0, [Swappers.stabilizer]: 0 });
  const [includeCostInBestRate, setIncludeCostInBestRate] = useState(true);

  useEffect(() => {
    if (!from || !to) { return }
    const fromToken = getToken(TOKENS, from) || getToken(TOKENS, 'DOLA')!;
    const toToken = getToken(TOKENS, to) || getToken(TOKENS, 'DAI')!;
    setFromToken(fromToken);
    setToToken(toToken.symbol !== fromToken.symbol ? toToken : fromToken.symbol === 'DOLA' ? TOKENS[DAI] : TOKENS[DOLA]);
  }, [from, to]);

  useEffect(() => {
    setSwapDir(fromToken.symbol + toToken.symbol);
    const stablizerTokens = ['DOLA', 'DAI'];
    setCanUseStabilizer(stablizerTokens.includes(fromToken.symbol) && stablizerTokens.includes(toToken.symbol));
  }, [fromToken, toToken])

  useEffect(() => {
    const contractApprovals: any = { [Swappers.crv]: approvals, [Swappers.stabilizer]: stabilizerApprovals }
    setIsApproved(freshApprovals[chosenRoute + fromToken.address] || hasAllowance(contractApprovals[chosenRoute], fromToken.address))
  }, [approvals, chosenRoute, stabilizerApprovals, fromToken, freshApprovals])

  useEffect(() => {
    changeAmount(fromAmount, true)
  }, [exRates, chosenRoute])

  useDebouncedEffect(() => {
    const fetchRates = async () => {
      if (!library) { return }

      // crv rates
      const rateAmountRef = fromAmount && parseFloat(fromAmount) > 1 ? parseFloat(fromAmount) : 1;
      const dy = await crvGetDyUnderlying(library, fromToken, toToken, rateAmountRef);

      let costCrvInEth = DEFAULT_CRV_COST * gasPrice;
      const isStabBuy = toToken.symbol === 'DOLA';
      let costStabInEth = (isStabBuy ? DEFAULT_STAB_BUY_COST : DEFAULT_STAB_SELL_COST) * gasPrice;

      // try to get dynamic estimation, may fail if signer has not enough balance or token is not approved yet
      try {
        const costCrv = await estimateCrvSwap(library?.getSigner(), fromToken, toToken, parseFloat(fromAmount || '1'), parseFloat(toAmount || '1'));
        const stabContract = getStabilizerContract(library.getSigner());
        // buy and sell is around the same
        const amountMinusFee = parseFloat(fromAmount || '1') - STABILIZER_FEE * parseFloat(fromAmount || '1');
        const costStab = await stabContract.estimateGas[isStabBuy ? 'buy' : 'sell'](parseUnits(amountMinusFee.toFixed(fromToken.decimals)));
        costCrvInEth = parseFloat(formatUnits(costCrv, 'gwei')) * gasPrice;
        costStabInEth = parseFloat(formatUnits(costStab, 'gwei')) * gasPrice;
      } catch (e) {
        console.log('can not estimate gas fees dynamically: prolly not enough balance or allowance');
      }

      setTxCosts({ [Swappers.crv]: costCrvInEth, [Swappers.stabilizer]: costStabInEth });

      const exRate = parseFloat(dy) / rateAmountRef;
      const crvRates = { ...exRates[Swappers.crv], [swapDir]: exRate }
      setExRates({ ...exRates, [Swappers.crv]: crvRates });
    }
    fetchRates()
  }, [library, fromAmount, fromToken, toToken, swapDir, gasPrice], 500);

  useEffect(() => {
    setManualChosenRoute('');
  }, [fromAmount, fromToken, includeCostInBestRate]);

  useEffect(() => {
    if (!library || !exRates[Swappers.crv][swapDir]) { return }
    const newBestRoute = getBestRoute();

    if (bestRoute === '' && newBestRoute || (newBestRoute && chosenRoute !== newBestRoute && !manualChosenRoute)) {
      setChosenRoute(newBestRoute);
    }
    setBestRoute(newBestRoute);
  }, [exRates, swapDir, fromToken, fromAmount, toAmount, stabilizerBalance, canUseStabilizer, txCosts, includeCostInBestRate, manualChosenRoute]);

  // best route bewteen CRV, STABILIZER & 1INCH
  const getBestRoute = () => {
    // if INV case we can only use 1inch
    if (fromToken.symbol === 'INV') {
      return Swappers.oneinch
    } // if DOLA-DAI we can use either stabilizer, crv or 1inch
    else if (canUseStabilizer) {
      const notEnoughLiquidity = toToken.symbol === 'DAI' ? parseFloat(toAmount) > stabilizerBalance : false;
      setNoStabilizerLiquidity(notEnoughLiquidity);
      const useCrv = notEnoughLiquidity || exRates[Swappers.crv][swapDir] > exRates[Swappers.stabilizer][swapDir];

      if (!includeCostInBestRate) {
        return useCrv ? Swappers.crv : Swappers.stabilizer
      } else {
        const ethPrice = prices && prices[TOKENS.CHAIN_COIN.coingeckoId] ? prices[TOKENS.CHAIN_COIN.coingeckoId].usd : 0;
        const crvTotal = parseFloat(fromAmount || '1') * exRates[Swappers.crv][swapDir] - txCosts[Swappers.crv] * ethPrice;
        const stabTotal = parseFloat(fromAmount || '1') * exRates[Swappers.stabilizer][swapDir] - txCosts[Swappers.stabilizer] * ethPrice;
        const useCrv = notEnoughLiquidity || crvTotal > stabTotal;
        return useCrv ? Swappers.crv : Swappers.stabilizer
      }
    }
    // for other cases crv
    return Swappers.crv
  }

  const changeToken = (newToken: Token, setter: (v: Token) => void, otherToken: Token, otherSetter: (v: Token) => void) => {
    setter(newToken)
    if (newToken.symbol === otherToken.symbol) {
      otherSetter(newToken.symbol === 'DOLA' ? TOKENS[DAI] : TOKENS[DOLA])
    }
  }

  const changeAmount = (newAmount: string, isFrom: boolean) => {
    const setter = isFrom ? setFromAmount : setToAmount
    setter(newAmount);

    const otherSetter = !isFrom ? setFromAmount : setToAmount
    const fromToExRate = exRates[chosenRoute][swapDir];
    const toFromExRate = fromToExRate ? 1 / fromToExRate : 0;

    const amount = parseFloat(newAmount) || 0
    const balances = { ...balancesWithCache, ...freshBalances }
    const fromBalance = getParsedBalance(balances, fromToken.address, fromToken.decimals);
    setNotEnoughTokens(amount > fromBalance)
    setIsDisabled(!(amount > 0) || amount > fromBalance)

    changeOtherAmount(newAmount, otherSetter, isFrom ? fromToExRate : toFromExRate)
  }

  const changeOtherAmount = (changedAmount: string, otherSetter: (v: string) => void, exRate: number) => {
    if (changedAmount === '' || !exRate) {
      otherSetter('')
      return
    }
    const amount = parseFloat(changedAmount) || 0
    otherSetter((amount * exRate).toString())
  }

  const handleInverse = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
    setIsAnimStopped(false)
    setTimeout(() => setIsAnimStopped(true), 1000)
  }

  const approveToken = async (token: string, options: HandleTxOptions) => {
    return handleTx(
      await getERC20Contract(token, library?.getSigner()).approve(contracts[chosenRoute], constants.MaxUint256),
      options,
    )
  }

  const onSwapSuccess = async (from: Token, to: Token) => {
    if (!library?.getSigner()) { return }
    setFreshBalances({
      ...freshBalances,
      [from.address]: await getTokenBalance(from, library?.getSigner()),
      [to.address]: await getTokenBalance(to, library?.getSigner()),
    })
  }

  const handleSubmit = async (from: Token, to: Token) => {
    if (!library?.getSigner()) { return }
    let tx;
    // 1inch v4 can "approve and swap" in 1 tx
    if (isApproved || chosenRoute === Swappers.oneinch) {
      if (chosenRoute === Swappers.crv) {
        tx = await crvSwap(library?.getSigner(), fromToken, toToken, parseFloat(fromAmount), parseFloat(toAmount), maxSlippage);
      } else if (chosenRoute === Swappers.stabilizer) {
        const contract = getStabilizerContract(library?.getSigner())
        const stabilizerOperation: string = toToken.symbol === 'DOLA' ? 'buy' : 'sell'
        // reduce amount to cover stabilizer fee
        const amountMinusFee = parseFloat(fromAmount) - STABILIZER_FEE * parseFloat(fromAmount);
        tx = contract[stabilizerOperation](parseUnits(amountMinusFee.toFixed(fromToken.decimals)));
      } // TODO : handle 1inch
      else {

      }
      return handleTx(tx, { onSuccess: () => onSwapSuccess(from, to) })
    } else {
      return approveToken(fromToken.address, {
        onSuccess: () => {
          setFreshApprovals({ ...freshApprovals, [chosenRoute + fromToken.address]: true });
        }
      })
    }
  }

  const handleRouteChange = (newValue: Swappers) => {
    setManualChosenRoute(newValue);
    setChosenRoute(newValue);
  }
  const balances = { ...balancesWithCache, ...freshBalances }
  const commonAssetInputProps = { tokens: TOKENS, balances, showBalance: true }

  const onIncludeTxCostChange = () => {
    setIncludeCostInBestRate(!includeCostInBestRate);
  }

  return (
    <Container
      contentBgColor="gradient3"
      label="Swap DOLA using Curve or the Stabilizer"
    >
      <Stack w="full" direction="column" spacing="5">
        <AssetInput
          amount={fromAmount}
          token={fromToken}
          assetOptions={swapOptions}
          onAssetChange={(newToken) => changeToken(newToken, setFromToken, toToken, setToToken)}
          onAmountChange={(newAmount) => changeAmount(newAmount, true)}
          {...commonAssetInputProps}
        />

        <SimpleGrid columns={3} w="full" alignItems="center">
          <Text opacity="0.6" align="left">From {fromToken.symbol}</Text>
          <InverseAnimIcon height={50} width={50} autoplay={!isAnimStopped} loop={false}
            boxProps={{ onClick: handleInverse, w: "full", textAlign: "center" }} />
          <Text opacity="0.6" align="right">To {toToken.symbol}</Text>
        </SimpleGrid>

        <AssetInput
          amount={toAmount}
          token={toToken}
          assetOptions={swapOptions}
          onAssetChange={(newToken) => changeToken(newToken, setToToken, fromToken, setFromToken)}
          onAmountChange={(newAmount) => changeAmount(newAmount, false)}
          {...commonAssetInputProps}
        />

        <Divider borderColor="#ccccccaa" />

        {
          !!account ?
            <SwapFooter
              bestRoute={bestRoute}
              chosenRoute={chosenRoute}
              routes={routes}
              isApproved={isApproved}
              isDisabled={isDisabled}
              canUseStabilizer={canUseStabilizer}
              noStabilizerLiquidity={noStabilizerLiquidity}
              notEnoughTokens={notEnoughTokens}
              exRates={exRates}
              fromToken={fromToken}
              fromAmount={fromAmount}
              toToken={toToken}
              toAmount={toAmount}
              maxSlippage={maxSlippage}
              costs={txCosts}
              ethPriceUsd={prices && prices[TOKENS.CHAIN_COIN.coingeckoId] ? prices[TOKENS.CHAIN_COIN.coingeckoId].usd : 0}
              includeCostInBestRate={includeCostInBestRate}
              onIncludeTxCostChange={onIncludeTxCostChange}
              onRouteChange={handleRouteChange}
              onMaxSlippageChange={setMaxSlippage}
              handleSubmit={() => handleSubmit(fromToken, toToken)}
            />
            :
            <InfoMessage alertProps={{ w: 'full' }} description="Pleace Connect your wallet" />
        }
      </Stack>
    </Container>
  )
}
