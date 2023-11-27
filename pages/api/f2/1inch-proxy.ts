import { getNetworkConfigConstants } from '@app/util/networks';
import { isAddress } from 'ethers/lib/utils';
import 'source-map-support'

const BASE_URL = 'https://api.1inch.dev/swap/v5.2/1';

const { F2_ALE } = getNetworkConfigConstants();

// default limit is 1 Request Per Sec
const fetch1inchWithRetry = async (
  url: string,
  maxRetries = 40,
  currentRetry = 0,
): Promise<Response | undefined> => {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_KEY}`,
        'accept': 'application/json',
      },
    });
  } catch (e) {

  }

  if (response?.status !== 200 &&  currentRetry < maxRetries) {
      await new Promise((r) => setTimeout(() => r(true), 1050));
      return await fetch1inchWithRetry(url, maxRetries, currentRetry + 1);
  };
  return response;
}

export default async function handler(req, res) {
  const { method, buyToken, buyAmount, sellToken, sellAmount, slippagePercentage, isFullDeleverage } = req.query;
  if (!['swap', 'quote'].includes(method) || !isAddress(buyToken) || !isAddress(sellToken) || (!/^[1-9]+[0-9]*$/.test(sellAmount) && isFullDeleverage !== 'true')) {
    return res.status(400).json({ msg: 'invalid request' });
  }
  try {
    const cacheDuration = 2;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    let url = `${BASE_URL}/${method}?dst=${buyToken}&src=${sellToken}&slippage=${slippagePercentage}&disableEstimate=true&from=${F2_ALE}`;
    url += `&amount=${sellAmount || ''}`;

    const response = await fetch1inchWithRetry(url);
    if(!response) {
      return res.status(500).json({ error: true, msg: 'Failed to fecth swap data, please try again' });
    }

    const responseData = await response?.json();
    return res.status(response.status).json({
      ...responseData,      
      buyAmount: responseData?.toAmount,
      // 1inch router v5
      allowanceTarget: '0x1111111254EEB25477B68fb85Ed929f73A960582',
      data: responseData?.tx?.data,
      gasPrice: responseData?.tx?.gasPrice,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, msg: 'Failed to fecth swap data, please try again' })
  }
}