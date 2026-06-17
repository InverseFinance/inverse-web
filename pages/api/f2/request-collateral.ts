import { ERC20_ABI } from "@app/config/abis";
import { REQ_COL_SIGN_MSG, TOKENS_VIEWER } from "@app/config/constants";
import { NetworkIds } from "@app/types";
import { getBnToNumber } from "@app/util/markets";
import { getGroupedMulticallOutputs, getMulticallOutput } from "@app/util/multicall";
import { getProvider } from "@app/util/providers";
import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { BigNumber, Contract } from "ethers";
import { isAddress, verifyMessage } from "ethers/lib/utils";

const cacheKey = 'collateral-requests-v1.0.2';

export default async function handler(req, res) {
    const {
        method,
    } = req

    const { value, account, symbol, description, decimals, sig } = req.body;
    res.setHeader('Cache-Control', `public, max-age=5`);
    res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
    res.setHeader('Access-Control-Allow-Origin', `*`);
    res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    switch (method) {
        case 'GET':
            const data = await getCacheFromRedis(cacheKey, false) || { requests: [] };
            const provider = getProvider(NetworkIds.mainnet);
            const [balances, invBalances] = await getGroupedMulticallOutputs(
                [
                    data?.requests.map(r => {
                        const contract = new Contract(r.value, ERC20_ABI, provider)
                        return { contract, functionName: 'balanceOf', params: [r.account], forceFallback: !r.value || !r.account || !r.decimals, fallbackValue: 'n/a' }
                    }),
                    data?.requests.map(r => {
                        const contract = new Contract(TOKENS_VIEWER, ["function getAccountTotalInv(address) external view returns (uint256)"], provider)
                        return { contract, functionName: 'getAccountTotalInv', params: [r.account], forceFallback: !r.value || !r.account || !r.decimals, fallbackValue: BigNumber.from('0') }
                    }),
                ],
            )
            const arr = [...data?.requests];

            balances.forEach((b, i) => {
                arr[i].balance = b !== 'n/a' ? getBnToNumber(b, arr[i].decimals) : b;
            });
            invBalances.forEach((b, i) => {
                arr[i].invBalance = getBnToNumber(b);
            });

            res.json({ ...data, requests: arr });
            break
        case 'POST':
            if (!sig || !account || /[^0-9a-z\-]/i.test(symbol) || /[<>/\\{}]/i.test(description) || /(<script|alert\()/i.test(description) || /(\s|^)test(\s|$)/i.test(description) || (!!decimals && isNaN(decimals)) || !isAddress(account) || (!!value && !isAddress(value)) || (!value && !symbol) || description?.length > 500 || value?.length > 50 || symbol?.length > 50) {
                res.status(400).json({ status: 'error', message: 'Invalid values' })
                return
            }
            const sigAddress = verifyMessage(`${REQ_COL_SIGN_MSG}${symbol}\nSubmitted by ${account.toLowerCase()}`, sig).toLowerCase();
            if (!sigAddress || sigAddress.toLowerCase() !== account.toLowerCase()) {
                res.status(400).json({ status: 'error', message: 'Invalid account' })
                return;
            }
            const now = Date.now();
            const yesterday = now - 24 * 60 * 60 * 1000;
            const { requests, timestamp: lastSave } = await getCacheFromRedis(cacheKey, false) || { requests: [] };

            const nbRequestsInLast24h = requests.filter(r => r.timestamp >= yesterday).length;

            if (nbRequestsInLast24h >= 3) {
                res.status(400).json({ status: 'error', message: 'The total number of collateral requests in the last 24h has been reached. Please try again tomorrow.' });
                return;
            }

            const key = `${account.toLowerCase()}-${symbol.toLowerCase()}`;

            if (requests.some(r => r.key === key)) {
                res.status(400).json({ status: 'error', message: 'Already requested!' });
                return
            }

            requests.push({ key, timestamp: now, account, value, symbol, description, decimals });

            await redisSetWithTimestamp(cacheKey, { timestamp: now, requests });
            res.json({ status: 'success' });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}