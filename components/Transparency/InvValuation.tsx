import { HStack, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { BigTextLoader } from '@app/components/common/Loaders/BigTextLoader'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { useCacheFirstSWR } from '@app/hooks/useCustomSWR'
import { smartShortNumber } from '@app/util/markets'
import { fetcher60sectimeout } from '@app/util/web3'

// only meaningful for P/S and P/B: under 1x the market values INV below a year of revenue / its treasury.
// size ratios like mkt.cap/TVL sit far below 1x for any lending protocol, so highlighting them says nothing.
const RATIO_CHEAP_BELOW = 1;

const formatMultiple = (value?: number | null) => {
    return typeof value === 'number' && isFinite(value) ? `${smartShortNumber(value, 2)}x` : '-';
}

const MetricCard = ({
    label,
    value,
    subLabel,
    tooltip,
    isLoading,
    isHighlighted = false,
    color = undefined,
}: {
    label: string,
    value: string,
    subLabel?: string,
    tooltip: string,
    isLoading?: boolean,
    isHighlighted?: boolean,
    color?: string,
}) => {
    return <DashBoardCard
        minH="140px"
        p="5"
        alignItems="flex-start"
        borderColor={isHighlighted ? 'accentTextColor' : undefined}
        borderWidth={isHighlighted ? '1px' : undefined}
    >
        <VStack spacing="1" alignItems="flex-start" w='full'>
            <HStack spacing="1" alignItems="center">
                <Text fontSize="14px" fontWeight="bold" color="mainTextColorLight">{label}</Text>
                <AnimatedInfoTooltip size="small" message={tooltip} />
            </HStack>
            {
                isLoading ? <BigTextLoader /> : <Text
                    className="heading-font"
                    fontWeight="extrabold"
                    fontSize={{ base: '26px', '2xl': '32px' }}
                    color={color || 'mainTextColor'}
                >
                    {value}
                </Text>
            }
            {!!subLabel && !isLoading && <Text fontSize="12px" color="mainTextColorLight">{subLabel}</Text>}
        </VStack>
    </DashBoardCard>
}

export const InvValuation = () => {
    const { data, isLoading } = useCacheFirstSWR('/api/inv/valuation', fetcher60sectimeout);

    const price = data?.price;
    const marketCap = data?.marketCap;
    const fdv = data?.fdv;
    const ratios = data?.ratios;
    const revenue = data?.revenue;
    const bookValue = data?.bookValue;
    const protocolData = data?.protocol;

    const usd = (v?: number | null, precision = 2) => typeof v === 'number' ? smartShortNumber(v, precision, true) : '-';

    const ratioColor = (v?: number | null) => {
        if (typeof v !== 'number' || !isFinite(v)) { return undefined }
        return v < RATIO_CHEAP_BELOW ? 'success' : undefined;
    }

    const valuationMetrics = [
        {
            label: 'Price / Sales',
            value: formatMultiple(ratios?.priceToSales?.runRate),
            subLabel: `Run-rate revenue: ${usd(revenue?.annualizedRunRate)}/yr`,
            color: ratioColor(ratios?.priceToSales?.runRate),
            tooltip: 'Market cap divided by annualized run-rate revenue (FiRM borrows x DBR price, plus trailing Fed income). Every DOLA borrowed consumes 1 DBR per year, so this is the forward-looking revenue at current borrow levels.',
            isHighlighted: true,
        },
        {
            label: 'Price / Book',
            value: formatMultiple(ratios?.priceToBook?.total),
            subLabel: `Book value: ${usd(bookValue?.total)}`,
            color: ratioColor(ratios?.priceToBook?.total),
            tooltip: 'Market cap divided by the DAO treasury holdings (treasury contract + multisigs + leftover Frontier reserves). Gross assets, not net of liabilities such as payroll or bad debt.',
            isHighlighted: true,
        },
        {
            label: 'Mkt. Cap / TVL',
            value: formatMultiple(ratios?.marketCapToTvl),
            subLabel: `FiRM TVL: ${usd(protocolData?.firmTvl)}`,
            tooltip: 'Market cap divided by the total value of collateral deposited in FiRM.',
            isHighlighted: true,
        },
        {
            label: 'Mkt. Cap / Borrows',
            value: formatMultiple(ratios?.marketCapToBorrows),
            subLabel: `FiRM borrows: ${usd(protocolData?.firmBorrows)}`,
            tooltip: 'Market cap divided by total DOLA borrowed on FiRM, the revenue-generating side of the protocol.',
        },
        {
            label: 'Mkt. Cap / DOLA Supply',
            value: formatMultiple(ratios?.marketCapToDolaCirculatingSupply),
            subLabel: `DOLA circ. supply: ${usd(protocolData?.dolaCirculatingSupply)}`,
            tooltip: 'Market cap divided by the circulating supply of DOLA.',
        },
    ];

    const secondaryMetrics = [
        {
            label: 'INV Price',
            value: usd(price, 4),
            subLabel: `Book value / INV: ${usd(bookValue?.perToken)}`,
            tooltip: 'Current INV price versus the treasury holdings backing each circulating INV.',
        },
        {
            label: 'Market Cap',
            value: usd(marketCap),
            subLabel: `FDV: ${usd(fdv)}`,
            tooltip: 'Circulating supply times price. FDV uses the total INV supply instead.',
        },
        {
            label: 'Revenue (365d)',
            value: usd(revenue?.trailing365d),
            subLabel: `P/S on trailing: ${formatMultiple(ratios?.priceToSales?.trailing365d)}`,
            tooltip: 'DBR burned over the last 365 days, each day valued at that day\'s DBR price, plus Fed income realized by the DAO. DBR is burned in lumps rather than continuously, so shorter windows are noisy.',
        },
        {
            label: 'Revenue Yield',
            value: typeof ratios?.revenueYield === 'number' ? `${smartShortNumber(ratios.revenueYield * 100, 1)}%` : '-',
            subLabel: `Revenue / INV: ${usd(ratios?.revenuePerToken)}/yr`,
            tooltip: 'Run-rate revenue as a percentage of market cap, the inverse of Price / Sales.',
        },
    ];

    return <Container
        noPadding
        p="0"
        label="INV Valuation Metrics"
        description="How the market prices INV against the protocol's revenue, treasury and size - see the raw data"
        href="/api/inv/valuation"
        contentProps={{ maxW: '94vw' }}
    >
        <VStack spacing="6" w='full' alignItems="flex-start">
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4" w='full'>
                {valuationMetrics.map(m => <MetricCard key={m.label} isLoading={isLoading} {...m} />)}
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing="4" w='full'>
                {secondaryMetrics.map(m => <MetricCard key={m.label} isLoading={isLoading} {...m} />)}
            </SimpleGrid>
            <Stack w='full' pt="2">
                <Text fontSize="12px" color="mainTextColorLight">
                    Book value is gross of liabilities. Price / Sales uses run-rate revenue as DBR burns are recognized in lumps, making short trailing windows unreliable.
                </Text>
            </Stack>
        </VStack>
    </Container>
}
