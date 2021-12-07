import { Text, Stack, Flex, Box, useDisclosure, SimpleGrid, Badge, Divider } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import Container from '@inverse/components/common/Container'
import { BalanceInput } from '@inverse/components/common/Input'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { useAllowances, useStabilizerApprovals } from '@inverse/hooks/useApprovals'
import { useBalances, useStabilizerBalance } from '@inverse/hooks/useBalances'
import { useWeb3React } from '@web3-react/core'
import { useState, useEffect } from 'react'
import { hasAllowance } from '@inverse/util/web3'
import { FromAssetDropdown } from '@inverse/components/common/Assets/FromAssetDropdown'
import { getParsedBalance } from '@inverse/util/markets'
import { BigNumberList, Token, TokenList } from '@inverse/types';
import { InverseAnimIcon } from '@inverse/components/common/Animation'
import { SubmitButton } from '@inverse/components/common/Button'
import { crvGetDyUnderlying, crvSwap, getERC20Contract, getStabilizerContract } from '@inverse/util/contracts'
import { handleTx, HandleTxOptions } from '@inverse/util/transactions';
import { constants } from 'ethers'
import { isAddress, parseUnits } from 'ethers/lib/utils';
import { formatUnits } from 'ethers/lib/utils';
import { STABILIZER_FEE } from '@inverse/config/constants'
import { RadioCardGroup } from '@inverse/components/common/Input/RadioCardGroup'
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'
import { InfoMessage } from '@inverse/components/common/Messages'

const getMaxBalance = (balances: BigNumberList, token: Token) => {
  return getParsedBalance(balances, token.address, token.decimals);
}

const AssetInput = ({
  amount,
  balances,
  token,
  tokens,
  assetOptions,
  onAssetChange,
  onAmountChange
}: {
  amount: string,
  balances: BigNumberList,
  token: Token,
  tokens: TokenList,
  assetOptions: string[],
  onAssetChange: (newToken: Token) => void,
  onAmountChange: (newAmount: string) => void,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [justClosed, setJustClosed] = useState(isOpen)

  useEffect(() => {
    if (!isOpen) { setJustClosed(true) }
    setTimeout(() => setJustClosed(false), 200)
  }, [isOpen])

  const setAmountToMax = () => {
    onAmountChange((Math.floor(getMaxBalance(balances, token) * 1e8) / 1e8).toString())
  }

  return (
    <BalanceInput
      value={amount}
      onChange={(e: React.MouseEvent<HTMLInputElement>) => onAmountChange(e.currentTarget.value)}
      onMaxClick={setAmountToMax}
      inputProps={{ fontSize: { base: '12px', sm: '16px' }, minW: { base: 'full', sm: '280px' } }}
      label={
        <Stack direction="row" align="center" p={2} spacing={4} cursor="pointer">
          <Flex w={0.5} h={8}>
            <Flex w="full" h="full" bgColor="purple.500" borderRadius={8} />
          </Flex>
          <FromAssetDropdown
            tokens={tokens}
            balances={balances}
            isOpen={isOpen}
            onClose={onClose}
            onOpen={() => {
              if (!isOpen && !justClosed) { onOpen() }
            }}
            asset={token}
            options={assetOptions}
            handleChange={(selected: string) => {
              onClose()
              onAssetChange(tokens[selected])
            }}
          />
        </Stack>
      }
    />
  )
}

const getToken = (tokens: TokenList, symbolOrAddress: string) => {
  return Object.entries(tokens)
    .map(([address, token]) => token)
    .find(token => isAddress(symbolOrAddress) ? token.address === symbolOrAddress : token.symbol === symbolOrAddress)
}

enum Swappers {
  crv = 'crv',
  oneinch = '1inch',
  stabilizer = 'stabilizer',
}

const routes = [
  { value: Swappers.crv, label: 'Curve' },
  { value: Swappers.stabilizer, label: 'Stabilizer' },
  // { value: Swappers.oneinch, label: '1Inch' },
]

export const SwapView = ({ from, to }: { from: string, to: string }) => {
  const { active, library, chainId } = useWeb3React<Web3Provider>()
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
  const [bestRoute, setBestRoute] = useState<Swappers>(fromToken?.symbol !== 'INV' ? Swappers.crv : Swappers.oneinch)
  const [chosenRoute, setChosenRoute] = useState<Swappers>(bestRoute)
  const [swapDir, setSwapDir] = useState<string>(fromToken.symbol + toToken.symbol)
  const [canUseStabilizer, setCanUseStabilizer] = useState(true);

  const [isAnimStopped, setIsAnimStopped] = useState(true)

  const { balances } = useBalances(swapOptions)
  const { approvals } = useAllowances(swapOptions, DOLA3POOLCRV)
  const { approvals: stabilizerApprovals } = useStabilizerApprovals()

  const [isApproved, setIsApproved] = useState(hasAllowance(approvals, fromToken.address));

  useEffect(() => {
    setSwapDir(fromToken.symbol + toToken.symbol);
    const stablizerTokens = ['DOLA', 'DAI'];
    setCanUseStabilizer(stablizerTokens.includes(fromToken.symbol) && stablizerTokens.includes(toToken.symbol));
  }, [fromToken, toToken])

  useEffect(() => {
    const contractApprovals: any = { [Swappers.crv]: approvals, [Swappers.stabilizer]: stabilizerApprovals }
    setIsApproved(hasAllowance(contractApprovals[chosenRoute], fromToken.address))
  }, [approvals, chosenRoute, stabilizerApprovals])

  useEffect(() => {
    changeAmount(fromAmount, true)
  }, [exRates, chosenRoute])

  useEffect(() => {
    const fetchRates = async () => {
      const exRateKeyReverse = toToken.symbol + fromToken.symbol;
      if (!library || exRates[chosenRoute][swapDir]) { return }

      // crv rates
      const rateAmountRef = fromAmount && parseFloat(fromAmount) > 1 ? parseFloat(fromAmount) : 1;
      const dy = await crvGetDyUnderlying(library, fromToken, toToken, rateAmountRef);
      const exRate = parseFloat(dy) / rateAmountRef;
      const reverseExRate = exRate ? 1 / parseFloat(dy) : 0;
      const crvRates = { ...exRates[Swappers.crv], [swapDir]: exRate, [exRateKeyReverse]: reverseExRate }

      setExRates({ ...exRates, [Swappers.crv]: crvRates });
    }
    fetchRates()
  }, [library, fromToken, toToken, swapDir, chosenRoute])

  useEffect(() => {
    getBestRoute()
  }, [exRates, fromToken, toToken, fromAmount, toAmount, stabilizerBalance, balances])

  const getStabilizerMax = (stabilizerRate: number) => {
    if (!balances) { return 0 }

    return fromToken.symbol === 'DAI' ?
      parseFloat(formatUnits(balances[DAI])) * stabilizerRate
      : Math.min(parseFloat(formatUnits(balances[DOLA])), stabilizerBalance)
  }

  // best route bewteen CRV, STABILIZER & 1INCH
  const getBestRoute = () => {
    // if INV case we can only use 1inch
    if (fromToken.symbol === 'INV') {
      setBestRoute(Swappers.oneinch);
    } // if DOLA-DAI we can use either stabilizer, crv or 1inch
    else if (canUseStabilizer) {
      const stabilizerMax = getStabilizerMax(1 - STABILIZER_FEE)
      const notEnoughLiquidity = parseFloat(fromAmount) > stabilizerMax;
      const useCrv = notEnoughLiquidity || exRates[Swappers.crv][swapDir] > exRates[Swappers.stabilizer][swapDir]
      setBestRoute(useCrv ? Swappers.crv : Swappers.stabilizer);
    } // for other cases crv
    else {
      setBestRoute(Swappers.crv)
    }
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
    changeOtherAmount(newAmount, otherSetter, isFrom ? fromToExRate : toFromExRate)
  }

  const changeOtherAmount = (changedAmount: string, otherSetter: (v: string) => void, exRate: number) => {
    if (changedAmount === '' || !exRate) {
      otherSetter('')
      return
    }
    const amount = parseFloat(changedAmount) || 0
    setIsDisabled(!(amount > 0))
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

  const handleSubmit = async () => {
    if (!library?.getSigner()) { return }
    // 1inch v4 can "approve and swap" in 1 tx
    if (isApproved || chosenRoute === Swappers.oneinch) {
      if (chosenRoute === Swappers.crv) {
        return crvSwap(library?.getSigner(), fromToken, toToken, parseFloat(fromAmount), parseFloat(toAmount), maxSlippage)
      } else if (chosenRoute === Swappers.stabilizer) {
        const contract = getStabilizerContract(library?.getSigner())
        const stabilizerOperation: string = toToken.symbol === 'DOLA' ? 'buy' : 'sell'
        contract[stabilizerOperation](parseUnits(fromAmount));
      } // TODO : handle 1inch
      else {

      }
    } else {
      return approveToken(fromToken.address, { onSuccess: () => setIsApproved(true) })
    }
  }

  const handleRouteChange = (newValue: Swappers) => {
    setChosenRoute(newValue);
  }

  const commonAssetInputProps = { tokens: TOKENS, balances }

  const routeRadioOptions = routes.map((route) => {
    return {
      value: route.value,
      label: <Box position="relative" p="5">
        {route.label}
        {route.value === bestRoute ?
          <Badge bgColor="secondary" textTransform="none" fontSize="10px" color="primary" position="absolute" top="-1" right="-1">
            Best Rate
          </Badge> : null
        }
      </Box>
    }
  })

  return (
    <Container
      label="Swap using Curve or the Stabilizer"
      description="Swap between DOLA, DAI, USDC and USDT"
      href="https://docs.inverse.finance/anchor-and-dola-overview"
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

        <RadioCardGroup
          wrapperProps={{ w: 'full', alignItems: 'center', justify: 'center' }}
          group={{
            name: 'swapper',
            defaultValue: bestRoute,
            onChange: handleRouteChange,
          }}
          radioCardProps={{ p: 0, mx: '2' }}
          options={routeRadioOptions}
        />

        {
          chosenRoute === Swappers.stabilizer && !canUseStabilizer ?
            <InfoMessage alertProps={{ w:'full' }} description="The Stabilizer can only be used for the DAI-DOLA pair" />
            :
            <>
              <Text textAlign="center" w="full" fontSize="12px" mt="2">
                {`Exchange Rate : 1 ${fromToken.symbol} = ${exRates[chosenRoute][fromToken.symbol + toToken.symbol]?.toFixed(4) || ''} ${toToken.symbol}`}
              </Text>

              {
                chosenRoute === Swappers.stabilizer ? null
                  :
                  <Text textAlign="center" w="full" fontSize="12px" mt="2">
                    {`Max. slippage is set to 1%, the min. received will be ${toAmount === '' ? '0' : (parseFloat(toAmount) - (parseFloat(toAmount) * maxSlippage / 100)).toFixed(4)}`}
                  </Text>
              }

              <SubmitButton isDisabled={isDisabled} onClick={handleSubmit}>
                {
                  isApproved ? 'Swap' : 'Approve'
                }
                {
                  !isApproved ?
                    <AnimatedInfoTooltip iconProps={{ ml: '2' }} message="Approvals are required once per Token and Protocol" /> : null
                }
              </SubmitButton>
            </>
        }
      </Stack>
    </Container>
  )
}
