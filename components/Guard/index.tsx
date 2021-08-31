import { Box, Stack, Select, FormLabel, Flex, Spacer, Alert, AlertDescription, AlertIcon, AlertTitle} from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { ConnectButton, NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { DOLA, GUARD, PREMIUM_MODEL } from '@inverse/config'
import { useGuardApprovals } from '@inverse/hooks/useApprovals'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { useGuardPlans } from '@inverse/hooks/useGuard'
import { useStakingRates } from '@inverse/hooks/useStakingRates'
import { getERC20Contract, getGuardContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { constants } from 'ethers'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { BalanceInput } from '@inverse/components/Input'
import { SECONDS_PER_DAY } from '@inverse/config'
import { injectedConnector } from '@inverse/util/web3'

enum GuardOperations {
    buy = 'Buy',
    claim = 'Claim'
}

const ErrorAlert = ({message}: any) => (
  <Alert borderRadius={8} flexDirection="column" color="purple.600" bgColor="purple.200" p={3}>
    <Flex w="full" align="center">
      <AlertIcon color="purple.600" />
      <AlertTitle ml={-1} fontSize="sm">
        {message}
      </AlertTitle>
    </Flex>
  </Alert>
)

export const GuardView = () => {
  const [operation, setOperation] = useState<string>(GuardOperations.buy)
  const { active, activate, library } = useWeb3React<Web3Provider>()
  const { balances } = useAccountBalances()
  const [protocol, setProtocol] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [duration, setDuration] = useState<string>('')
  const { approvals } = useGuardApprovals()
  const { plans } = useGuardPlans();
  const { data } = useEtherSWR([
    PREMIUM_MODEL,
    'getPremium',
    protocol,
    isNaN(amount as any) || !amount? "0": parseUnits(amount).toString(),
    Number(duration) * SECONDS_PER_DAY,
    constants.AddressZero
  ])
  const quote = data? formatUnits(data): undefined
  let error;
  if(plans && protocol && amount && duration && !isNaN(amount as any)) {
    const selectedPlan = plans[Number(protocol)]
    const availableAmount = selectedPlan.ceiling - selectedPlan.usage
    if(availableAmount < Number(amount)) error = `You've exceeded the global coverage cap for ${selectedPlan.title}`;
    if(Number(amount) < selectedPlan.minCovered) error = `The minimum coverage amount for ${selectedPlan.title} is $${selectedPlan.minCovered}`
    if(Number(duration) * SECONDS_PER_DAY < selectedPlan.minDuration) error = `The minimum coverage duration for ${selectedPlan.title} is ${Math.ceil(selectedPlan.minDuration / SECONDS_PER_DAY).toFixed()} days`
    if(Number(duration) * SECONDS_PER_DAY > selectedPlan.maxDuration) error = `The maximum coverage duration for ${selectedPlan.title} is ${Math.floor(selectedPlan.maxDuration / SECONDS_PER_DAY).toFixed()} days`
  }

  const balance = balances
  ? parseFloat(
      formatUnits(balances[DOLA])
    )
  : 0
  let insufficientBalance;
  if(quote && balance && balance < Number(quote)) {
    insufficientBalance = true;
  }

    const handleSubmit = () => {
      const contract = getGuardContract(library?.getSigner())
      contract.openPosition(protocol, parseUnits(amount), Number(duration) * SECONDS_PER_DAY);
    }

    const max = () => {
        return balances && balances[DOLA] ? parseFloat(formatUnits(balances[DOLA])) : 0
    }

    const setMaxAmount = () => {
      const selectedPlan = plans[Number(protocol)]
      const availableAmount = selectedPlan.ceiling - selectedPlan.usage
      setAmount(String(availableAmount));
    }

    const setMaxDuration = () => {
      const selectedPlan = plans[Number(protocol)]
      setDuration(Math.floor(selectedPlan.maxDuration / SECONDS_PER_DAY).toFixed())
    }

    const BuyButton = () => (
        <Box>
        {(!approvals || !approvals[DOLA] || !parseFloat(formatUnits(approvals[DOLA]))) &&
            (
              <SubmitButton
                isDisabled={!active}
                onClick={() =>
                  getERC20Contract(DOLA, library?.getSigner()).approve(GUARD, constants.MaxUint256)
                }
              >
                Approve DOLA
              </SubmitButton>
            )}
            {(approvals && approvals[DOLA] && (parseFloat(formatUnits(approvals[DOLA]))) > 0) &&
            (
              <SubmitButton
                isDisabled={
                  !active ||
                  (operation !== GuardOperations.buy && (!amount || isNaN(amount as any) || parseFloat(amount) > max()))
                }
                onClick={handleSubmit}
              >
                Buy
              </SubmitButton>
            )}
        </Box>
    )


    const ConnectButton = () => (
      <Box>
            <SubmitButton
              onClick={() => activate(injectedConnector)}
            >
              Connect wallet for a quote
            </SubmitButton>
      </Box>
  )

  return (
    <Container
      label="Guard"
      description="Protect yourself with smart contract cover"
    >
      <Stack w="full">
        <NavButtons
          options={[GuardOperations.buy, GuardOperations.claim]}
          active={operation}
          onClick={setOperation}
        />
        {operation == GuardOperations.buy && (
          <Stack spacing={3} pt={2} pb={2}>
            <FormLabel>Cover Plan</FormLabel>
            <Select value={protocol} onChange={(v) => setProtocol(v.currentTarget.value)} size="lg" placeholder="Select a protocol">
              {plans?.map((plan, i) => 
                <option key={i} value={i}>{plan.title}</option>
              )}
            </Select>
            {protocol &&
              <Stack>
                <FormLabel>Covered Amount</FormLabel>
                <BalanceInput
                label="USD"
                value={amount}
                onMaxClick={() => setMaxAmount()}
                onChange={(v) => setAmount(v.currentTarget.value)}/>
                <FormLabel>Duration</FormLabel>
                <BalanceInput
                label="DAYS"
                value={duration}
                onMaxClick={() => setMaxDuration()}
                onChange={(v) => setDuration(v.currentTarget.value)}/>
                <Spacer />
                {error &&
                  <ErrorAlert message={error}/>
                }
                {quote && !error && parseFloat(quote) > 0 &&
                <Flex>
                  <Box p="2" >
                    Quote
                  </Box>
                  <Spacer />
                  <Box fontWeight="extrabold" p="2">
                    ${parseFloat(quote).toFixed(3)} DOLA
                  </Box>
                </Flex>
                }
                {insufficientBalance &&
                  <ErrorAlert message="Insufficient Balance"/>
                }
                {active && quote && !error && !insufficientBalance &&
                <BuyButton/>
                }
                {!active && protocol && amount && !isNaN(amount as any) && duration && !isNaN(duration as any) && !error && !insufficientBalance &&
                <ConnectButton/>
                }
              </Stack>
            }
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
