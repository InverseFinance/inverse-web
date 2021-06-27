import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { BalanceInput } from '@inverse/components/Input'
import { DOLA, DOLA3CRV, INV, THREECRV, TOKENS } from '@inverse/config'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { usePrices } from '@inverse/hooks/usePrices'
import { useStakingRates } from '@inverse/hooks/useStakingRates'
import { getStakingContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'

enum StakeOperations {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  claim = 'Claim',
}

export const StakeView = () => {
  const [operation, setOperation] = useState<string>(StakeOperations.deposit)
  const { active, account, library } = useWeb3React<Web3Provider>()
  const { balances } = useAccountBalances()
  const { rates } = useStakingRates()
  const { prices } = usePrices()
  const [amount, setAmount] = useState<string>('')
  const { data } = useEtherSWR([
    [DOLA3CRV, 'balanceOf', account],
    [DOLA3CRV, 'earned', account],
  ])

  const max = () => {
    if (operation === StakeOperations.deposit) {
      return balances && balances[THREECRV] ? parseFloat(formatUnits(balances[THREECRV])) : 0
    }

    return data ? parseFloat(formatUnits(operation === StakeOperations.deposit ? data[0] : data[1])) : 0
  }

  const handleSubmit = () => {
    const contract = getStakingContract(DOLA3CRV, library?.getSigner())
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
      right={
        <Stack w={32} justify="flex-end" direction="row">
          <Image w={6} h={6} src={TOKENS[DOLA].image} />
          <Image w={5} h={5} src={TOKENS[THREECRV].image} />
        </Stack>
      }
    >
      <Stack w="full">
        <NavButtons
          options={[StakeOperations.deposit, StakeOperations.withdraw, StakeOperations.claim]}
          active={operation}
          onClick={setOperation}
        />
        {operation === StakeOperations.claim ? (
          <Stack direction="row" justify="center" align="center" p={6}>
            <Text fontWeight="medium" color="purple.100" fontSize="xl">
              Claimable:
            </Text>
            <Text fontWeight="semibold" fontSize="xl">{`${max().toFixed(2)} INV`}</Text>
          </Stack>
        ) : (
          <Stack spacing={1} pt={2} pb={2}>
            <Flex justify="space-between">
              {rates && prices && (
                <Stack direction="row" align="flex-end" spacing={1}>
                  <Text fontSize="13px" fontWeight="semibold">
                    {`${(rates[DOLA3CRV] * prices[TOKENS[INV].coingeckoId].usd).toFixed(2)}%`}
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
                    {`${max().toFixed(2)} DOLA-3CRV`}
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
        <SubmitButton
          isDisabled={!active || !amount || isNaN(amount as any) || parseFloat(amount) > max()}
          onClick={handleSubmit}
        >
          {operation}
        </SubmitButton>
      </Stack>
    </Container>
  )
}
