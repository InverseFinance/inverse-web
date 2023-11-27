import { isAddress } from 'ethers/lib/utils';
import 'source-map-support'

export default async function handler(req, res) {
  const { method, buyToken, buyAmount, sellToken, sellAmount, slippagePercentage, priceImpactProtectionPercentage } = req.query;
  if(!['price', 'quote'].includes(method) || !isAddress(buyToken) || !isAddress(sellToken)) {
    return res.status(400).json({ msg: 'invalid request' });
  }
  try {
    const cacheDuration = 2;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    let url = `https://api.0x.org/swap/v1/${method}?buyToken=${buyToken}&sellToken=${sellToken}&slippagePercentage=${slippagePercentage}&priceImpactProtectionPercentage=${priceImpactProtectionPercentage}`;
    if(buyAmount){
      url += `&buyAmount=${buyAmount||''}`
    } else {
      url += `&sellAmount=${sellAmount||''}`
    }
    
    const response = await fetch(url, {
      headers: {
        '0x-api-key': process.env.ZEROX_KEY!,
      },
    });
    
    const zeroXresult = await response.json();
    return res.status(response.status).json(zeroXresult);
  } catch (err) {    
    console.error(err);
    return res.status(500).json({ error: true })
  }
}