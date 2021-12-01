import { ChevronRightIcon } from '@chakra-ui/icons'
import { Image, Stack, Text } from '@chakra-ui/react'
import { TransactionResponse, Web3Provider } from '@ethersproject/providers'
import { NavButtons, SubmitButton } from '@inverse/components/common/Button'
import Container from '@inverse/components/common/Container'
import { BalanceInput } from '@inverse/components/common/Input'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { useStabilizerApprovals } from '@inverse/hooks/useApprovals'
import { useAccountBalances, useStabilizerBalance } from '@inverse/hooks/useBalances'
import { getERC20Contract, getStabilizerContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { constants } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState, useEffect } from 'react'
import { InfoMessage } from '@inverse/components/common/Messages'
import { handleTx, HandleTxOptions } from '@inverse/util/transactions';
import { hasAllowance } from '@inverse/util/web3'

const FEE = 0.004

enum StabilizerOperations {
  buy = 'Buy',
  sell = 'Sell',
}

export const StabilizerView = () => {
  const [operation, setOperation] = useState<string>(StabilizerOperations.buy)
  const { active, library, chainId } = useWeb3React<Web3Provider>()
  const { balances } = useAccountBalances()
  const [amount, setAmount] = useState<string>('')
  const { approvals } = useStabilizerApprovals()
  const { balance: stabilizerBalance } = useStabilizerBalance()
  const { DAI, DOLA, STABILIZER, TOKENS } = getNetworkConfigConstants(chainId)
  const [isDAIApproved, setIsDAIApproved] = useState(hasAllowance(approvals, DAI))
  const [isDOLAApproved, setIsDOLAApproved] = useState(hasAllowance(approvals, DOLA))

  useEffect(() => {
    setIsDAIApproved(hasAllowance(approvals, DAI))
    setIsDOLAApproved(hasAllowance(approvals, DOLA))
  }, [approvals, DAI, DOLA])

  const max = () =>
    !balances
      ? 0
      : operation === StabilizerOperations.buy
        ? parseFloat(formatUnits(balances[DAI])) * (1 - FEE)
        : Math.min(parseFloat(formatUnits(balances[DOLA])), stabilizerBalance)

  const approveToken = async (token: string, options: HandleTxOptions) => {
    return handleTx(
      await getERC20Contract(token, library?.getSigner()).approve(STABILIZER, constants.MaxUint256),
      options,
    )
  }

  // returning the transaction promise allows SubmitButton to automatically handle tx status and notifications
  const handleSubmit = (): Promise<TransactionResponse | void> => {
    const contract = getStabilizerContract(library?.getSigner())
    switch (operation) {
      case StabilizerOperations.buy:
        if (!isDAIApproved) {
          return approveToken(DAI, { onSuccess: () => setIsDAIApproved(true) });
        } else {
          return contract.buy(parseUnits(amount))
        }
        break
      case StabilizerOperations.sell:
        if (!isDOLAApproved) {
          return approveToken(DOLA, { onSuccess: () => setIsDOLAApproved(true) });
        } else {
          return contract.sell(parseUnits(amount))
        }
        break
      default:
        return new Promise((resolve, reject) => reject());
    }
  }

  const buttonText =
    operation === StabilizerOperations.buy
      ? !approvals || !approvals[DAI] || !parseFloat(formatUnits(approvals[DAI]))
        ? 'Approve'
        : 'Buy DOLA'
      : !approvals || !approvals[DOLA] || !parseFloat(formatUnits(approvals[DOLA]))
        ? 'Approve'
        : 'Sell DOLA'

  const notEnoughLiquidity = parseFloat(amount) > max();

  return (
    <Container
      label="Stabilizer"
      description="Swap between DOLA & DAI"
      href="https://docs.inverse.finance/anchor-and-dola-overview#stabilizer"
      right={
        <Stack
          w={32}
          direction={operation === StabilizerOperations.buy ? 'row-reverse' : 'row'}
          spacing={1}
          justify={operation === StabilizerOperations.buy ? '' : 'flex-end'}
          align="center"
        >
          <Image w={8} h={8} src={TOKENS[DOLA].image} />
          <ChevronRightIcon boxSize={7} />
          <Image w={7} h={7} src={TOKENS[DAI].image} />
        </Stack>
      }
    >
      <Stack w="full">
        <NavButtons
          options={[StabilizerOperations.buy, StabilizerOperations.sell]}
          active={operation}
          onClick={setOperation}
        />
        <Stack spacing={1} pt={2} pb={2}>
          {balances && (
            <Stack direction="row" align="flex-end" justify="flex-end" spacing={1}>
              <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                Wallet:
              </Text>
              <Text fontSize="13px" fontWeight="semibold">
                {`${(operation === StabilizerOperations.buy
                  ? parseFloat(formatUnits(balances[DAI]))
                  : parseFloat(formatUnits(balances[DOLA]))
                ).toFixed(8)} ${operation === StabilizerOperations.buy ? 'DAI' : 'DOLA'}`}
              </Text>
            </Stack>
          )}
          <BalanceInput
            value={amount}
            onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
            onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
          />
        </Stack>
        <SubmitButton
          isDisabled={!active || !amount || !balances || isNaN(amount as any) || notEnoughLiquidity}
          onClick={handleSubmit}
        >
          {buttonText}
        </SubmitButton>
        {
          notEnoughLiquidity ?
            <InfoMessage alertProps={{ w: 'full' }}
              description={
                operation === StabilizerOperations.buy ?
                  'Not enough tokens' :
                  'There is not enough DAI liquidity in the Stabilizer right now for this swap'
              } />
            : null
        }
      </Stack>
    </Container>
  )
}
