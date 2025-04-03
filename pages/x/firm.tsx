import { SERVER_BASE_URL } from '@app/config/constants';
import F2PAGE from '../firm'
import { F2Market } from '@app/types';

export async function getServerSideProps(context) {
    context.res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=120');
    const [
        marketsData,
        firmTvlData,
        currentCirculatingSupply,
        dbrData,
        dolaPriceData,
    ] = await Promise.all([
        fetch(`${SERVER_BASE_URL}/api/f2/fixed-markets?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/f2/tvl?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola/circulating-supply?cacheFirst=true`).then(res => res.text()),
        fetch(`${SERVER_BASE_URL}/api/dbr?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola-price?cacheFirst=true`).then(res => res.json()),
    ]);
    const dbrPriceUsd = dbrData.priceUsd;
    const dolaPriceUsd = dolaPriceData['dola-usd'] || 1;
    return {
        props: {
            marketsData: marketsData,
            firmTvlData,
            currentCirculatingSupply: parseFloat(currentCirculatingSupply),
            dbrPriceUsd,
            dolaPriceUsd,
         },
    };
}

export const FirmAlertPage = ({
    marketsData,
    firmTvlData,
    currentCirculatingSupply,
    dbrPriceUsd,
    dolaPriceUsd,
}: {
    marketsData: { markets: F2Market[] },
    firmTvlData: any,
    currentCirculatingSupply: number,
    dbrPriceUsd: number,
    dolaPriceUsd: number,
}) => {
    return F2PAGE({ isTwitterAlert: true, marketsData, firmTvlData, currentCirculatingSupply, dbrPriceUsd, dolaPriceUsd });
}

export default FirmAlertPage
