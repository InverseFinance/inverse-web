import { BlockTimestamp } from "@app/components/common/BlockTimestamp";
import ScannerLink from "@app/components/common/ScannerLink";
import { shortenAddress } from "@app/util";
import { shortenNumber } from "@app/util/markets";
import { VStack, Text, HStack, StackProps } from "@chakra-ui/react"

const colors = {
    'Borrow': 'success',
    'Deposit': 'info',
    'Withdraw': 'warning',
    'Repay': 'secondaryTextColor',
    'Liquidate': 'error',
    'ForceReplenish': 'error',
}

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
                const val = e.amount || e.repaidDebt || e.deficit;
                const address = e.escrow || e.repayer || e.liquidator || e.replenisher;
                return <VStack
                    key={`${e.blockNumber}-${e.name}`}
                    w='full'
                    alignItems="flex-start"                    
                    py="2"
                >
                    <HStack w='full' justify="space-between">
                        <ScannerLink
                            color={colors[e.name]}
                            fontWeight="bold"
                            value={e.txHash}
                            type="tx"
                            textAlign="left"
                            label={`${e.name}${val ? ` ${shortenNumber(val, 2, false, true)} ${e.tokenName}` : ''}`}
                        />
                        {
                            !!address && address !== account &&
                            <ScannerLink
                                value={address}
                                color={colors[e.name]}
                                label={`by ${shortenAddress(address)}`} />
                        }
                    </HStack>
                    <BlockTimestamp blockNumber={e.blockNumber} direction="row" textProps={{ color: colors[e.name] }} />                    
                </VStack>
            })
        }
    </VStack>
}