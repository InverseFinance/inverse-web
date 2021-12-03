import { Text, Stack, Flex, useDisclosure, SimpleGrid } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import Container from '@inverse/components/common/Container'
import { BalanceInput } from '@inverse/components/common/Input'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { useApprovals } from '@inverse/hooks/useApprovals'
import { useBalances } from '@inverse/hooks/useBalances'
import { useWeb3React } from '@web3-react/core'
import { useState, useEffect } from 'react'
import { hasAllowance } from '@inverse/util/web3'
import { FromAssetDropdown } from '../common/Assets/FromAssetDropdown'
import { getParsedBalance } from '@inverse/util/markets'
import { BigNumberList, Token, TokenList } from '@inverse/types';
import { InverseAnimIcon } from '@inverse/components/common/Animation'

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
  const { TOKENS, DOLA, DAI, USDC, USDT } = getNetworkConfigConstants(chainId)
  const swapOptions = [DOLA, DAI, USDC, USDT];

  const [fromAmount, setFromAmount] = useState<string>('')
  const [toAmount, setToAmount] = useState<string>('')
  const [fromToken, setFromToken] = useState(TOKENS[DOLA])
  const [toToken, setToToken] = useState(TOKENS[DAI])
  const [isAnimStopped, setIsAnimStopped] = useState(true)

  const { balances } = useBalances(swapOptions)
  const { approvals } = useApprovals()

  const [isApproved, setIsApproved] = useState(hasAllowance(approvals, fromToken.address));

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

  const handleInverse = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
    setIsAnimStopped(false)
    setTimeout(() => setIsAnimStopped(true), 1000)
  }

  const commonAssetInputProps = { tokens: TOKENS, balances }

  return (
    <Container
      label="Swap"
      description="Swap between DOLA, INV, DAI, USDC and USDT"
      href="https://docs.inverse.finance/anchor-and-dola-overview#stabilizer"
    >
      <Stack w="full" direction="column" spacing="2">
        <AssetInput
          amount={fromAmount}
          token={fromToken}
          assetOptions={swapOptions}
          onAssetChange={(newToken) => setFromToken(newToken)}
          onAmountChange={(newAmount) => setFromAmount(newAmount)}
          {...commonAssetInputProps}
        />

        <SimpleGrid columns={3} w="full" alignItems="center">
          <Text align="left">From {fromToken.symbol}</Text>
          <InverseAnimIcon height={50} width={50} autoplay={!isAnimStopped} loop={false}
            boxProps={{ onClick: handleInverse, w: "full", textAlign: "center" }} />
          <Text align="right">To {toToken.symbol}</Text>
        </SimpleGrid>

        <AssetInput
          amount={toAmount}
          token={toToken}
          assetOptions={swapOptions}
          onAssetChange={(newToken) => setToToken(newToken)}
          onAmountChange={(newAmount) => setToAmount(newAmount)}
          {...commonAssetInputProps}
        />
      </Stack>
    </Container>
  )
}
