
import { useLiquidations } from '@app/hooks/useLiquidations';
import { shortenNumber } from '@app/util/markets';
import { Flex, Text, VStack, Input } from '@chakra-ui/react';
import Table from '@app/components/common//Table';
import { isAddress } from '@ethersproject/address';
import ScannerLink from '@app/components/common//ScannerLink';
import { Timestamp } from '@app/components/common//BlockTimestamp/Timestamp';
import Container from '@app/components/common//Container';
import { UnderlyingItemBlock } from '@app/components/common//Assets/UnderlyingItemBlock';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';
import { useEffect } from 'react';
import { namedAddress } from '@app/util';
import useStorage from '@app/hooks/useStorage';

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
    else if (typeof v === 'object') {
        return <UnderlyingItemBlock symbol={v.symbol} nameAttribute="symbol" />
    }
    else if (f === 'txHash') {
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
        },
    };
})

export const LiquidationsTable = () => {
    const { asPath } = useRouter();
    const borrowerQuery = (asPath?.match(/borrower=([0-9a-zA-Z]{42})/i) || ['', ''])[1];

    const [borrower, setBorrower] = useState('');
    const [chosenBorrower, setChosenBorrower] = useState(borrowerQuery);
    const { liquidations, borrower: queriedBorrower } = useLiquidations(chosenBorrower);
    const { value: seenLiquidations, setter } = useStorage(`${chosenBorrower}-seen-liquidations`);

    useEffect(() => {
        if (borrower || !borrowerQuery) { return };
        setBorrower(borrowerQuery);
    }, [borrowerQuery]);

    useDebouncedEffect(() => {
        if (!borrower || isAddress(borrower)) {
            setChosenBorrower(borrower);
        }
    }, [borrower]);

    useEffect(() => {
        if (!queriedBorrower || !chosenBorrower || !liquidations?.length || chosenBorrower !== queriedBorrower || seenLiquidations === undefined) { return }
        const seen = (seenLiquidations || []);
        const toAddInSeen = liquidations.filter(l => !seen.includes(l.id)).map(l => l.id);
        if (toAddInSeen.length) {
            setter(seen.concat(toAddInSeen));
        }
    }, [liquidations, chosenBorrower, seenLiquidations, queriedBorrower])

    const input = <Input borderColor="secondaryTextColor" mt={{ base: '2', sm: '0' }} type="search" maxW="350px" fontSize="12px" placeholder="Borrower Address"
        value={borrower}
        onChange={(e) => {
            setBorrower(e.target.value)
        }}
    />;

    return <Container
        label={chosenBorrower ? `${namedAddress(chosenBorrower)}'s Liquidations (${liquidations.length})` : 'Last 100 Liquidations on Frontier'}
        description="More Liquidations data on the Analytics page"
        href="/analytics"
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            input
        }
    >
        <VStack
            w="full"
            overflow="auto"
            maxH="50vh"
        >
            <Table
                columns={columns}
                items={liquidations}
                keyName="id"
                defaultSort="blocktime"
                defaultSortDir="desc"
            />
        </VStack>
    </Container>
}