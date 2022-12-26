import { BlockTimestamp } from "@app/components/common/BlockTimestamp";
import ScannerLink from "@app/components/common/ScannerLink";
import { shortenAddress } from "@app/util";
import { shortenNumber } from "@app/util/markets";
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
    return <>{name}{amount ? <b style={{ fontWeight: '800' }}>&nbsp;{shortenNumber(amount, 2, false, true)} {tokenName}</b> : '' }</>
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
                            color={colors[e.actionName]}
                            fontSize={{ base: '16px', sm: '18px' }}
                            _hover={{ filter: 'brightness(1.2)' }}                            
                            fontWeight="bold"
                            value={e.txHash}
                            type="tx"
                            textAlign="left"
                            label={<>
                                {getActionLabel(e.name, val, e.tokenName)}{e.isCombined ?  <>&nbsp;& {getActionLabel(e.nameCombined, e.amountCombined, e.tokenNameCombined)}</> : ''}
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
                    <BlockTimestamp blockNumber={e.blockNumber} direction="row" textProps={{ color: colors[e.actionName] }} />                    
                </VStack>
            })
        }
    </VStack>
}