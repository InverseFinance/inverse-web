import { CTOKEN_ABI } from '@app/config/abis';
import { useContractEvents } from '@app/hooks/useContractEvents';
import { useMarkets } from '@app/hooks/useMarkets';
import { namedAddress } from '@app/util';
import { getBnToNumber, shortenNumber } from '@app/util/markets';
import { Flex, Text, VStack } from '@chakra-ui/react';
import Table from '../common/Table';

const fields = ['liquidator', 'seizeTokens', 'ctoken', 'repayAmount', 'repaidToken']
const columns = fields.map(f => {
    return {
        label: f,
        field: f,
        header: ({...props}) => <Flex minW="200px" {...props} />,
        value: (item) => {
            const v = item[f];
            return <Text  minW="200px">{typeof v === 'number' ? shortenNumber(v, 2) : v}</Text>
        }

    }
})

export const AccountLiquidations = ({ account }: { account: string }) => {
    const { markets } = useMarkets();
    const anDola = markets.find(m => m.underlying.symbol === 'DOLA');

    const { events } = useContractEvents(
        anDola?.token,
        CTOKEN_ABI,
        'LiquidateBorrow',
        [undefined, undefined],
        false,
        `dola-liquidations-${account}`,
    );

    const accountLiquidations = events
        .filter(e => e.args.borrower.toLowerCase() === account.toLowerCase())
        .map(e => {
            return {
                borrower: namedAddress(e.args.borrower),
                liquidator: namedAddress(e.args.liquidator),
                ctoken: namedAddress(e.args.cTokenCollateral),
                repayAmount: getBnToNumber(e.args.repayAmount),
                seizeTokens: getBnToNumber(e.args.seizeTokens),
                repaidToken: 'DOLA',
            }
        })

    return <VStack w='1200px'>
        <Table
            columns={columns}
            items={accountLiquidations}
        />
    </VStack>
}