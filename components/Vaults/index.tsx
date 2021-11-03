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
import { ClaimButton, NavButtons, SubmitButton } from '@inverse/components/common/Button'
import Container from '@inverse/components/common/Container'
import { BalanceInput } from '@inverse/components/common/Input'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { useVaultApprovals } from '@inverse/hooks/useApprovals'
import { useAccountBalances, useVaultBalances } from '@inverse/hooks/useBalances'
import { useVaultRates, useVaultRewards } from '@inverse/hooks/useVaults'
import { AssetDropDownProps, Token, TokenList, Vaults, VaultTree } from '@inverse/types'
import { getERC20Contract, getVaultContract } from '@inverse/util/contracts'
import { timeSince } from '@inverse/util/time'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, constants } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'

enum VaultOperations {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  claim = 'Claim',
}

const AssetsDropdown = ({ children, label, isOpen, onOpen, onClose, noPadding }: any) => {
  return (
    <Popover placement="bottom" isOpen={isOpen} onClose={onClose} closeOnBlur={true} isLazy>
      <PopoverTrigger>
        <Stack
          direction="row"
          align="center"
          onClick={onOpen}
          borderRadius={8}
          p={noPadding ? 0 : 2}
          bgColor="purple.850"
          cursor="pointer"
        >
          {label}
        </Stack>
      </PopoverTrigger>
      <PopoverContent _focus={{ outline: 'none' }} borderWidth={0} bgColor="transparent">
        <PopoverBody
          p={2}
          mt={-1}
          bgColor="purple.800"
          borderColor="purple.850"
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

type WithdrawAssetDropdownProps = {
  vaults: Vaults,
  isOpen: boolean,
  onClose: () => void,
  onOpen: () => void,
  vault: string,
  handleChange: (vault: string) => void,
}

const WithdrawAssetDropdown = ({ vaults, isOpen, onClose, onOpen, vault, handleChange }: WithdrawAssetDropdownProps) => {
  const { balances } = useVaultBalances()

  return (
    <AssetsDropdown
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      label={
        <Stack direction="row" align="center" spacing={1}>
          <Stack direction="row" align="center" justify="flex-end">
            <Flex w={5}>
              <Image w={5} h={5} src={vaults[vault].from.image} />
            </Flex>
          </Stack>
          <ChevronRightIcon boxSize={6} />
          <Stack direction="row" align="center">
            <Flex w={5}>
              <Image w={5} h={5} src={vaults[vault].to.image} />
            </Flex>
          </Stack>
          <ChevronDownIcon boxSize={6} mt={0.5} />
        </Stack>
      }
      noPadding
    >
      {Object.entries(balances).map(([vault, balance]: any) => {
        const from = vaults[vault].from
        const to = vaults[vault].to

        return (
          <Flex
            key={vault}
            p={2}
            justify="space-between"
            borderRadius={8}
            _hover={{ bgColor: 'purple.850' }}
            onClick={() => handleChange(vault)}
            cursor="pointer"
          >
            <Stack direction="row" align="center">
              <Stack direction="row" align="center" w={20} justify="flex-end">
                <Flex w={5}>
                  <Image w={5} h={5} src={from.image} />
                </Flex>
                <Text fontWeight="semibold" color="purple.100">
                  {from.symbol}
                </Text>
              </Stack>
              <ChevronRightIcon boxSize={6} />
              <Stack direction="row" align="center" w={20}>
                <Flex w={5}>
                  <Image w={5} h={5} src={to.image} />
                </Flex>
                <Text fontWeight="semibold" color="purple.100">
                  {to.symbol}
                </Text>
              </Stack>
            </Stack>
            <Text fontWeight="semibold" color="purple.100">
              {parseFloat(formatUnits(balance, from.decimals)).toFixed(2)}
            </Text>
          </Flex>
        )
      })}
    </AssetsDropdown>
  )
}

type FromAssetDropDownProps = {
  tokens: TokenList,
  vaultTree: VaultTree,
  isOpen: boolean,
  onClose: () => void,
  onOpen: () => void,
  asset: Token,
  options: string[],
  handleChange: (from: string, to: string) => void,
}

const FromAssetDropdown = ({ tokens, vaultTree, isOpen, onClose, onOpen, asset, options, handleChange }: FromAssetDropDownProps) => {
  const { balances } = useAccountBalances()

  return (
    <AssetsDropdown
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      asset={asset}
      label={
        <>
          <Flex w={5}>
            <Image w={5} h={5} src={asset.image} />
          </Flex>
          <Flex fontSize="lg" fontWeight="semibold" color="purple.100" align="center">
            {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
          </Flex>
        </>
      }
      noPadding
    >
      {options.map((from: string) => {
        const fromToken = tokens[from]
        const toToken = tokens[Object.keys(vaultTree[from])[0]]

        return (
          <Flex
            key={from}
            p={2}
            justify="space-between"
            borderRadius={8}
            _hover={{ bgColor: 'purple.850' }}
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
              {balances ? parseFloat(formatUnits(balances[fromToken.address], fromToken.decimals)).toFixed(2) : '0.00'}
            </Text>
          </Flex>
        )
      })}
    </AssetsDropdown>
  )
}

type ToAssetDropDownProps = {
  tokens: TokenList,
  isOpen: boolean,
  onClose: () => void,
  onOpen: () => void,
  asset: Token,
  options: [string, string][],
  handleChange: (to: string) => void,
}

const ToAssetDropdown = ({ tokens, isOpen, onClose, onOpen, asset, options, handleChange }: ToAssetDropDownProps) => {
  const { rates } = useVaultRates()

  return (
    <AssetsDropdown
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      asset={asset}
      label={
        <>
          <Flex w={5}>
            <Image w={5} h={5} src={asset.image} />
          </Flex>
          <Flex fontSize="lg" fontWeight="semibold" color="purple.100" align="center">
            {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
          </Flex>
        </>
      }
    >
      {options.map(([to, vault]: [string, string]) => {
        const toToken = tokens[to]

        return (
          <Flex
            key={to}
            p={2}
            justify="space-between"
            borderRadius={8}
            _hover={{ bgColor: 'purple.850' }}
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

const VaultsClaim = ({ vaults }: { vaults: Vaults }) => {
  const { library } = useWeb3React<Web3Provider>()
  const { lastDistribution } = useVaultRates()
  const { rewards } = useVaultRewards()

  return (
    <Stack>
      <Stack direction="row" justify="center" spacing={1}>
        <Text fontSize="xs" color="purple.200" fontWeight="semibold">
          Last Distribution
        </Text>
        <Text fontSize="xs" fontWeight="semibold">
          {timeSince(lastDistribution)}
        </Text>
      </Stack>
      {Object.entries(vaults).map(([address, vault]: [string, { from: Token; to: Token }]) => (
        <Stack key={address} direction="row" align="center" justify="space-between" p={2}>
          <Stack direction="row" align="center" display={{ base: 'none', sm: 'flex' }}>
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
          <Stack
            w="full"
            direction="row"
            align="center"
            justify={{ base: 'space-between', sm: 'flex-end' }}
            spacing={4}
          >
            <Flex fontWeight="semibold">{`${(rewards && rewards[address]
              ? parseFloat(formatUnits(rewards[address], vault.to.decimals))
              : 0
            ).toFixed(10)} ${vault.to.symbol}`}</Flex>
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
  const { active, library, chainId } = useWeb3React<Web3Provider>()
  const { TOKENS, VAULTS, VAULT_DAI_ETH, VAULT_TREE } = getNetworkConfigConstants(chainId)
  const [operation, setOperation] = useState<string>(VaultOperations.deposit)
  const [amount, setAmount] = useState<string>('')
  const [vault, setVault] = useState(VAULT_DAI_ETH)
  const { isOpen: fromIsOpen, onOpen: fromOnOpen, onClose: fromOnClose } = useDisclosure()
  const { isOpen: toIsOpen, onOpen: toOnOpen, onClose: toOnClose } = useDisclosure()
  const { balances } = useAccountBalances()
  const { rates } = useVaultRates()
  const { approvals } = useVaultApprovals()
  const { balances: vaultBalances } = useVaultBalances()

  const max = () => {
    if (operation === VaultOperations.deposit) {
      if (!balances || !balances[VAULTS[vault].from.address]) {
        return 0
      }
      return parseFloat(formatUnits(balances[VAULTS[vault].from.address], VAULTS[vault].from.decimals))
    }

    return parseFloat(formatUnits(vaultBalances[vault], VAULTS[vault].from.decimals))
  }

  const handleSubmit = () => {
    const contract = getVaultContract(vault, library?.getSigner())
    switch (operation) {
      case VaultOperations.deposit:
        contract.deposit(parseUnits(amount, VAULTS[vault].from.decimals))
        break
      case VaultOperations.withdraw:
        contract.withdraw(parseUnits(amount, VAULTS[vault].from.decimals))
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
          <VaultsClaim vaults={VAULTS} />
        ) : (
          <Stack spacing={6}>
            <Stack spacing={1}>
              {balances && (
                <Stack direction="row" align="flex-end" justify="flex-end" spacing={1}>
                  <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                    Available:
                  </Text>
                  <Text fontSize="13px" fontWeight="semibold">
                    {`${max().toFixed(8)} ${VAULTS[vault].from.symbol}`}
                  </Text>
                </Stack>
              )}
              <BalanceInput
                value={amount}
                onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
                onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
                label={
                  operation === VaultOperations.deposit ? (
                    <Stack direction="row" align="center" p={2} spacing={4} cursor="pointer">
                      <Flex w={0.5} h={8}>
                        <Flex w="full" h="full" bgColor="purple.500" borderRadius={8} />
                      </Flex>
                      <FromAssetDropdown
                        tokens={TOKENS}
                        vaultTree={VAULT_TREE}
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
                  ) : (
                    <Stack direction="row" align="center" p={2} spacing={4} cursor="pointer">
                      <Flex w={0.5} h={8}>
                        <Flex w="full" h="full" bgColor="purple.500" borderRadius={8} />
                      </Flex>
                      <WithdrawAssetDropdown
                        vaults={VAULTS}
                        isOpen={fromIsOpen}
                        onClose={fromOnClose}
                        onOpen={() => {
                          fromOnOpen()
                          toOnClose()
                        }}
                        vault={vault}
                        handleChange={(vault: string) => {
                          setVault(vault)
                          fromOnClose()
                        }}
                      />
                    </Stack>
                  )
                }
              />
            </Stack>
            {operation === VaultOperations.deposit && (
              <Stack
                direction="row"
                align="center"
                fontSize={{ base: 'md', sm: 'lg' }}
                fontWeight="medium"
                justify="flex-end"
                spacing={1}
              >
                <Text color="purple.100">Earn</Text>
                <Text fontWeight="semibold">{`${(rates ? rates[vault] : 0).toFixed(2)}%`}</Text>
                <Text fontWeight="semibold" display={{ base: 'none', sm: 'flex' }}>
                  APY
                </Text>
                <Text color="purple.100">with</Text>
                <ToAssetDropdown
                  tokens={TOKENS}
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
            {operation === VaultOperations.deposit &&
              (!approvals || !approvals[vault] || !parseFloat(formatUnits(approvals[vault]))) ? (
              <SubmitButton
                onClick={() =>
                  getERC20Contract(VAULTS[vault].from.address, library?.getSigner()).approve(
                    vault,
                    constants.MaxUint256
                  )
                }
                isDisabled={!active}
              >
                Approve
              </SubmitButton>
            ) : (
              <SubmitButton
                isDisabled={!active || !amount || isNaN(amount as any) || parseFloat(amount) > max()}
                onClick={handleSubmit}
              >
                {operation}
              </SubmitButton>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
