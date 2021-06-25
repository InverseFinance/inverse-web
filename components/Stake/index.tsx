import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { STAKING_ABI } from '@inverse/abis'
import { NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { BalanceInput } from '@inverse/components/Input'
import { DOLA3CRV, THREECRV, TOKENS } from '@inverse/config'
import { DOLA } from '@inverse/config/mainnet'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, Contract } from 'ethers'
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
  const [amount, setAmount] = useState<any>('')
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
    switch (operation) {
      case StakeOperations.deposit:
        new Contract(DOLA3CRV, STAKING_ABI, library?.getSigner()).stake(parseUnits(amount))
        break
      case StakeOperations.withdraw:
        new Contract(DOLA3CRV, STAKING_ABI, library?.getSigner()).withdraw(parseUnits(amount))
        break
      case StakeOperations.claim:
        new Contract(DOLA3CRV, STAKING_ABI, library?.getSigner()).getReward()
        break
      default:
    }
  }

  return (
    <Container
      label={
        <Stack direction="row" align="center">
          <Text fontSize="xl" fontWeight="bold">
            DOLA-3CRV
          </Text>
          <Image w={6} h={6} src={TOKENS[DOLA].image} />
          <Image w={5} h={5} src={TOKENS[THREECRV].image} />
        </Stack>
      }
      description="Stake your DOLA-3CRV Curve LP tokens to earn INV"
    >
      <Stack w="full">
        <NavButtons
          options={[StakeOperations.deposit, StakeOperations.withdraw, StakeOperations.claim]}
          active={operation}
          onClick={setOperation}
        />
        {operation === StakeOperations.claim ? (
          <Stack direction="row" justify="center" align="center">
            <Text fontWeight="medium" color="purple.100" fontSize="xl">
              Claimable:
            </Text>
            <Text fontWeight="semibold" fontSize="xl">{`${max().toFixed(2)} INV`}</Text>
          </Stack>
        ) : (
          <Flex direction="column" pt={2} pb={2}>
            <Flex justify="space-between">
              <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                Amount
              </Text>
              {balances && (
                <Stack direction="row" align="flex-end" justify="flex-end" spacing={1}>
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
              onChange={(e: any) => setAmount(e.currentTarget.value)}
              onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
              label="DOLA-3CRV"
            />
          </Flex>
        )}
        <SubmitButton
          isDisabled={!active || !amount || isNaN(amount) || parseFloat(amount) > max()}
          onClick={handleSubmit}
        >
          {operation}
        </SubmitButton>
      </Stack>
    </Container>
  )
}
