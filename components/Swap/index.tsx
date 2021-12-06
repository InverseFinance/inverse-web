import { Text, Stack, Flex, useDisclosure, SimpleGrid } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import Container from '@inverse/components/common/Container'
import { BalanceInput } from '@inverse/components/common/Input'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { useAllowances } from '@inverse/hooks/useApprovals'
import { useBalances } from '@inverse/hooks/useBalances'
import { useWeb3React } from '@web3-react/core'
import { useState, useEffect } from 'react'
import { hasAllowance } from '@inverse/util/web3'
import { FromAssetDropdown } from '@inverse/components/common/Assets/FromAssetDropdown'
import { getParsedBalance } from '@inverse/util/markets'
import { BigNumberList, Token, TokenList } from '@inverse/types';
import { InverseAnimIcon } from '@inverse/components/common/Animation'
import { SubmitButton } from '@inverse/components/common/Button'
import { crvGetDyUnderlying, crvSwap, getERC20Contract } from '@inverse/util/contracts'
import { handleTx, HandleTxOptions } from '@inverse/util/transactions';
import { constants } from 'ethers'
import { isAddress } from 'ethers/lib/utils';

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

export const SwapView = ({ from, to }: { from: string, to: string }) => {
  const { active, library, chainId } = useWeb3React<Web3Provider>()
  const { TOKENS, DOLA, DAI, USDC, USDT, DOLA3POOLCRV } = getNetworkConfigConstants(chainId)

  const swapOptions = [DOLA, DAI, USDC, USDT];

  const [fromAmount, setFromAmount] = useState<string>('')
  const [toAmount, setToAmount] = useState<string>('')
  const [exRates, setExRates] = useState<{ [key: string]: number }>({})
  const [maxSlippage, setMaxSlippage] = useState<number>(1)
  const [isDisabled, setIsDisabled] = useState<boolean>(true)
  const defaultFromToken = getToken(TOKENS, from) || getToken(TOKENS, 'DOLA')!;
  const defaultToToken = getToken(TOKENS, to) || getToken(TOKENS, 'DAI')!
  const [fromToken, setFromToken] = useState(defaultFromToken)
  const [toToken, setToToken] = useState(defaultToToken.symbol !== defaultFromToken.symbol ? defaultToToken : defaultFromToken.symbol === 'DOLA' ? TOKENS[DAI] : TOKENS[DOLA])
  const [isAnimStopped, setIsAnimStopped] = useState(true)

  const { balances } = useBalances(swapOptions)
  const { approvals } = useAllowances(swapOptions, DOLA3POOLCRV)

  const [isApproved, setIsApproved] = useState(hasAllowance(approvals, fromToken.address));

  useEffect(() => {
    setIsApproved(hasAllowance(approvals, fromToken.address))
  }, [approvals])

  useEffect(() => {
    changeAmount(fromAmount, true)
  }, [exRates])

  useEffect(() => {
    const fetchCrvExRate = async () => {
      const exRateKey = fromToken.symbol + toToken.symbol;
      const exRateKeyReverse = toToken.symbol + fromToken.symbol;
      if (!library || exRates[exRateKey]) { return }
      const dy = await crvGetDyUnderlying(library, fromToken, toToken, 1);
      const exRate = parseFloat(dy);
      const reverseExRate = exRate ? 1 / parseFloat(dy) : 0;
      setExRates({ ...exRates, [exRateKey]: exRate, [exRateKeyReverse]: reverseExRate });
    }
    fetchCrvExRate()
  }, [library, fromToken, toToken])

  const changeToken = (newToken: Token, setter: (v: Token) => void, otherToken: Token, otherSetter: (v: Token) => void) => {
    setter(newToken)
    if(newToken.symbol === otherToken.symbol) {
      otherSetter(newToken.symbol === 'DOLA' ? TOKENS[DAI] : TOKENS[DOLA])
    }
  }

  const changeAmount = (newAmount: string, isFrom: boolean) => {
    const setter = isFrom ? setFromAmount : setToAmount
    setter(newAmount);

    const otherSetter = !isFrom ? setFromAmount : setToAmount
    const fromToExRate = exRates[fromToken.symbol + toToken.symbol];
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
      await getERC20Contract(token, library?.getSigner()).approve(DOLA3POOLCRV, constants.MaxUint256),
      options,
    )
  }

  const handleSubmit = async () => {
    if (!library?.getSigner()) { return }
    if (isApproved) {
      return crvSwap(library?.getSigner(), fromToken, toToken, parseFloat(fromAmount), parseFloat(toAmount), 1)
    } else {
      return approveToken(fromToken.address, { onSuccess: () => setIsApproved(true) })
    }
  }

  const commonAssetInputProps = { tokens: TOKENS, balances }

  return (
    <Container
      label="Swap"
      description="Swap between DOLA, INV, DAI, USDC and USDT"
      href="https://docs.inverse.finance/anchor-and-dola-overview#stabilizer"
    >
      <Stack w="full" direction="column" spacing="3">
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

        <Text textAlign="center" w="full" fontSize="12px" mt="2">
          {`Exchange Rate : 1 ${fromToken.symbol} = ${exRates[fromToken.symbol + toToken.symbol]?.toFixed(4)} ${toToken.symbol}`}
        </Text>
        <Text textAlign="center" w="full" fontSize="12px" mt="2">
          {`Max slippage set to 1%, min. to receive : ${toAmount === '' ? '0' : (parseFloat(toAmount) - (parseFloat(toAmount) * maxSlippage / 100)).toFixed(4)}`}
        </Text>

        <SubmitButton isDisabled={isDisabled} onClick={handleSubmit}>
          {
            isApproved ? 'Swap' : 'Approve'
          }
        </SubmitButton>
      </Stack>
    </Container>
  )
}
