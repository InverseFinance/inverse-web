import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { STAKING_ABI } from '@inverse/abis'
import { NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { BalanceInput } from '@inverse/components/Input'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { DOLA3CRV, THREECRV, TOKENS } from '@inverse/config'
import { DOLA } from '@inverse/config/mainnet'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, Contract } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'

enum StakeOptions {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  claim = 'Claim',
}

const Stake = () => {
  const [selectedOption, setSelectedOption] = useState<string>(StakeOptions.deposit)
  const { active, account, library } = useWeb3React<Web3Provider>()
  const { balances } = useAccountBalances()
  const [amount, setAmount] = useState<any>('')
  const { data } = useEtherSWR([
    [DOLA3CRV, 'balanceOf', account],
    [DOLA3CRV, 'earned', account],
  ])

  const parsedAmount = amount && !isNaN(amount) ? parseUnits(amount) : BigNumber.from(0)

  const label =
    selectedOption === StakeOptions.deposit
      ? 'DOLA-3CRV'
      : selectedOption === StakeOptions.withdraw
      ? 'DOLA-3CRV'
      : 'INV'

  const max = () => {
    if (!balances) {
      return 0
    }

    switch (selectedOption) {
      case StakeOptions.deposit:
        return balances[THREECRV] ? parseFloat(formatUnits(balances[THREECRV])) : 0
      case StakeOptions.withdraw:
        return data ? parseFloat(formatUnits(data[0])) : 0
      case StakeOptions.claim:
        return data ? parseFloat(formatUnits(data[1])) : 0
      default:
        return 0
    }
  }

  const handleSubmit = () => {
    switch (selectedOption) {
      case StakeOptions.deposit:
        new Contract(DOLA3CRV, STAKING_ABI, library?.getSigner()).stake(parsedAmount)
        break
      case StakeOptions.withdraw:
        new Contract(DOLA3CRV, STAKING_ABI, library?.getSigner()).withdraw(parsedAmount)
        break
      case StakeOptions.claim:
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
        <Flex justify="space-between">
          <NavButtons
            width={20}
            options={[StakeOptions.deposit, StakeOptions.withdraw, StakeOptions.claim]}
            active={selectedOption}
            onClick={setSelectedOption}
          />
        </Flex>
        {selectedOption === StakeOptions.claim ? (
          <Stack direction="row" h={90} justify="center" align="center">
            <Text fontWeight="medium" color="purple.100" fontSize="xl">
              Claimable:
            </Text>
            <Text fontWeight="semibold" fontSize="xl">{`${max().toFixed(2)} INV`}</Text>
          </Stack>
        ) : (
          <Flex h={90} direction="column" pt={2} pb={2}>
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
                    {`${max().toFixed(2)} ${label}`}
                  </Text>
                </Stack>
              )}
            </Flex>
            <BalanceInput
              value={amount}
              onChange={(e: any) => setAmount(e.currentTarget.value)}
              onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
              label={label}
            />
          </Flex>
        )}
        <SubmitButton
          isDisabled={!active || !amount || parsedAmount.isZero() || parseFloat(amount) > max()}
          onClick={handleSubmit}
        >
          {selectedOption}
        </SubmitButton>
      </Stack>
    </Container>
  )
}

export const StakingPage = () => (
  <Layout>
    <AppNav active="Stake" />
    <Flex justify="center" direction="column">
      <Flex w={{ base: 'full', xl: 'lg' }}>
        <Stake />
      </Flex>
    </Flex>
  </Layout>
)

export default StakingPage
