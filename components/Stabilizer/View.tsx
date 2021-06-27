import { ChevronRightIcon } from '@chakra-ui/icons'
import { Image, Stack, Text } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { BalanceInput } from '@inverse/components/Input'
import { DAI, DOLA, TOKENS } from '@inverse/config'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import { getStabilizerContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
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
  const [amount, setAmount] = useState<string>('')

  const max = () =>
    !balances
      ? 0
      : operation === StabilizerOperations.buy
      ? parseFloat(formatUnits(balances[DAI]))
      : parseFloat(formatUnits(balances[DOLA]))

  const handleSubmit = () => {
    const contract = getStabilizerContract(library?.getSigner())
    switch (operation) {
      case StabilizerOperations.buy:
        contract.buy(parseUnits(amount))
        break
      case StabilizerOperations.sell:
        contract.sell(parseUnits(amount))
        break
      default:
    }
  }

  return (
    <Container
      label="Stabilizer"
      description="Swap Between DOLA & DAI"
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
                ).toFixed(2)} ${operation === StabilizerOperations.buy ? 'DAI' : 'DOLA'}`}
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
          isDisabled={!active || !amount || !balances || isNaN(amount as any) || parseFloat(amount) > max()}
          onClick={handleSubmit}
        >
          {`${operation} DOLA`}
        </SubmitButton>
      </Stack>
    </Container>
  )
}
