import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons'
import {
  Flex,
  Image,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { ClaimButton, NavButtons, SubmitButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { BalanceInput } from '@inverse/components/Input'
import { TOKENS, VAULTS, VAULT_DAI_ETH, VAULT_TREE } from '@inverse/config'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import { useVaultRates, useVaultRewards } from '@inverse/hooks/useVaults'
import { Token } from '@inverse/types'
import { getVaultContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import moment from 'moment'
import { useState } from 'react'

enum VaultOperations {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  claim = 'Claim',
}

const AssetsDropdown = ({ children, asset, isOpen, onOpen, onClose, noPadding }: any) => {
  return (
    <Popover isOpen={isOpen} onClose={onClose} closeOnBlur={true}>
      <PopoverTrigger>
        <Stack
          direction="row"
          align="center"
          onClick={onOpen}
          borderRadius={8}
          p={noPadding ? 0 : 2}
          bgColor="purple.900"
          cursor="pointer"
        >
          <Flex w={5}>
            <Image w={5} h={5} src={asset.image} />
          </Flex>
          <Flex fontSize="lg" fontWeight="semibold" color="purple.100" align="center">
            {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
          </Flex>
        </Stack>
      </PopoverTrigger>
      <PopoverContent _focus={{ outline: 'none' }} borderWidth={0} bgColor="transparent">
        <PopoverBody
          p={2}
          mt={-1}
          bgColor="#211e36"
          borderColor="purple.700"
          borderWidth={2}
          borderRadius={8}
          boxShadow="rgba(0, 0, 0, 0.75) 0px 5px 15px"
          _focus={{ outline: 'none' }}
        >
          {children}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

const FromAssetDropdown = ({ isOpen, onClose, onOpen, asset, options, handleChange }: any) => {
  const { balances } = useAccountBalances()

  return (
    <AssetsDropdown isOpen={isOpen} onClose={onClose} onOpen={onOpen} asset={asset} noPadding>
      {options.map((from: string) => {
        const fromToken = TOKENS[from]
        const toToken = TOKENS[Object.keys(VAULT_TREE[from])[0]]

        return (
          <Flex
            p={2}
            justify="space-between"
            borderRadius={8}
            _hover={{ bgColor: 'purple.900' }}
            onClick={() => handleChange(from, toToken.address || 'ETH')}
            cursor="pointer"
          >
            <Stack direction="row" align="center">
              <Flex w={5}>
                <Image w={5} h={5} src={fromToken.image} />
              </Flex>
              <Flex fontWeight="semibold" align="center" color="purple.100">
                {fromToken.symbol}
              </Flex>
            </Stack>
            <Text fontWeight="semibold" color="purple.100">
              {balances ? parseFloat(formatUnits(balances[asset.address])).toFixed(2) : '0.00'}
            </Text>
          </Flex>
        )
      })}
    </AssetsDropdown>
  )
}

const ToAssetDropdown = ({ isOpen, onClose, onOpen, asset, options, handleChange }: any) => {
  const { rates } = useVaultRates()

  return (
    <AssetsDropdown isOpen={isOpen} onClose={onClose} onOpen={onOpen} asset={asset}>
      {options.map(([to, vault]: [string, string]) => {
        const toToken = TOKENS[to]

        return (
          <Flex
            p={2}
            justify="space-between"
            borderRadius={8}
            _hover={{ bgColor: 'purple.900' }}
            onClick={() => handleChange(to)}
            cursor="pointer"
          >
            <Stack direction="row" align="center">
              <Flex w={5}>
                <Image w={5} h={5} src={toToken.image} />
              </Flex>
              <Flex fontWeight="semibold" align="center" color="purple.100">
                {toToken.symbol}
              </Flex>
            </Stack>
            <Text fontWeight="semibold" color="purple.100">
              {`${(rates ? rates[vault] : 0).toFixed(2)}% APY`}
            </Text>
          </Flex>
        )
      })}
    </AssetsDropdown>
  )
}

export const VaultsClaim = () => {
  const { library } = useWeb3React<Web3Provider>()
  const { lastDistribution } = useVaultRates()
  const { rewards } = useVaultRewards()

  const timeSince = () => {
    if (!lastDistribution) {
      return ''
    }

    const minutes = Math.abs(moment().diff(moment(lastDistribution), 'minutes'))
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    }
    if (minutes < 60 * 24) {
      const hours = Math.floor(minutes / 60)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    }

    if (minutes < 60 * 24 * 7) {
      const days = Math.floor(minutes / 60 / 24)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }

    return moment(lastDistribution).format('MMM D, YYYY')
  }

  return (
    <Stack>
      <Stack direction="row" justify="center" spacing={1}>
        <Text fontSize="xs" color="purple.200" fontWeight="semibold">
          Last Distribution
        </Text>
        <Text fontSize="xs" fontWeight="semibold">
          {timeSince()}
        </Text>
      </Stack>
      {Object.entries(VAULTS).map(([address, vault]: [string, { from: Token; to: Token }]) => (
        <Stack direction="row" align="center" justify="space-between" p={2}>
          <Stack direction="row" align="center">
            <Stack direction="row" align="center" w={20} justify="flex-end">
              <Flex w={5}>
                <Image w={5} h={5} src={vault.from.image} />
              </Flex>
              <Text fontWeight="semibold" color="purple.100">
                {vault.from.symbol}
              </Text>
            </Stack>
            <ChevronRightIcon boxSize={6} />
            <Stack direction="row" align="center" w={20}>
              <Flex w={5}>
                <Image w={5} h={5} src={vault.to.image} />
              </Flex>
              <Text fontWeight="semibold" color="purple.100">
                {vault.to.symbol}
              </Text>
            </Stack>
          </Stack>
          <Stack direction="row" align="center" spacing={4}>
            <Flex fontSize="lg" fontWeight="semibold">{`${(rewards && rewards[address]
              ? parseFloat(formatUnits(rewards[address]))
              : 0
            ).toFixed(2)} ${vault.to.symbol}`}</Flex>
            <ClaimButton
              onClick={() =>
                vault.to.address
                  ? getVaultContract(address, library?.getSigner()).claim()
                  : getVaultContract(address, library?.getSigner()).claimETH()
              }
            >
              Claim
            </ClaimButton>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

export const VaultsView = () => {
  const { active, library } = useWeb3React<Web3Provider>()
  const [operation, setOperation] = useState<string>(VaultOperations.deposit)
  const [amount, setAmount] = useState<string>('')
  const [vault, setVault] = useState(VAULT_DAI_ETH)
  const { isOpen: fromIsOpen, onOpen: fromOnOpen, onClose: fromOnClose } = useDisclosure()
  const { isOpen: toIsOpen, onOpen: toOnOpen, onClose: toOnClose } = useDisclosure()
  const { balances } = useAccountBalances()
  const { rates } = useVaultRates()

  const max = () => {
    const token = operation === VaultOperations.deposit ? VAULTS[vault].from.address : vault

    if (!balances || !balances[token]) {
      return 0
    }

    return parseFloat(formatUnits(balances[token]))
  }

  const handleSubmit = () => {
    const contract = getVaultContract(vault, library?.getSigner())
    switch (operation) {
      case VaultOperations.deposit:
        contract.deposit(parseUnits(amount))
        break
      case VaultOperations.withdraw:
        contract.withdraw(parseUnits(amount))
        break
      default:
    }
  }

  return (
    <Container label="Vaults" description="Earn X on your Y" href="https://docs.inverse.finance/vaults">
      <Stack w="full" spacing={4}>
        <NavButtons
          options={[VaultOperations.deposit, VaultOperations.withdraw, VaultOperations.claim]}
          active={operation}
          onClick={setOperation}
        />
        {operation === VaultOperations.claim ? (
          <VaultsClaim />
        ) : (
          <Stack spacing={6}>
            <Stack spacing={1}>
              {balances && (
                <Stack direction="row" align="flex-end" justify="flex-end" spacing={1}>
                  <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                    Available:
                  </Text>
                  <Text fontSize="13px" fontWeight="semibold">
                    {`${max().toFixed(2)} ${VAULTS[vault].from.symbol}`}
                  </Text>
                </Stack>
              )}
              <BalanceInput
                value={amount}
                onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
                onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
                label={
                  <Stack direction="row" align="center" p={2} spacing={4} cursor="pointer">
                    <Flex w={0.5} h={8}>
                      <Flex w="full" h="full" bgColor="purple.500" borderRadius={8} />
                    </Flex>
                    <FromAssetDropdown
                      isOpen={fromIsOpen}
                      onClose={fromOnClose}
                      onOpen={() => {
                        fromOnOpen()
                        toOnClose()
                      }}
                      asset={VAULTS[vault].from}
                      options={Object.keys(VAULT_TREE)}
                      handleChange={(from: string, to: string) => {
                        setVault(VAULT_TREE[from][to])
                        fromOnClose()
                      }}
                    />
                  </Stack>
                }
              />
            </Stack>
            {operation === VaultOperations.deposit && (
              <Stack direction="row" align="center" fontSize="lg" fontWeight="medium" justify="flex-end">
                <Text color="purple.100">Earn</Text>
                <Text fontWeight="semibold">{`${(rates ? rates[vault] : 0).toFixed(2)}% APY`}</Text>
                <Text color="purple.100">with</Text>
                <ToAssetDropdown
                  isOpen={toIsOpen}
                  onClose={toOnClose}
                  onOpen={() => {
                    toOnOpen()
                    fromOnClose()
                  }}
                  asset={VAULTS[vault].to}
                  options={Object.entries(VAULT_TREE[VAULTS[vault].from.address])}
                  handleChange={(to: string) => {
                    setVault(VAULT_TREE[VAULTS[vault].from.address][to])
                    toOnClose()
                  }}
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
        )}
      </Stack>
    </Container>
  )
}
