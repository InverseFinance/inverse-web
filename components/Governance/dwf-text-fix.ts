export const DWFtextFix = `*Original forum post, Risk Working Group, and current DWF proposal here: https://forum.inverse.finance/t/proposal-to-add-dwf-labs-as-market-maker-for-inverse-finance/185* 

**Summary**

Swap $1MM in INV tokens to DWF Labs at 15% discount with all proceeds dedicated to reducing outstanding DOLA bad debt.

**General Background**

Current DOLA bad debt is approximately $9.5MM which we began reducing in June 2022 while we continue to explore ways to accelerate the reduction in order to more rapidly scale DOLA lending on FiRM and on partner protocols. One mechanism for accomplishing this reduction is via strategic investors who can not only help reduce DOLA bad debt but also help us expand revenues and accrue additional value to INV holders.

One category of strategic partner that has to-date remained uncovered is market makers. Most readers of this proposal will recognize this term but for those unfamiliar, here is an overview 1. Since INV was listed on Coinbase in early 2022, volatility in the price of INV can be attributed in part to the relatively thin liquidity supporting INV on both decentralized and centralized exchanges. We recognized early on the value of a third-party market maker to help reduce volatility and also to assist us in securing new CEX listings and began discussion with two well known names in the industry. However, the April 2022 oracle price manipulation combined with other crypto market downdrafts like UST put a pause on those conversations. Note that both of those firms sought a loan of a significant number of INV tokens in order to perform INV market-making operations, in addition to other terms.

Separately, we have been approached by many low- and mid-tier CEX partners over the past year and we have resisted using DAO treasury funds to pay CEX listing fees, instead investing capital in new product development, risk management, and liquidity operations. This remains our position today.

This proposal summarizes an opportunity to partner with a relatively new market maker, DWF Labs, to both provide market-making services for INV and also to help us make a material reduction in bad DOLA debt.

**Background on DWF Labs**

- Home: https://www.dwf-labs.com/
- Crunchbase: https://www.crunchbase.com/organization/dwf-labs
- Founder interview: Andrei Grachev, Managing Partner at DWF Labs, Expounds on why they’re Choosing to Double Down on Crypto Innovations Despite the Bear Market https://bit.ly/3CEuYqs

DWF primarily focuses on market-making operations and claims a large number of clients, though they have been recently active in making taking ownership positions in individual token projects per this link on Defillama: https://defillama.com/raises/dwf-labs

**Notes:**

- $15MM pledge to the Binance Industry Recovery Initiative Blockchain Reporter on Binance Feed: DWF Labs Allocates $15M to Support Distressed Protocols Through Binance Labs’ Web3 Industry Recovery Initiative | https://www.binance.com/en/feed/post/96278 

- Success in market making for TONcoin: "DWF Labs has announced that they will provide $10 million to help support the expanding TON ecosystem. In addition, there will be a total of 50 seed investments made throughout the course of the following twelve months. Each investment is made with the intention of hastening the expansion of TON and the projects it oversees."  "In addition, DWF Labs plans to boost the amount of TONcoin transactions across all supporting platforms in order to attract a larger number of players in the TON ecosystem. At the moment, the daily trade volume for TONcoin might reach up to $20 million."  https://bit.ly/3w2xVgN 

- While DWF is a new/newer name in market making, the nature of their proposed relationship (owning INV vs borrowing) and their willingness to work with Inverse in a market where others have paused their new clients makes market making with DWF an attractive option for the DAO.

**Team**

- Team is doxxed https://www.dwf-labs.com/about 
- Founder/MD formerly ran Huobi Russia, BD contact we are working with previously did BD for Okex. A reference customer we know believes their CEX credentials are good and they can be expected to show results.
- Global footprint

**Proposal**

DWF proposes a cash swap of INV over a period of up to 140 days at a 15% discount. This is distinct from prior conversations with MM’s, including Wintermute, who proposed a loan of INV tokens for 12 months in addition to other terms. See forum post https://bit.ly/3QzZIP6 for additional details about the proposal from DWF.

**Some notes on their proposal:**

- DWF may delay some daily swaps if price spikes higher
- DWF initially proposes to make CEX markets for INV on Coinbase and Gate.io.

**Benefits for Inverse**

- Reduced volatility on multiple DEX’s and CEX’s due to deeper INV liquidity and ongoing market making operations
- Good likelihood of INV being added to multiple new Tier 1 and Tier 2 CEX’s. While DWF is providing no assurance of a Binance listing, they are a leading market maker on Binance Futures and participate in the Binance Industry Recovery Initiative, which we believe will be a net positive towards that objective.
- Potential for sufficiently high trading volumes that result in qualification for Chainlink oracle for INV
- $1MM reduction in DOLA bad debt
- Potential introductions to other DWF partners, investors

**Risks**

Full risk assessment provided by the Risk Working Group is here: Risk Assessment of DWF Labs - https://bit.ly/3X6k2KH 

- DWF proposes to swap INV in $10K increments over a 140-day period. DWF could pause swapping at any time before Day 140 and not complete its $1MM swap commitment.

- Unlike MM’s who borrow a DAO’s governance tokens for MM ops, DWF is taking actual ownership of INV tokens and there are no provisions for Inverse Finance to reclaim those sold INV once the sale is complete. Thus there is a risk that DWF could, after realizing a sufficient profit, swap some or all of its INV inventory back into the market, thus requiring us to seek out new MM partner(s). We see reputational risk for DWF in such a move that outweighs the benefits to DWF.

- If DWF pauses its MM activities and chooses to exercise governance rights, it would become one of the largest holders of voting INV within the DAO.

**On-Chain Actions**

1. Initiate swap contract to go live on Sunday the 28th of January 23:59:59 GMT
With
- A run time of 140 days
- A daily swap limit of 10,000 USDC
- A life time swap limit of 1,000,000 USDC
- A bonus of 15% Inverse token per swap, compared to the Balancer market price
- A minimum price per Inverse token of 45, set in USDC terms

2. Add DWF Labs address (0xD4B69e8D62C880E9DD55d419d5E07435C3538342) to whitelist

3. Mint 10,000 INV tokens

4. Fund Swap contract with 10,000 Inverse Tokens
`