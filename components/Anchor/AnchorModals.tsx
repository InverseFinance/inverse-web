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
import { UnderlyingItem } from '@inverse/components/common/Assets/UnderlyingItem';
import { useAccountMarkets } from '@inverse/hooks/useMarkets'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { InfoMessage } from '@inverse/components/common/Messages'
import { Link } from '@inverse/components/common/Link';

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

  const inputRightSideContent = <Stack direction="row" align="center" pl={2} pr={4}>
    <Flex w={5}>
      <Image w={5} h={5} src={asset.underlying.image} />
    </Flex>
    <Text fontSize="lg" fontWeight="semibold" color="purple.100" align="center">
      {asset.underlying.symbol}
    </Text>
  </Stack>

  const getMaxString = (precision?: number) => (max()).toFixed(precision || asset.underlying.decimals).replace(/(\.[0-9]*[1-9])0+$|\.0*$/,'$1');

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center" data-testid={TEST_IDS.anchor.modalHeader}>
          <UnderlyingItem label={`${asset.underlying.name} Market`} address={asset.token} image={asset.underlying.image} imgSize={8} />
          <ScannerLink value={asset.token} label={<ExternalLinkIcon />} fontSize="12px" />
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
          asset.underlying.symbol === 'FLOKI' && <InfoMessage
            alertProps={{ w: 'full' }}
            description={
              <>
                <Text>Hey <b>Viking</b> ! Any question ? </Text>
                Check out the
                <Link ml="1" isExternal href="https://docs.google.com/document/d/1EwbaXqGzcUo1rEhGZ-WvaXYc3b2_RJifAd8KGiONM0A">
                  Floki-Inverse FAQ
                </Link>
              </>
            } />
        }
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
                {`${getMaxString(8)} ${asset.underlying.symbol}`}
              </Text>
            </Stack>
          </Flex>
          <BalanceInput
            value={amount}
            inputProps={{ fontSize: '15px' }}
            onChange={(e: React.MouseEvent<HTMLInputElement>) => {
              if (e.currentTarget.value.length < 20) setAmount(e.currentTarget.value)
            }}
            onMaxClick={() => setAmount(getMaxString())}
            label={
              asset.underlying.symbol !== 'ETH' ?
                <ScannerLink value={asset.underlying.address} style={{ textDecoration: 'none' }}>
                  {inputRightSideContent}
                </ScannerLink>
                : inputRightSideContent
            }
          />
        </Stack>
        <AnchorStats operation={operation} asset={asset} amount={amount} />
        {
          operation === AnchorOperations.borrow ?
            <InfoMessage alertProps={{ fontSize: '12px' }} description="The Debt to repay will be the Borrowed Amount plus the generated interests over time by the Annual Percentage Rate" />
            : null
        }
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
