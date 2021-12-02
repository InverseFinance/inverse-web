import {
  Flex,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { NavButtons, SubmitButton } from '@inverse/components/common/Button'
import Container from '@inverse/components/common/Container'
import { BalanceInput } from '@inverse/components/common/Input'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { useVaultApprovals } from '@inverse/hooks/useApprovals'
import { useAccountBalances, useVaultBalances } from '@inverse/hooks/useBalances'
import { useVaultRates } from '@inverse/hooks/useVaults'
import { getERC20Contract, getVaultContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { constants } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState, useEffect } from 'react'

import { VaultsClaim } from './VaultsClaim'
import { FromAssetDropdown } from '@inverse/components/common/Assets/FromAssetDropdown';
import { WithdrawAssetDropdown } from './WithdrawAssetDropdown';
import { ToAssetDropdown } from '@inverse/components/common/Assets/ToAssetDropdown';
import { handleTx } from '@inverse/util/transactions';
import { hasAllowance } from '@inverse/util/web3'

enum VaultOperations {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  claim = 'Claim',
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
  const [isApproved, setIsApproved] = useState(hasAllowance(approvals, vault));
  const { balances: vaultBalances } = useVaultBalances()

  useEffect(() => {
    setIsApproved(hasAllowance(approvals, vault))
  }, [approvals, vault])

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
                        balances={balances}
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
              !isApproved ? (
              <SubmitButton
                onClick={async () =>
                  handleTx(
                    await getERC20Contract(VAULTS[vault].from.address, library?.getSigner()).approve(vault, constants.MaxUint256),
                    { onSuccess: () => setIsApproved(true) }
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
