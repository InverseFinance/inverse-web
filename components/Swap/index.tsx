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
import { usePrices } from '@inverse/hooks/usePrices'
import { SubmitButton } from '@inverse/components/common/Button'
import { crvSwap, getERC20Contract } from '@inverse/util/contracts'
import { handleTx, HandleTxOptions } from '@inverse/util/transactions';
import { constants } from 'ethers'

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

  const getMaxBalance = () => {
    return getParsedBalance(balances, token.address, token.decimals);
  }

  const setAmountToMax = () => {
    onAmountChange((Math.floor(getMaxBalance() * 1e8) / 1e8).toString())
  }

  return (
    <BalanceInput
      value={amount}
      onChange={(e: React.MouseEvent<HTMLInputElement>) => onAmountChange(e.currentTarget.value)}
      onMaxClick={setAmountToMax}
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

export const SwapView = () => {
  const { active, library, chainId } = useWeb3React<Web3Provider>()
  const { TOKENS, DOLA, DAI, USDC, USDT, DOLA3POOLCRV } = getNetworkConfigConstants(chainId)
  const swapOptions = [DOLA, DAI, USDC, USDT];

  const [fromAmount, setFromAmount] = useState<string>('')
  const [toAmount, setToAmount] = useState<string>('')
  const [exRate, setExRate] = useState<number>(0)
  const [fromToken, setFromToken] = useState(TOKENS[DOLA])
  const [toToken, setToToken] = useState(TOKENS[DAI])
  const [isAnimStopped, setIsAnimStopped] = useState(true)

  const { balances } = useBalances(swapOptions)
  const { approvals } = useAllowances(swapOptions, DOLA3POOLCRV)
  const { prices } = usePrices()

  const [isApproved, setIsApproved] = useState(hasAllowance(approvals, fromToken.address));

  useEffect(() => {
    setIsApproved(hasAllowance(approvals, fromToken.address))
  }, [approvals])

  useEffect(() => {
    if (fromToken.symbol === toToken.symbol) {
      setToToken(fromToken.address === DOLA ? TOKENS[DAI] : TOKENS[DOLA])
    }
  }, [fromToken])

  useEffect(() => {
    if (toToken.symbol === toToken.symbol) {
      setFromToken(toToken.address === DOLA ? TOKENS[DAI] : TOKENS[DOLA])
    }
  }, [toToken])

  useEffect(() => {
    const fromPrice = prices ? prices[fromToken.coingeckoId!]?.usd||0 : 0;
    const toPrice = prices ? prices[toToken.coingeckoId!]?.usd||1 : 1;
    setExRate(fromPrice / toPrice);
  }, [prices, fromToken, toToken])

  useEffect(() => {
    const amount = parseFloat(fromAmount)||0
    setToAmount((amount * exRate).toFixed(4))
  }, [fromAmount, exRate])

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
    if(!library?.getSigner()) { return }
    if(isApproved) {
      return crvSwap(library?.getSigner(), fromToken, toToken, parseFloat(fromAmount), 1)
    } else {
      return approveToken(fromToken.address, { onSuccess : () => setIsApproved(true) })
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
          onAssetChange={(newToken) => setFromToken(newToken)}
          onAmountChange={(newAmount) => setFromAmount(newAmount)}
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
          onAssetChange={(newToken) => setToToken(newToken)}
          onAmountChange={(newAmount) => setToAmount(newAmount)}
          {...commonAssetInputProps}
        />

        <Text textAlign="center" w="full" fontSize="12px" mt="2">
          {`Exchange Rate : 1 ${fromToken.symbol} = ${exRate.toFixed(4)} ${toToken.symbol}`}
        </Text>
        
        <SubmitButton onClick={handleSubmit}>
          {
            isApproved ? 'Swap' : 'Approve'
          }
        </SubmitButton>
      </Stack>
    </Container>
  )
}
