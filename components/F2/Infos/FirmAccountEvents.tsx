import { BlockTimestamp } from "@app/components/common/BlockTimestamp";
import Link from "@app/components/common/Link";
import ScannerLink from "@app/components/common/ScannerLink";
import { shortenAddress } from "@app/util";
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { VStack, HStack, StackProps } from "@chakra-ui/react"

const colors = {
    'DepositBorrow': 'accentTextColor',
    'RepayWithdraw': 'mainTextColor',
    'Borrow': 'info',
    'Deposit': 'success',
    'Withdraw': 'warning',
    'Repay': 'info',
    'Liquidate': 'error',
    'ForceReplenish': 'error',
}

const getActionLabel = (name: string, amount?: number, tokenName?: string) => {
    return <>{name}{amount ? <b style={{ fontWeight: '800' }}>&nbsp;{smartShortNumber(amount, 4, false, true)} {tokenName}</b> : ''}</>
}

const ErrDocLink = (props) => <Link
    isExternal
    target="_blank"
    color="error"
    textDecoration="underline"
    {...props}
/>

const ReplenishDocLink = () => <ErrDocLink
    href="https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights#dbr-recharging"
>
    Learn more
</ErrDocLink>

const LiquidateDocLink = () => <ErrDocLink
    href="https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights#liquidations"
>
    Learn more
</ErrDocLink>

export const FirmAccountEvents = ({
    events,
    account,
    ...props
}: {
    events: any[],
    account: string
} & Partial<StackProps>) => {
    return <VStack w='full' alignItems="flex-start" spacing="0" {...props}>
        {
            events?.map(e => {
                const val = e.amount || e.repaidDebt || e.deficit || e.liquidatorReward;
                const address = e.escrow || e.repayer || e.liquidator || e.replenisher;
                return <VStack
                    key={`${e.blockNumber}-${e.name}`}
                    w='full'
                    alignItems="flex-start"
                    py="2"
                >
                    <HStack w='full' justify="space-between">
                        <ScannerLink
                            color={colors[e.actionName]}
                            fontSize={{ base: '16px', sm: '18px' }}
                            _hover={{ filter: 'brightness(1.2)' }}
                            fontWeight="bold"
                            value={e.txHash}
                            type="tx"
                            textAlign="left"
                            label={<>
                                {getActionLabel(e.name, val, e.tokenName)}{e.isCombined ? <>&nbsp;& {getActionLabel(e.nameCombined, e.amountCombined, e.tokenNameCombined)}</> : ''}
                            </>}
                        />
                        {
                            !!address && address !== account &&
                            <ScannerLink
                                value={address}
                                color={colors[e.actionName]}
                                _hover={{ filter: 'brightness(1.2)' }}
                                label={`by ${shortenAddress(address)}`} />
                        }
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <BlockTimestamp blockNumber={e.blockNumber} timestamp={e.timestamp} direction="row" textProps={{ color: colors[e.actionName] }} />
                        {
                            e.name === 'ForceReplenish' && <ReplenishDocLink />
                        }
                        {
                            e.name === 'Liquidate' && <LiquidateDocLink />
                        }
                    </HStack>
                </VStack>
            })
        }
    </VStack>
}