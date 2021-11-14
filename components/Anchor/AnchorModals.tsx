import { Flex, Image, Stack, Text, Box } from '@chakra-ui/react'
import { AnchorButton } from '@inverse/components/Anchor/AnchorButton'
import { AnchorStats } from '@inverse/components/Anchor/AnchorStats'
import { BalanceInput } from '@inverse/components/common/Input'
import { Modal, ModalProps } from '@inverse/components/common/Modal'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useAccountBalances, useSupplyBalances, useBorrowBalances } from '@inverse/hooks/useBalances'
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useAnchorPrices } from '@inverse/hooks/usePrices'
import { AnchorOperations, Market } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { NavButtons } from '@inverse/components/common/Button'
import { TEST_IDS } from '@inverse/config/test-ids'
import { UnderlyingItem } from '@inverse/components/common/Underlying/UnderlyingItem';
import { useAccountMarkets } from '@inverse/hooks/useMarkets'

type AnchorModalProps = ModalProps & {
  asset: Market
}

export const AnchorModal = ({
  isOpen,
  onClose,
  asset,
  operations,
}: AnchorModalProps & { operations: AnchorOperations[] }) => {
  const [operation, setOperation] = useState(operations[0])
  const [amount, setAmount] = useState<string>('')
  const { active } = useWeb3React()
  const { balances } = useAccountBalances()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { prices } = useAnchorPrices()
  const { usdBorrowable } = useAccountLiquidity()
  const { exchangeRates } = useExchangeRates()
  const { markets: accountMarkets } = useAccountMarkets()

  if (!operations.includes(operation)) {
    setOperation(operations[0])
  }

  const max = () => {
    switch (operation) {
      case AnchorOperations.supply:
        return balances
          ? parseFloat(formatUnits(balances[asset.underlying.address || 'ETH'], asset.underlying.decimals))
          : 0
      case AnchorOperations.withdraw:
        const supply =
          supplyBalances && exchangeRates
            ? parseFloat(formatUnits(supplyBalances[asset.token], asset.underlying.decimals)) *
            parseFloat(formatUnits(exchangeRates[asset.token]))
            : 0
        const withdrawable = prices
          ? usdBorrowable /
          (asset.collateralFactor *
            parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals))))
          : 0
          const isEnabled = accountMarkets.find((market: Market) => market.token === asset.token)
          const userWithdrawable = (!usdBorrowable || withdrawable > supply) || !isEnabled ? supply : withdrawable
        return Math.min(userWithdrawable, asset.liquidity ? asset.liquidity : userWithdrawable)
      case AnchorOperations.borrow:
        const borrowable =
          prices && usdBorrowable
            ? usdBorrowable /
            parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
            : 0
        return Math.min(borrowable, asset.liquidity)
      case AnchorOperations.repay:
        const balance = balances
          ? parseFloat(formatUnits(balances[asset.underlying.address || 'ETH'], asset.underlying.decimals))
          : 0

        const borrowed = borrowBalances
          ? parseFloat(formatUnits(borrowBalances[asset.token], asset.underlying.decimals))
          : 0

        return Math.min(balance, borrowed)
    }
  }

  const maxLabel = () => {
    switch (operation) {
      case AnchorOperations.supply:
        return 'Wallet'
      case AnchorOperations.withdraw:
        return 'Withdrawable'
      case AnchorOperations.borrow:
        return 'Borrowable'
      case AnchorOperations.repay:
        return 'Repayable'
    }
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center" data-testid={TEST_IDS.anchor.modalHeader}>
          <UnderlyingItem label={asset.underlying.name} address={asset.token} image={asset.underlying.image} imgSize={8} />
        </Stack>
      }
      footer={
        <Box w="100%" data-testid={TEST_IDS.anchor.modalFooter}>
          <AnchorButton
            operation={operation}
            asset={asset}
            amount={amount && !isNaN(amount as any) ? parseUnits(amount, asset.underlying.decimals) : BigNumber.from(0)}
            isDisabled={!amount || !active || isNaN(amount as any) || parseFloat(amount) > max()}
          />
        </Box>
      }
      data-testid={`${TEST_IDS.anchor.modal}-${operation}`}
    >
      <Stack p={4} w="full" spacing={4}>
        {
          operations.length > 1 ?
            <NavButtons options={operations} active={operation} onClick={setOperation} />
            : null
        }
        <Stack align="center" spacing={1}>
          <Flex w="full" justify="flex-end" align="flex-end">
            <Stack direction="row" align="flex-end" spacing={1}>
              <Text fontSize="13px" fontWeight="semibold" color="purple.250">
                {`${maxLabel()}:`}
              </Text>
              <Text fontSize="13px" fontWeight="semibold">
                {`${Math.floor(max() * 1e8) / 1e8} ${asset.underlying.symbol}`}
              </Text>
            </Stack>
          </Flex>
          <BalanceInput
            value={amount}
            onChange={(e: React.MouseEvent<HTMLInputElement>) => {
              if (e.currentTarget.value.length < 20) setAmount(e.currentTarget.value)
            }}
            onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
            label={
              <Stack direction="row" align="center" pl={2} pr={4}>
                <Flex w={5}>
                  <Image w={5} h={5} src={asset.underlying.image} />
                </Flex>
                <Text fontSize="lg" fontWeight="semibold" color="purple.100" align="center">
                  {asset.underlying.symbol}
                </Text>
              </Stack>
            }
          />
        </Stack>
        <AnchorStats operation={operation} asset={asset} amount={amount} />
      </Stack>
    </Modal>
  )
}

export const AnchorSupplyModal = ({ isOpen, onClose, asset }: AnchorModalProps) => (
  <AnchorModal
    isOpen={isOpen}
    onClose={onClose}
    asset={asset}
    operations={asset.mintable ? [AnchorOperations.supply, AnchorOperations.withdraw] : [AnchorOperations.withdraw]}
  />
)

export const AnchorBorrowModal = ({ isOpen, onClose, asset }: AnchorModalProps) => (
  <AnchorModal
    isOpen={isOpen}
    onClose={onClose}
    asset={asset}
    operations={asset.borrowable ? [AnchorOperations.borrow, AnchorOperations.repay] : [AnchorOperations.repay]}
  />
)
