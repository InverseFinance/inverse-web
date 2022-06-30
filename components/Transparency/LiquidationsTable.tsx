
import { useLiquidations } from '@app/hooks/useLiquidations';
import { shortenNumber } from '@app/util/markets';
import { Flex, Text } from '@chakra-ui/react';
import Table from '@app/components/common//Table';
import { isAddress } from '@ethersproject/address';
import ScannerLink from '@app/components/common//ScannerLink';
import { Timestamp } from '@app/components/common//BlockTimestamp/Timestamp';
import Container from '@app/components/common//Container';
import { UnderlyingItemBlock } from '@app/components/common//Assets/UnderlyingItemBlock';

const fields = [
    'blocktime',
    'txHash',
    'borrower',
    'liquidator',
    'repaidAmount',
    'repaidUnderlying',
    'seizedAmount',
    'seizedUnderlying',
];

const fieldCommonProps = { minW: '150px' };

const FieldValue = ({
    f,
    v,
}: { f: string, v: any }) => {
    if (f === 'blocktime') {
        return <Timestamp timestamp={v * 1000} />
    }
    else if(typeof v === 'object') {
        return <UnderlyingItemBlock symbol={v.symbol} nameAttribute="symbol" />
    }
    else if(f === 'txHash') {
        return <ScannerLink value={v} type="tx" />
    }
    return !!v && isAddress(v) ?
        <ScannerLink value={v} />
        :
        <Text>
            {typeof v === 'number' ? shortenNumber(v, 2) : v}
        </Text>
}

const columns = fields.map(f => {
    return {
        label: f.replace(/(repaid|seized|tx)/i, '$1 ').replace(/underlying/i, 'asset'),
        field: f,
        header: ({ ...props }) => <Flex justify="flex-start" {...fieldCommonProps} {...props} />,
        value: (item) => {
            const v = item[f];
            return <Flex justify="flex-start" {...fieldCommonProps}>
                <FieldValue f={f} v={v} />
            </Flex>
        }

    }
})

export const LiquidationsTable = () => {
    const { liquidations } = useLiquidations();

    return <Container
        label="Last 100 Liquidations on Frontier"
    >
        <Table
            columns={columns}
            items={liquidations}
            keyName="id"
            defaultSort="blocktime"
            defaultSortDir="desc"
        />
    </Container>
}