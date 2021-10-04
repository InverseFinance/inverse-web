import { Flex, Image, Stack, Text, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { BalanceInput } from '@inverse/components/Input'
import { DOLA, DOLA3CRV, INV, STAKING_DOLA3CRV, TOKENS } from '@inverse/config'
import { useStakingApprovals } from '@inverse/hooks/useApprovals'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { usePrices } from '@inverse/hooks/usePrices'
import { useStakingRates } from '@inverse/hooks/useStakingRates'
import { getERC20Contract, getStakingContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { constants } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'

const DEPOSITS_DISABLED = true;

enum StakeOperations {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  claim = 'Claim',
}

const DepositsDisabledAlert = () => (
  <Alert borderRadius={8} flexDirection="column" color="purple.600" bgColor="purple.200" p={3}>
    <Flex w="full" align="center">
      <AlertIcon color="purple.600" />
      <AlertTitle ml={-1} fontSize="sm">
        Staking deposits are disabled
      </AlertTitle>
    </Flex>
    <AlertDescription fontWeight="medium" fontSize="sm">
      The staking program has been discontinued. Please visit the <a href="/anchor">Anchor page</a> for alternative reward opportunities.
    </AlertDescription>
  </Alert>
)

export const StakeView = () => {
  const [operation, setOperation] = useState<string>(DEPOSITS_DISABLED? StakeOperations.withdraw: StakeOperations.deposit)
  const { active, account, library } = useWeb3React<Web3Provider>()
  const { balances } = useAccountBalances()
  const { rates } = useStakingRates()
  const { prices } = usePrices()
  const [amount, setAmount] = useState<string>('')
  const { approvals } = useStakingApprovals()
  const { data } = useEtherSWR([
    [STAKING_DOLA3CRV, 'balanceOf', account],
    [STAKING_DOLA3CRV, 'earned', account],
  ])

  const max = () => {
    if (operation === StakeOperations.deposit) {
      return balances && balances[DOLA3CRV] ? parseFloat(formatUnits(balances[DOLA3CRV])) : 0
    }

    return data ? parseFloat(formatUnits(operation === StakeOperations.withdraw ? data[0] : data[1])) : 0
  }

  const handleSubmit = () => {
    const contract = getStakingContract(STAKING_DOLA3CRV, library?.getSigner())
    switch (operation) {
      case StakeOperations.deposit:
        contract.stake(parseUnits(amount))
        break
      case StakeOperations.withdraw:
        contract.withdraw(parseUnits(amount))
        break
      case StakeOperations.claim:
        contract.getReward()
        break
      default:
    }
  }

  return (
    <Container
      label="DOLA-3CRV"
      description="Stake DOLA-3CRV LP tokens to earn INV"
      href="https://crv.to/pool"
      right={
        <Stack w={32} justify="flex-end" direction="row">
          <Image w={6} h={6} src={TOKENS[DOLA].image} />
          <Image w={5} h={5} src={TOKENS[DOLA3CRV].image} />
        </Stack>
      }
    >
      <Stack w="full">
        ({DEPOSITS_DISABLED &&
          <DepositsDisabledAlert/>
        })
        <NavButtons
          options={DEPOSITS_DISABLED? [StakeOperations.withdraw, StakeOperations.claim]: [StakeOperations.deposit, StakeOperations.withdraw, StakeOperations.claim]}
          active={operation}
          onClick={setOperation}
        />
        {operation === StakeOperations.claim ? (
          <Stack direction="row" justify="center" align="center" p={6}>
            <Text fontWeight="medium" color="purple.100" fontSize="xl">
              Claimable:
            </Text>
            <Text fontWeight="semibold" fontSize="xl">{`${max().toFixed(4)} INV`}</Text>
          </Stack>
        ) : (
          <Stack spacing={1} pt={2} pb={2}>
            <Flex justify="space-between" direction={{ base: 'column', sm: 'row' }}>
              {!DEPOSITS_DISABLED && rates && prices && prices[TOKENS[INV].coingeckoId] && (
                <Stack direction="row" align="flex-end" spacing={1}>
                  <Text fontSize="13px" fontWeight="semibold">
                    {`${(rates[STAKING_DOLA3CRV] * prices[TOKENS[INV].coingeckoId].usd).toFixed(2)}%`}
                  </Text>
                  <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                    APY
                  </Text>
                </Stack>
              )}
              {balances && (
                <Stack direction="row" align="flex-end" spacing={1}>
                  <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                    Available:
                  </Text>
                  <Text fontSize="13px" fontWeight="semibold">
                    {`${max().toFixed(8)} DOLA-3CRV`}
                  </Text>
                </Stack>
              )}
            </Flex>
            <BalanceInput
              value={amount}
              onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
              onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
              label="DOLA-3CRV"
            />
          </Stack>
        )}
        {operation === StakeOperations.deposit &&
        (!approvals || !approvals[DOLA3CRV] || !parseFloat(formatUnits(approvals[DOLA3CRV]))) ? (
          <SubmitButton
            isDisabled={!active}
            onClick={() =>
              getERC20Contract(DOLA3CRV, library?.getSigner()).approve(STAKING_DOLA3CRV, constants.MaxUint256)
            }
          >
            Approve
          </SubmitButton>
        ) : (
          <SubmitButton
            isDisabled={
              !active ||
              (operation !== StakeOperations.claim && (!amount || isNaN(amount as any) || parseFloat(amount) > max()))
            }
            onClick={handleSubmit}
          >
            {operation}
          </SubmitButton>
        )}
      </Stack>
    </Container>
  )
}
