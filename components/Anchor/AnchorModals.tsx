import { Flex, Image, Stack, Text, Box } from '@chakra-ui/react'
import { AnchorButton } from '@app/components/Anchor/AnchorButton'
import { AnchorStats } from '@app/components/Anchor/AnchorStats'
import { BalanceInput } from '@app/components/common/Input'
import { Modal, ModalProps } from '@app/components/common/Modal'
import { useAccountLiquidity, useAccountSnapshot } from '@app/hooks/useAccountLiquidity'
import { useAccountBalances, useSupplyBalances, useBorrowBalances } from '@app/hooks/useBalances'
import { useExchangeRates } from '@app/hooks/useExchangeRates'
import { useAnchorPrices } from '@app/hooks/usePrices'
import { AnchorOperations, Market } from '@app/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { NavButtons, SubmitButton } from '@app/components/common/Button'
import { TEST_IDS } from '@app/config/test-ids'
import { UnderlyingItem } from '@app/components/common/Assets/UnderlyingItem';
import { useAccountMarkets } from '@app/hooks/useMarkets'
import ScannerLink from '@app/components/common/ScannerLink'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { InfoMessage, StatusMessage, WarningMessage } from '@app/components/common/Messages'
import { Link } from '@app/components/common/Link';
import { shortenNumber, getBorrowInfosAfterSupplyChange } from '@app/util/markets'
import { roundFloorString } from '@app/util/misc'
import { getComptrollerContract } from '@app/util/contracts'
import { Web3Provider } from '@ethersproject/providers';
import { AnchorMarketInterestChart } from './AnchorMarketInterestChart'
import { RTOKEN_SYMBOL } from '@app/variables/tokens'
import { useRouter } from 'next/router'

type AnchorModalProps = ModalProps & {
  asset: Market
}

const LP_POOL_LINKS: { [key: string]: { name: string, url: string } } = {
  'INV-DOLA-SLP': { name: 'Sushi', url: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014CcdED1e7d814EDC9ce4' },
  'DOLA-3POOL': { name: 'Curve', url: 'https://curve.finance/factory/27/deposit' },
}

export const AnchorModal = ({
  isOpen,
  onClose,
  asset,
  operations,
  scrollBehavior,
}: AnchorModalProps & { operations: AnchorOperations[] }) => {
  const isV1market = ['WBTC-v1', 'YFI-v1', 'ETH-v1'].includes(asset.underlying.symbol)
  const _operations = operations//isV1market ? [...operations, AnchorOperations.migrate] : operations;
  const [operation, setOperation] = useState(_operations[0])
  const [amount, setAmount] = useState<string>('')
  const { isActive } = useWeb3React()
  const { balances } = useAccountBalances()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { prices } = useAnchorPrices()
  const { usdBorrowable, usdBorrow } = useAccountLiquidity()
  const { exchangeRates } = useExchangeRates()
  const { markets: accountMarkets } = useAccountMarkets()

  if (!_operations.includes(operation)) {
    setOperation(_operations[0])
  }

  const isCollateral = !!accountMarkets.find((market: Market) => market.token === asset.token)
  const hasSuppliedAsset = supplyBalances && supplyBalances[asset.token] && supplyBalances[asset.token].gt(BigNumber.from('0'));
  const needWithdrawWarning = isCollateral && (usdBorrow > 0) && hasSuppliedAsset && operation === AnchorOperations.withdraw

  const maxFloat = () => parseFloat(maxString())

  const maxString = () => {
    switch (operation) {
      case AnchorOperations.supply:
        return balances
          ? (formatUnits(balances[asset.underlying.address || 'CHAIN_COIN']|| BigNumber.from('0'), asset.underlying.decimals))
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
          ? (formatUnits(balances[asset.underlying.address || 'CHAIN_COIN'], asset.underlying.decimals))
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
      case AnchorOperations.migrate:
      case AnchorOperations.withdraw:
        return 'Max. Withdrawable is at least'
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
    <Flex w={5} position="relative">
      <Image w={5} h={5} src={asset.underlying.image} alt={asset.underlying.symbol} />
      {!!asset.underlying.protocolImage && <Image borderRadius="20px" position="absolute" bottom="0" right="-5px" w={3} h={3} src={asset.underlying.protocolImage} alt="protocol" />}
    </Flex>
    <Text fontSize="sm" fontWeight="semibold" color="lightAccentTextColor" align="center">
      {asset.underlying.symbol.replace('-SLP', '')}
    </Text>
  </Stack>

  const isSupplySide = [AnchorOperations.supply, AnchorOperations.withdraw, AnchorOperations.migrate].includes(operation);
  const isWithdrawOrMigrate = [AnchorOperations.withdraw, AnchorOperations.migrate].includes(operation);
  const flokiSupplyDisabled = operation === AnchorOperations.supply && asset.underlying.symbol === 'FLOKI';
  const pausedCollaterals = accountMarkets.filter(m => m.collateralGuardianPaused);
  const isUserBorrowAbilityPaused = pausedCollaterals?.length > 0 && operation === AnchorOperations.borrow;

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      scrollBehavior={scrollBehavior || 'outside'}
      header={
        <Stack fontSize={{ base: '16px', sm: '20px' }} minWidth={24} direction="row" align="center" data-testid={TEST_IDS.anchor.modalHeader}>
          <UnderlyingItem label={`${asset.underlying.symbol} MARKET`} address={asset.token} image={asset.underlying.image} imgSize={32} protocolImage={asset.underlying.protocolImage} />
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
          {
            operation === AnchorOperations.supply &&
            isV1market
            && <WarningMessage
              alertProps={{
                fontSize: '12px'
              }}
              title="WARNING: this market has Bad Debts"
              description={
                <>
                  Due to Bad Debts on the {asset.underlying.symbol} Market, there's a high risk that you will not be able to withdraw your deposits for a while (until bad debts are repaid).
                  <Text color="error" fontWeight="bold">
                    Only Supply on the {asset.underlying.symbol} Market if you accept the risk of not being able to withdraw for an undetermined amount of time.
                  </Text>
                </>
              }
            />
          }
          {
            isUserBorrowAbilityPaused && <WarningMessage alertProps={{ fontSize: '12px' }} description={`Borrowing ability paused because you are using paused collaterals: ${pausedCollaterals?.map(m => m.underlying.symbol).join(', ')}`} />
          }
          {
            (asset.liquidity < parseFloat(amount) || asset.liquidity === 0) && isWithdrawOrMigrate ?
              <InfoMessage
                alertProps={{ w: 'full', fontSize: '12px' }}
                description="Not enough Liquidity at the moment"
              />
              :
              <>
                {
                  isWithdrawOrMigrate && (asset.liquidity * asset.oraclePrice) < 100 &&
                  <InfoMessage
                    alertProps={{ w: 'full', fontSize: '12px' }}
                    description="Very low market liquidity at the moment"
                  />
                }
                <AnchorButton
                  operation={operation}
                  asset={asset}
                  amount={amount && !isNaN(amount as any) ? parseUnits(amount, asset.underlying.decimals) : BigNumber.from(0)}
                  needWithdrawWarning={needWithdrawWarning}
                  isDisabled={isUserBorrowAbilityPaused || flokiSupplyDisabled || !amount || !isActive || isNaN(amount as any) || (parseFloat(amount) > maxFloat() && amount !== maxString())}
                />
              </>
          }
        </Box>
      }
      data-testid={`${TEST_IDS.anchor.modal}-${operation}`}
    >
      <Stack p={4} w="full" spacing={4}>
        {
          asset.underlying.symbol === 'FLOKI' && <InfoMessage
            alertProps={{ w: 'full', fontSize: '12px' }}
            description={
              <>
                <Text>Hey <b>Viking</b>!</Text>
                <b>The Floki token migrated</b>, some work needs to be done before Floki holders can use Frontier again.
              </>
            } />
        }
        {
          _operations.length > 1 ?
            <NavButtons isStaking={asset.underlying.symbol == RTOKEN_SYMBOL} options={_operations} active={operation} onClick={setOperation} />
            : null
        }
        {
          asset.underlying.symbol.startsWith('yv') && operation === AnchorOperations.supply &&
          <InfoMessage
            alertProps={{ w: 'full' }}
            title="Yearn Vault Asset"
            description={<Link isExternal href={`https://yearn.finance/#/vault/${asset.underlying.address}`}>
              Get {asset.underlying.symbol}
            </Link>}
          />
        }
        {
          ['INV-DOLA-SLP', 'DOLA-3POOL'].includes(asset.underlying.symbol)
          && operation === AnchorOperations.supply
          && maxFloat() <= 1
          && <InfoMessage
            alertProps={{ w: 'full' }}
            title={asset.underlying.symbol === 'INV-DOLA-SLP' ? null : <>
              Curve Wars!
            </>}
            description={
              <>
                {
                  asset.underlying.symbol === 'INV-DOLA-SLP' ?
                    <Text fontSize="12px">Get {asset.underlying.symbol} on
                      <Link ml="1" isExternal href={LP_POOL_LINKS[asset.underlying.symbol].url}>
                        {LP_POOL_LINKS[asset.underlying.symbol].name}
                      </Link>
                    </Text>
                    :
                    <Text display="inline-block" fontSize="12px">
                      Get <b>{asset.underlying.symbol}</b> on <Link isExternal href={LP_POOL_LINKS[asset.underlying.symbol].url}>
                        {LP_POOL_LINKS[asset.underlying.symbol].name}</Link> and deposit it on <Link isExternal href={"https://yearn.finance/#/vault/0xd88dBBA3f9c4391Ee46f5FF548f289054db6E51C"}>
                        Yearn
                      </Link> or <Link isExternal href={"https://www.convexfinance.com/stake"}>
                        Convex
                      </Link> to earn yields in stables or stables + CVR/CVX
                    </Text>
                }
              </>
            } />
        }
        <Stack align="center" spacing={1}>
          <Flex w="full" justify="flex-end" align="flex-end">
            <Stack direction="row" align="flex-end" spacing={1}>
              <Text fontSize="13px" fontWeight="semibold" color="lightAccentTextColor">
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
              !!asset.underlying.address ?
                <ScannerLink value={asset.underlying.address} style={{ textDecoration: 'none' }}>
                  {inputRightSideContent}
                </ScannerLink>
                : inputRightSideContent
            }
          />
        </Stack>
        <AnchorStats operation={operation} asset={asset} amount={amount} />
        {/* Show Interest chart just for the borrowing case for now */}
        {
          !!asset?.utilizationRate && !isSupplySide &&
          <>
            <AnchorMarketInterestChart
              maxWidth={380}
              market={asset}
              title={`${(isSupplySide ? 'Supply' : 'Borrow')} Interest Rate`}
              autocompounds={true}
              type={isSupplySide ? 'supply' : 'borrow'} />
            <Link isExternal={true} textAlign="center" fontSize="12px" href="/transparency/interest-model">
              Learn more about the Interest Model
            </Link>
          </>
        }
        {
          operation === AnchorOperations.borrow &&
          <InfoMessage alertProps={{ fontSize: '12px' }} description="The Debt to repay will be the Borrowed Amount plus the generated interests over time by the APY" />
        }
        {
          operation === AnchorOperations.repay &&
          <InfoMessage alertProps={{ fontSize: '12px', w: 'full' }} description={`To repay all your ${asset.underlying.symbol} debt use the Repay All button`} />
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
        {
          operation === AnchorOperations.supply && asset.underlying.symbol === RTOKEN_SYMBOL && asset.mintable &&
          <InfoMessage
            alertProps={{ fontSize: '12px' }}
            title="Asset with automatic claim/restake!"
            description="Your supplied INV balance will automatically increase, no need to claim and re-stake!"
          />
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
  const { provider, account } = useWeb3React<Web3Provider>();
  const { query } = useRouter();
  const userAddress = (query?.viewAddress as string) || account;
  const { prices: anchorPrices } = useAnchorPrices()
  const { usdBorrowable, usdBorrow } = useAccountLiquidity()
  // can't disable collateral if there is a borrowed amount in same asset
  const { owed } = useAccountSnapshot(asset, userAddress);

  const actionName = asset.isCollateral ? 'Stop using' : 'Enable';
  const status = asset.isCollateral ? 'warning' : 'info';
  const consequence = asset.isCollateral ? 'decrease' : 'increase';

  const { newPerc } = getBorrowInfosAfterSupplyChange({ market: asset, prices: anchorPrices, usdBorrow, usdBorrowable, amount: -(asset.balance || 0) });

  const preventDisabling = owed > 0 || (newPerc >= 99 && asset.isCollateral);

  const handleConfirm = async () => {
    const contract = getComptrollerContract(provider?.getSigner());
    const method = asset.isCollateral ? 'exitMarket' : 'enterMarkets';
    const target = asset.isCollateral ? asset.token : [asset.token];
    return contract[method](target);
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      scrollBehavior="inside"
      header={
        <Stack fontSize={{ base: '16px', sm: '20px' }} minWidth={24} direction="row" align="center">
          <UnderlyingItem label={`${asset.underlying.name} Market`} address={asset.token} image={asset.underlying.image} imgSize={32} protocolImage={asset.underlying.protocolImage} />
          <ScannerLink value={asset.token} label={<ExternalLinkIcon />} fontSize="12px" />
        </Stack>
      }
      footer={
        <Box w="100%">
          {
            preventDisabling ?
              <WarningMessage
                title={`${!owed ? 'Borrow Limit Check: ' : ''}Can't Disable ${asset.underlying.symbol} as Collateral`}
                alertProps={{ fontSize: '12px', w: 'full' }}
                description={
                  owed > 0 ?
                    <>
                      To disable {asset.underlying.symbol} as collateral you must first Repay All the borrowed {asset.underlying.symbol} you have.
                    </>
                    :
                    <>
                      Your <b>{shortenNumber(usdBorrow, 2, true, true)} debt</b> needs to be covered by enough collaterals.
                      <Text fontWeight="bold" mt="2">You first need to repay enough debt or add another collateral to cover more than your debt.</Text>
                    </>
                }
              />
              :
              <SubmitButton needPoaFirst={!asset.isCollateral} disabled={asset.collateralGuardianPaused && !asset.isCollateral} onClick={handleConfirm} refreshOnSuccess={true} onSuccess={() => onClose()}>
                {actionName} {asset.underlying.symbol} as Collateral
              </SubmitButton>
          }
        </Box>
      }
    >
      <Stack p={4} w="full" spacing={4}>
        {
          !preventDisabling ?
            !asset.isCollateral && asset.collateralGuardianPaused ?
              <WarningMessage alertProps={{ fontSize: '12px', w: 'full' }}
                description={`${asset.underlying.symbol} cannot be used as a collateral at the moment`}
              />
              :
              <StatusMessage
                alertProps={{ fontSize: '12px', w: 'full' }}
                status={status}
                title={`${actionName} your supplied ${asset.underlying.symbol} as Collaterals ?`}
                description={<>
                  {
                    usdBorrow > 0 || asset.isCollateral ? `This will ${consequence} your borrowing capacity`
                      : 'This will allow you to borrow assets against your collaterals'
                  }
                  <Text>See changes in Borrow Limit Stats below</Text>
                </>}
              />
            : null
        }

        <AnchorStats
          operation={asset.isCollateral ? AnchorOperations.withdraw : AnchorOperations.supply}
          asset={asset} amount={(asset?.balance || 0).toString()}
          isCollateralModal={true}
        />
      </Stack>
    </Modal>
  )
}

export const AnchorSupplyModal = ({ isOpen, onClose, asset }: AnchorModalProps) => (
  <AnchorModal
    scrollBehavior="inside"
    isOpen={isOpen}
    onClose={onClose}
    asset={asset}
    operations={asset.mintable ? [AnchorOperations.supply, AnchorOperations.withdraw] : [AnchorOperations.withdraw]}
  />
)

export const AnchorBorrowModal = ({ isOpen, onClose, asset }: AnchorModalProps) => (
  <AnchorModal
    scrollBehavior="inside"
    isOpen={isOpen}
    onClose={onClose}
    asset={asset}
    operations={asset.borrowable ? [AnchorOperations.borrow, AnchorOperations.repay] : [AnchorOperations.repay]}
  />
)
