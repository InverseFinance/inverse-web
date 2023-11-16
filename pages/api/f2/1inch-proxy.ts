import { getNetworkConfigConstants } from '@app/util/networks';
import { isAddress } from 'ethers/lib/utils';
import 'source-map-support'

const BASE_URL = 'https://api.1inch.dev/swap/v5.2/1';

const { F2_ALE } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { method, buyToken, buyAmount, sellToken, sellAmount, slippagePercentage } = req.query;
  if (!['swap', 'quote'].includes(method) || !isAddress(buyToken) || !isAddress(sellToken)) {
    return res.status(400).json({ msg: 'invalid request' });
  }
  try {
    const cacheDuration = 2;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    let url = `${BASE_URL}/${method}?dst=${buyToken}&src=${sellToken}&slippage=${5}&disableEstimate=true&from=${F2_ALE}`;
    url += `&amount=${sellAmount || ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_KEY}`,
        'accept': 'application/json',
      },
    });

    const zeroXresult = await response.json();
    return res.status(response.status).json({
      ...zeroXresult,      
      buyAmount: zeroXresult?.toAmount,
      // 1inch router v5
      allowanceTarget: '0x1111111254EEB25477B68fb85Ed929f73A960582',
      data: zeroXresult?.tx?.data,
      gasPrice: zeroXresult?.tx?.gasPrice,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true })
  }
}