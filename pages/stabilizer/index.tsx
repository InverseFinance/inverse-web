import { ChevronRightIcon } from '@chakra-ui/icons'
import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { STABILIZER_ABI } from '@inverse/abis'
import { SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { Input } from '@inverse/components/Input'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { DAI, DOLA, STABILIZER, TOKENS } from '@inverse/config'
import { useAccountBalances, useStabilizerBalance } from '@inverse/hooks/useBalances'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, Contract } from 'ethers'
import { commify, formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'

const StabilizerOverviewField = ({ label, children }: any) => (
  <Flex justify="space-between">
    <Text fontSize="sm" fontWeight="semibold" color="purple.100">
      {label}
    </Text>
    <Flex fontWeight="semibold" fontSize="sm">
      {children}
    </Flex>
  </Flex>
)

const StabilizerDescription = () => {
  const { balance } = useStabilizerBalance()

  return (
    <Container noPadding>
      <Stack spacing={6}>
        <Stack>
          <Text fontWeight="semibold">What is the Stabilizer?</Text>
          <Text fontSize="sm">
            The Stabilizer was responsible for issuing the initial DOLA supply, which used to be backed 100% by DAI.
            After issuance, the Stabilizer can be used by market participants as a source of liquidity to arbitrage away
            price differentials if DOLA moves away from a 1:1 peg against USD.
          </Text>
        </Stack>
        <Stack>
          <StabilizerOverviewField label="Supply">{`$${commify((balance || 0).toFixed(2))}`}</StabilizerOverviewField>
          <StabilizerOverviewField label="Fee">0.4%</StabilizerOverviewField>
        </Stack>
      </Stack>
    </Container>
  )
}

const StabilizerBuySell = () => {
  const [selectedOption, setSelectedOption] = useState<string>('Buy')
  const { active, library } = useWeb3React<Web3Provider>()
  const { balances } = useAccountBalances()
  const [amount, setAmount] = useState<any>('')

  const parsedAmount = amount && !isNaN(amount) ? parseUnits(amount) : BigNumber.from(0)

  return (
    <Container
      label="Stabilizer"
      description="Help DOLA maintain it's peg to USD"
      href="https://docs.inverse.finance/anchor-and-dola-overview#stabilizer"
    >
      <Stack w="full">
        <Flex justify="space-between">
          <Flex w={40} bgColor="purple.900" p={1} borderRadius={8} cursor="pointer">
            {['Buy', 'Sell'].map((option: string) => (
              <Flex
                w="full"
                justify="center"
                pt={1}
                pb={1}
                borderRadius={8}
                fontWeight="medium"
                color="purple.100"
                onClick={() => setSelectedOption(option)}
                bgColor={option === selectedOption ? 'purple.700' : 'purple.900'}
              >
                {option}
              </Flex>
            ))}
          </Flex>
          <Stack direction={selectedOption === 'Buy' ? 'row' : 'row-reverse'} spacing={1} align="center" ml={2}>
            <Image w={6} h={6} src={TOKENS[DOLA].image} />
            <ChevronRightIcon boxSize={5} />
            <Image w={5} h={5} src={TOKENS[DAI].image} />
          </Stack>
        </Flex>
        <Flex direction="column" pt={4} pb={2}>
          <Flex justify="space-between">
            <Text fontSize="13px" fontWeight="semibold" color="purple.100">
              Amount
            </Text>
            {balances && (
              <Stack direction="row" align="flex-end" justify="flex-end" spacing={1}>
                <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                  Wallet:
                </Text>
                <Text fontSize="13px" fontWeight="semibold">
                  {`${parseFloat(formatUnits(balances[DOLA])).toFixed(2)} DOLA`}
                </Text>
              </Stack>
            )}
          </Flex>
          <Input placeholder="0" value={amount} onChange={(e: any) => setAmount(e.currentTarget.value)} />
        </Flex>
        <SubmitButton
          isDisabled={!active || !amount || parsedAmount.isZero()}
          onClick={() => new Contract(STABILIZER, STABILIZER_ABI, library?.getSigner()).buy(parsedAmount)}
        >
          {`${selectedOption} DOLA`}
        </SubmitButton>
      </Stack>
    </Container>
  )
}

export const Stabilizer = () => (
  <Layout>
    <AppNav active="Stabilizer" />
    <Flex justify="center" direction="column">
      <Flex w={{ base: 'full', xl: 'lg' }}>
        <StabilizerBuySell />
      </Flex>
      <Flex w={{ base: 'full', xl: 'lg' }}>
        <StabilizerDescription />
      </Flex>
    </Flex>
  </Layout>
)

export default Stabilizer
