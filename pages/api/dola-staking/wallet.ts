import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { CHAIN_ID } from '@app/config/constants';
import { getSdolaContract } from '@app/util/dola-staking';
import { getBnToNumber } from '@app/util/markets';
import { isAddress } from 'ethers/lib/utils';
import { getDolaUsdPriceOnCurve } from '@app/util/f2';

export default async function handler(req, res) {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
    res.setHeader('Access-Control-Allow-Origin', `*`);
    res.setHeader('Access-Control-Allow-Methods', `*`);

    const { address } = req.query;
    if (!address || !isAddress(address)) {
        return res.status(400).json({ error: true, message: 'missing or invalid address' })
    }
    try {
        const provider = getProvider(CHAIN_ID);
        const sDolaContract = getSdolaContract(provider);

        const [
            userBalance,
            exRateBn,
            dolaPriceData
        ] = await Promise.all([
            sDolaContract.balanceOf(address),
            sDolaContract.convertToAssets('1000000000000000000'),
            getDolaUsdPriceOnCurve(provider),
        ]);

        const { price: dolaPriceUsd } = dolaPriceData;

        const exRate = getBnToNumber(exRateBn);
        const dolaBalance = getBnToNumber(userBalance) * exRate;
        const accountTvl = dolaBalance * dolaPriceUsd;

        const resultData = {
            timestamp: Date.now(),
            account: address,
            vaultBalance: getBnToNumber(userBalance),
            vaultBalanceInDola: dolaBalance,
            accountTvl,
            dolaPriceUsd,
        }
        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true });
    }
}