import { FAQ, FAQType } from "@app/components/common/FAQ"
import Link from "@app/components/common/Link"
import { BUY_LINKS } from "@app/config/constants"
import { VStack, Text, TextProps } from "@chakra-ui/react"

const FaqText = (props: TextProps) => <Text color="secondaryTextColor" lineHeight="1.5" {...props} />
const FaqStack = (props: TextProps) => <VStack alignItems="flex-start" spacing="2" {...props} />
const FaqLink = (props: TextProps) => <Link fontWeight="bold" style={{ 'text-decoration-skip-ink': 'none' }} mt="10px" color="mainTextColor" textDecoration="underline" isExternal target="_blank" {...props} />

export const FirmFAQ = (props: Partial<FAQType>) => {
    return <FAQ
        label="Frequently Asked Questions"
        items={
            [
                {
                    title: 'What is FiRM?',
                    body: <FaqStack fontSize={props.smaller ? '14px' : undefined}>
                        <FaqText><b>FiRM</b> is a new <b>Fixed-Rate Market</b> for borrowing DOLA using DBR tokens and it is focused on <b>simplicity and safety</b>.</FaqText>
                        <FaqText>
                            All markets are isolated and collaterals cannot be borrowed by others.
                        </FaqText>
                        <iframe style={{ maxWidth: '500px', marginTop: "10px" }} width="100%" height="300px" src="https://www.youtube.com/embed/gAcp1YiuGkg" title="FiRM explainer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </FaqStack>
                },
                {
                    title: 'How safe is FiRM and is it audited?',
                    body: <FaqStack fontSize={props.smaller ? '14px' : undefined}>
                        <FaqText>
                            <b>FiRM</b> has a <b>high score of 87% on DefiSafety</b> and has <b>several unique safety features</b>.
                        </FaqText>
                        <FaqText>
                            <b>Personal Collateral Escrows</b> ensures that deposits are not only <b>isolated per collateral but also per user</b>.
                        </FaqText>
                        <FaqText>
                            Other safety features: <b>flash loan protection</b>, <b>daily borrowing limits</b> and <b>Pessimistic Price Oracles</b>.
                        </FaqText>
                        <FaqText>
                            <b>Audited by Code4arena and Nomoi.</b>
                        </FaqText>
                        <FaqLink href="https://www.inverse.finance/blog/posts/en-US/an-in-depth-analysis-of-the-security-design-of-firm">
                            Blog Post on safety features
                        </FaqLink>
                        <FaqLink href="https://docs.inverse.finance/inverse-finance/technical/audits">
                            Docs: Audits
                        </FaqLink>
                    </FaqStack>
                },
                {
                    title: 'What is DBR?',
                    body: <FaqStack alignItems="flex-start">
                        <FaqText>
                            DBR is the <b>DOLA Borrowing Rights</b> token, holding it in your wallet gives you the right to borrow the DOLA stablecoin in FiRM.
                        </FaqText>
                        <FaqText>
                            <b>One DBR gives the right to borrow one DOLA for one year</b> (or 2 DOLA for 6 months etc). This is assuming you have deposited enough collateral.
                        </FaqText>
                        <FaqLink href="/transparency/dbr">
                            Transparency page
                        </FaqLink>
                        <FaqLink href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr">
                            Docs: DBR
                        </FaqLink>
                        <iframe style={{ maxWidth: '500px', marginTop: "10px" }} width="100%" height="300px" src="https://www.youtube.com/embed/KcVz1l4VXrM" title="DBR explainer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </FaqStack>
                },
                {
                    title: 'What is DOLA?',
                    body: <FaqStack alignItems="flex-start">
                        <FaqText>
                            DOLA is a <b>debt-backed stablecoin</b> that is pegged to the US Dollar, ensuring minimal volatility and a value close to $1. Contrary to algorithmic stablecoins, DOLA's value is <b>backed by retractable debt</b>.
                        </FaqText>
                        <FaqLink href="/transparency/dola">
                            Transparency page
                        </FaqLink>
                        <FaqLink href="/transparency/bad-debts">
                            DOLA bad debt
                        </FaqLink>
                        <FaqLink href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola">
                            Docs: DOLA
                        </FaqLink>
                        <iframe style={{ maxWidth: '500px', marginTop: "10px" }} width="100%" height="300px" src="https://www.youtube.com/embed/OiOL0xaRdug" title="DOLA explainer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </FaqStack>,
                },
                {
                    title: 'Is DBR an ERC20 token?',
                    body: `Yes but not a standard one: your DBR wallet balance will decrease over time when you have an open loan position.`
                },
                {
                    title: 'How can I get DBR tokens?',
                    body: <FaqStack fontSize={props.smaller ? '14px' : undefined}>
                        <FaqText color="secondaryTextColor">
                            Either via the airdrop if you're eligible, on DEXes, or via the auto-buy DBR feature when borrowing.
                        </FaqText>
                        <FaqLink href={BUY_LINKS.DBR}>
                            Buy DBR
                        </FaqLink>
                        <FaqLink href={'/claim-dbr'}>
                            Check DBR airdrop eligibility
                        </FaqLink>
                    </FaqStack>
                },
                {
                    title: 'Do I need to stake DBR?',
                    body: `No, DBRs should stay in your wallet to pay the fee when you have a loan. Your DBR wallet balance will decrease only if you have a DOLA loan in FiRM.`
                },
                {
                    title: 'Why does my DBR balance decreases?',
                    body: `DBRs are "spent" over time when you have a loan, the rate depends on your amount of debt. If you don't have a loan the balance does not decrease.`
                },
                {
                    title: 'What happens if I run out of DBRs?',
                    body: <FaqStack fontSize={props.smaller ? '14px' : undefined}>
                        <FaqText>
                            In case of a <b>DBR deficit</b> and an active loan, your <b>DBR balance can be force recharged</b> by someone through a <b>costly</b> process called replenishment, which uses a <b>premium price for DBR</b>.
                        </FaqText>
                        <FaqText>
                            <b>This cost is added to your debt</b>, which can result in <b>liquidations</b> if not taken care of.
                        </FaqText>
                        <FaqText>
                            <b>Tip</b>: use the <b>FiRM DBR reminder</b> feature and add the <b>DBR depletion date</b> to your calendar to ensure that you do not forget to buy DBRs before that date.
                        </FaqText>
                        <FaqLink href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr">
                            Docs: Recharging & Liquidations
                        </FaqLink>
                    </FaqStack>
                },
                {
                    title: 'Can I borrow DOLA with my INV tokens?',
                    body: <FaqStack fontSize={props.smaller ? '14px' : undefined}>
                    <FaqText>
                        Yes borrowing DOLA with INV is possible when there's liquidity in the INV market.
                    </FaqText>
                    <FaqLink href="/firm/INV">
                        Stake INV & borrow DOLA
                    </FaqLink>                    
                </FaqStack>
                },
                {
                    title: 'How does INV stakers benefit from FiRM?',
                    body: <FaqStack fontSize={props.smaller ? '14px' : undefined}>
                        <FaqText>
                            When staking INV on FiRM you are protected against dilution and you earn real yield via DBR streaming, the real yield you get is directly linked to FiRM's success as the yearly rewards will increase when borrowing demand increases.
                        </FaqText>
                        <FaqLink href="/firm/INV">
                            Stake INV
                        </FaqLink>
                        <FaqLink href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr">
                            Docs: Real Yield
                        </FaqLink>
                    </FaqStack>
                },
                {
                    title: 'Can I borrow for free?',
                    body: <FaqStack fontSize={props.smaller ? '14px' : undefined}>
                        <FaqText>
                            It's possible to borrow for free (in DBR terms) when you have enough INV staked as the DBR rewards will be higher than the DBR burned for borrowing. There is a calculator to help you with that.
                        </FaqText>
                        <FaqLink href="/firm/INV">
                            Stake INV
                        </FaqLink>
                    </FaqStack>
                },
            ]
        }
        {...props}
    />
}