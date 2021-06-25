import { ChevronRightIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { STABILIZER_ABI } from '@inverse/abis'
import { NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { BalanceInput } from '@inverse/components/Input'
import Link from '@inverse/components/Link'
import { DAI, DOLA, STABILIZER, TOKENS } from '@inverse/config'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import { useWeb3React } from '@web3-react/core'
import { Contract } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'

enum StabilizerOperations {
  buy = 'Buy',
  sell = 'Sell',
}

export const StabilizerView = () => {
  const [operation, setOperation] = useState<string>(StabilizerOperations.buy)
  const { active, library } = useWeb3React<Web3Provider>()
  const { balances } = useAccountBalances()
  const [amount, setAmount] = useState<any>('')

  const max = () =>
    !balances
      ? 0
      : operation === StabilizerOperations.buy
      ? parseFloat(formatUnits(balances[DAI]))
      : parseFloat(formatUnits(balances[DOLA]))

  const handleSubmit = () => {
    switch (operation) {
      case StabilizerOperations.buy:
        new Contract(STABILIZER, STABILIZER_ABI, library?.getSigner()).buy(parseUnits(amount))
        break
      case StabilizerOperations.sell:
        new Contract(STABILIZER, STABILIZER_ABI, library?.getSigner()).sell(parseUnits(amount))
        break
      default:
    }
  }

  const Header = () => (
    <Flex minH={14} w="full" justify="space-between" align="flex-end">
      <Flex direction="column" justify="flex-end">
        <Text fontSize="xl" fontWeight="bold">
          Stabilizer
        </Text>
        <Flex>
          <Link href="https://docs.inverse.finance/anchor-and-dola-overview#stabilizer" fontSize="sm" isExternal>
            Help DOLA maintain it's peg to USD <ExternalLinkIcon />
          </Link>
        </Flex>
      </Flex>
      <Stack direction={operation === StabilizerOperations.buy ? 'row-reverse' : 'row'} spacing={1} align="center">
        <Image w={8} h={8} src={TOKENS[DOLA].image} />
        <ChevronRightIcon boxSize={7} />
        <Image w={7} h={7} src={TOKENS[DAI].image} />
      </Stack>
    </Flex>
  )

  return (
    <Container label={<Header />}>
      <Stack w="full">
        <NavButtons
          width={16}
          options={[StabilizerOperations.buy, StabilizerOperations.sell]}
          active={operation}
          onClick={setOperation}
        />
        <Flex direction="column" pt={2} pb={2}>
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
                  {`${(operation === StabilizerOperations.buy
                    ? parseFloat(formatUnits(balances[DAI]))
                    : parseFloat(formatUnits(balances[DOLA]))
                  ).toFixed(2)} ${operation === StabilizerOperations.buy ? 'DAI' : 'DOLA'}`}
                </Text>
              </Stack>
            )}
          </Flex>
          <BalanceInput
            value={amount}
            onChange={(e: any) => setAmount(e.currentTarget.value)}
            onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
            label={operation === StabilizerOperations.buy ? 'DAI' : 'DOLA'}
          />
        </Flex>
        <SubmitButton
          isDisabled={!active || !amount || !balances || isNaN(amount) || parseFloat(amount) > max()}
          onClick={handleSubmit}
        >
          {`${operation} DOLA`}
        </SubmitButton>
      </Stack>
    </Container>
  )
}
