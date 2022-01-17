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
import { NavButtons, SubmitButton } from '@inverse/components/common/Button'
import { TEST_IDS } from '@inverse/config/test-ids'
import { UnderlyingItem } from '@inverse/components/common/Assets/UnderlyingItem';
import { useAccountMarkets } from '@inverse/hooks/useMarkets'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { InfoMessage, StatusMessage, WarningMessage } from '@inverse/components/common/Messages'
import { Link } from '@inverse/components/common/Link';
import { shortenNumber, getBorrowInfosAfterSupplyChange } from '@inverse/util/markets'
import { roundFloorString } from '@inverse/util/misc'
import { getComptrollerContract } from '@inverse/util/contracts'
import { Web3Provider } from '@ethersproject/providers';

type AnchorModalProps = ModalProps & {
  asset: Market
}

const LP_POOL_LINKS: { [key: string]: { name: string, url: string } } = {
  'INV-DOLA-SLP': { name: 'Sushi', url: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014CcdED1e7d814EDC9ce4' },
  'DOLA-3POOL': { name: 'Crv', url: 'https://crv.to/pool' },
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
  const { usdBorrowable, usdBorrow } = useAccountLiquidity()
  const { exchangeRates } = useExchangeRates()
  const { markets: accountMarkets } = useAccountMarkets()

  if (!operations.includes(operation)) {
    setOperation(operations[0])
  }

  const isCollateral = !!accountMarkets.find((market: Market) => market.token === asset.token)
  const hasSuppliedAsset = supplyBalances && supplyBalances[asset.token] && supplyBalances[asset.token].gt(BigNumber.from('0'));
  const needWithdrawWarning = isCollateral && (usdBorrow > 0) && hasSuppliedAsset && operation === AnchorOperations.withdraw

  const maxFloat = () => parseFloat(maxString())

  const maxString = () => {
    switch (operation) {
      case AnchorOperations.supply:
        return balances
          ? (formatUnits(balances[asset.underlying.address || 'ETH'], asset.underlying.decimals))
          : '0'
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

        const userWithdrawable = (!usdBorrowable || withdrawable > supply) || !isCollateral ? supply : withdrawable
        return roundFloorString(Math.min(userWithdrawable, asset.liquidity ? asset.liquidity : userWithdrawable))
      case AnchorOperations.borrow:
        const borrowable =
          prices && usdBorrowable
            ? usdBorrowable /
            parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
            : 0
        return roundFloorString(Math.min(borrowable, asset.liquidity))
      case AnchorOperations.repay:
        const balance = balances
          ? (formatUnits(balances[asset.underlying.address || 'ETH'], asset.underlying.decimals))
          : '0'

        const borrowed = borrowBalances
          ? (formatUnits(borrowBalances[asset.token], asset.underlying.decimals))
          : '0'

        return parseFloat(balance) < parseFloat(borrowed) ? balance : borrowed
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
    <Text fontSize="sm" fontWeight="semibold" color="purple.100" align="center">
      {asset.underlying.symbol.replace('-SLP', '')}
    </Text>
  </Stack>

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      scrollBehavior={operation === AnchorOperations.withdraw ? 'inside' : undefined}
      header={
        <Stack fontSize={{ base: '16px', sm: '20px' }} minWidth={24} direction="row" align="center" data-testid={TEST_IDS.anchor.modalHeader}>
          <UnderlyingItem label={`${asset.underlying.name} Market`} address={asset.token} image={asset.underlying.image} imgSize={8} />
          <ScannerLink value={asset.token} label={<ExternalLinkIcon />} fontSize="12px" />
        </Stack>
      }
      footer={
        <Box w="100%" data-testid={TEST_IDS.anchor.modalFooter}>
          {
            needWithdrawWarning
            && <WarningMessage alertProps={{ mt: '1', fontSize: '12px', w: 'full' }}
              description="Enabled as collateral, withdrawing reduces borrowing limit" />
          }
          <AnchorButton
            operation={operation}
            asset={asset}
            amount={amount && !isNaN(amount as any) ? parseUnits(amount, asset.underlying.decimals) : BigNumber.from(0)}
            needWithdrawWarning={needWithdrawWarning}
            isDisabled={!amount || !active || isNaN(amount as any) || (parseFloat(amount) > maxFloat() && amount !== maxString())}
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
                <Text>Hey <b>Viking</b>! Any questions? </Text>
                Check out the
                <Link ml="1" isExternal href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/floki-faq">
                  Floki x Inverse FAQ
                </Link>
              </>
            } />
        }
        {
          operations.length > 1 ?
            <NavButtons options={operations} active={operation} onClick={setOperation} />
            : null
        }
        {
          ['INV-DOLA-SLP', 'DOLA-3POOL'].includes(asset.underlying.symbol)
          && operation === AnchorOperations.supply
          && maxFloat() <= 1
          && <InfoMessage
            alertProps={{ w: 'full' }}
            description={
              <>
                <Text>Get the {asset.underlying.symbol} token on
                  <Link ml="1" isExternal href={LP_POOL_LINKS[asset.underlying.symbol].url}>
                    {LP_POOL_LINKS[asset.underlying.symbol].name}
                  </Link>
                </Text>
              </>
            } />
        }
        <Stack align="center" spacing={1}>
          <Flex w="full" justify="flex-end" align="flex-end">
            <Stack direction="row" align="flex-end" spacing={1}>
              <Text fontSize="13px" fontWeight="semibold" color="purple.250">
                {`${maxLabel()}:`}
              </Text>
              <Text fontSize="13px" fontWeight="semibold">
                {`~ ${shortenNumber(maxFloat(), (maxFloat() < 1000 ? 4 : 2), false, true)} ${asset.underlying.symbol}`}
              </Text>
            </Stack>
          </Flex>
          <BalanceInput
            value={amount}
            inputProps={{ fontSize: '15px' }}
            onChange={(e: React.MouseEvent<HTMLInputElement>) => {
              if (e.currentTarget.value.length < 20) setAmount(e.currentTarget.value)
            }}
            onMaxClick={() => setAmount(maxString())}
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
          operation === AnchorOperations.borrow &&
          <InfoMessage alertProps={{ fontSize: '12px' }} description="The Debt to repay will be the Borrowed Amount plus the generated interests over time by the Annual Percentage Rate" />
        }
        {
          operation === AnchorOperations.repay &&
          <InfoMessage alertProps={{ fontSize: '12px', w: 'full' }} description='To repay all your debt for this market use the Repay All button' />
        }
        {
          needWithdrawWarning &&
          <InfoMessage alertProps={{ fontSize: '12px' }}
            description={
              <>
                <Text>Withdrawing using "max" is not the same as using "withdraw all" (tries to withdraw everything you own in the pool regardless of debts).</Text>
                <Text mt="2">Withdrawing "max" can leave some "dust" not withdraw all.</Text>
                <Text fontWeight="bold" mt="2">If the amount you try to withdraw leaves not enough collateral to cover the debts you have then the transaction may fail to send you the tokens.</Text>
              </>
            } />
        }
        {
          !needWithdrawWarning && operation === AnchorOperations.withdraw &&
          <InfoMessage alertProps={{ fontSize: '12px' }}
            description='Withdrawing with "max" can leave some "dust" not "withdraw all".' />
        }
      </Stack>
    </Modal>
  )
}

export const AnchorCollateralModal = ({
  isOpen,
  onClose,
  asset,
}: AnchorModalProps) => {
  const { library } = useWeb3React<Web3Provider>();
  const { prices: anchorPrices } = useAnchorPrices()
  const { usdBorrowable, usdBorrow } = useAccountLiquidity()

  const actionName = asset.isCollateral ? 'Disable' : 'Enable';
  const status = asset.isCollateral ? 'warning' : 'info';
  const consequence = asset.isCollateral ? 'decrease' : 'increase';

  const { newPerc } = getBorrowInfosAfterSupplyChange({ market: asset, prices: anchorPrices, usdBorrow, usdBorrowable, amount: -(asset.balance || 0) });

  const handleConfirm = async () => {
    const contract = getComptrollerContract(library?.getSigner());
    const method = asset.isCollateral ? 'exitMarket' : 'enterMarkets';
    const target = asset.isCollateral ? asset.token : [asset.token];
    return contract[method](target);
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack fontSize={{ base: '16px', sm: '20px' }} minWidth={24} direction="row" align="center">
          <UnderlyingItem label={`${asset.underlying.name} Market`} address={asset.token} image={asset.underlying.image} imgSize={8} />
          <ScannerLink value={asset.token} label={<ExternalLinkIcon />} fontSize="12px" />
        </Stack>
      }
      footer={
        <Box w="100%">
          {
            newPerc >= 99 ?
              <WarningMessage
                title="Can't Disable Asset as Collateral"
                description={
                  <>
                    Your <b>{shortenNumber(usdBorrow, 2, true)} debt</b> needs to be covered by enough collaterals.
                    <Text fontWeight="bold" mt="2">You can repay your debt first or add another collateral to cover it.</Text>
                  </>
                }
              />
              :
              <SubmitButton onClick={handleConfirm} refreshOnSuccess={true} onSuccess={() => onClose()}>
                {actionName} {asset.underlying.symbol} as Collateral
              </SubmitButton>
          }
        </Box>
      }
    >
      <Stack p={4} w="full" spacing={4}>
        {
          <StatusMessage
            alertProps={{ fontSize: '12px', w: 'full' }}
            status={status}
            title={`${actionName} your supplied ${asset.underlying.symbol} as Collateral ?`}
            description={<>
              This will {consequence} your borrowing capacity
              <Text>See changes in Borrow Limit Stats below</Text>
            </>} />
        }
        <AnchorStats
          operation={asset.isCollateral ? AnchorOperations.withdraw : AnchorOperations.supply}
          asset={asset} amount={(asset?.balance || 0).toString()} />
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
