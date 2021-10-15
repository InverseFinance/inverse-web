import { Box, Flex, Image, Stack, Text } from '@chakra-ui/react'
import { AnchorButton } from '@inverse/components/Anchor/AnchorButton'
import { AnchorStats } from '@inverse/components/Anchor/AnchorStats'
import { BalanceInput } from '@inverse/components/Input'
import { Modal, ModalProps } from '@inverse/components/Modal'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useAccountBalances, useSupplyBalances, useBorrowBalances } from '@inverse/hooks/useBalances'
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useAnchorPrices } from '@inverse/hooks/usePrices'
import { Market } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { NavButtons } from '@inverse/components/Button'

export enum AnchorOperations {
  supply = 'Supply',
  withdraw = 'Withdraw',
  borrow = 'Borrow',
  repay = 'Repay',
}

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
  console.log(asset)
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
        const userWithdrawable =  !usdBorrowable || withdrawable > supply ? supply : withdrawable
        return Math.min(userWithdrawable, asset.liquidity? asset.liquidity: userWithdrawable)
      case AnchorOperations.borrow:
        const borrowable = prices && usdBorrowable
          ? usdBorrowable /
              parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
          : 0
        return Math.min(borrowable, asset.liquidity);
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
        <Stack minWidth={24} direction="row" align="center">
          <Image src={asset.underlying.image} w={8} h={8} />
          <Text>{asset.underlying.name}</Text>
        </Stack>
      }
      footer={
        <AnchorButton
          operation={operation}
          asset={asset}
          amount={amount && !isNaN(amount as any) ? parseUnits(amount, asset.underlying.decimals) : BigNumber.from(0)}
          isDisabled={!amount || !active || isNaN(amount as any) || parseFloat(amount) > max()}
        />
      }
    >
      <Stack p={4} w="full" spacing={4}>
        <NavButtons options={operations} active={operation} onClick={setOperation} />
        <Stack align="center" spacing={1}>
          <Flex w="full" justify="flex-end" align="flex-end">
            <Stack direction="row" align="flex-end" spacing={1}>
              <Text fontSize="13px" fontWeight="semibold" color="purple.100">
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
    operations={[AnchorOperations.supply, AnchorOperations.withdraw]}
  />
)

export const AnchorBorrowModal = ({ isOpen, onClose, asset }: AnchorModalProps) => (
  <AnchorModal
    isOpen={isOpen}
    onClose={onClose}
    asset={asset}
    operations={[AnchorOperations.borrow, AnchorOperations.repay]}
  />
)
