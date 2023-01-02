import { FAQ, FAQType } from "@app/components/common/FAQ"
import Link from "@app/components/common/Link"
import { VStack, Text } from "@chakra-ui/react"

export const FirmFAQ = (props: Partial<FAQType>) => {
    return <FAQ
        label="Frequently Asked Questions"
        items={
            [
                {
                    title: 'What is FiRM?',
                    body: <VStack alignItems="flex-start">
                        <Text color="secondaryTextColor">FiRM is a new Fixed-Rate Market for borrowing DOLA using DBR tokens and it is focused on simplicity and safety. All markets are isolated and collateral cannot be borrowed by others.</Text>
                        <iframe style={{ maxWidth: '500px' }} width="100%" height="300px" src="https://www.youtube.com/embed/gAcp1YiuGkg" title="FiRM explainer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </VStack>
                },
                {
                    title: 'How safe is FiRM?',
                    body: `FiRM does not have shared collateral pools like traditional DeFi markets. FiRM uses Personal Collateral Escrows which ensures that deposits are not only isolated per collateral but also per user. FiRM also has flash loan protection and a limited amount of borrowable DOLA per market. FiRM has been audited by Code4arena.`
                },
                {
                    title: 'What is DBR?',
                    body: <VStack alignItems="flex-start">
                        <Text color="secondaryTextColor">
                            DBR is a Borrowing Rights token. Holding it in your wallet gives you the right to borrow the DOLA stablecoin in FiRM.
                        </Text>
                        <Link textDecoration="underline" href="/transparency/dbr">
                            Transparency page
                        </Link>
                    </VStack>
                },
                {
                    title: 'What is DOLA?',
                    body: 'DOLA is a stablecoin pegged to the US Dollar. This means it is designed to be valued as close to $1 as possible with minimal volatility. DOLA is debt-backed rather than algorithmic, meaning that DOLA is backed by retractable debt.',
                },
                {
                    title: 'How much can I borrow with one DBR?',
                    body: `One DBR gives the right to borrow 1 DOLA for 1 year (or 2 DOLA for 6 months, etc). This is assuming you have deposited enough collateral.`
                },
                {
                    title: 'Is DBR an ERC20 token?',
                    body: `Yes but not a standard one: your DBR wallet balance will decrease over time when you have an open loan position.`
                },
                {
                    title: 'How can I get DBR tokens?',
                    body: <VStack alignItems="flex-start">
                        <Text color="secondaryTextColor">
                            Either via the airdrop if you're eligible or on Uniswap / Balancer. In the future an auto-buy DBR feature will be available.
                        </Text>
                    </VStack>
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
                    body: `If you have a DBR deficit and an active loan then someone can top-up your DBR balance, purchasing DBR at a higher price than the current DBR market price. The cost of this forced top-up is added to your debt which can lead to liquidations if left unchecked, so it is recommended that you top up your DBR wallet balance yourself before it runs out.`
                },
                {
                    title: 'Can I borrow DOLA with my INV tokens?',
                    body: `Not at the moment but the INV market will be added soon.`
                },
            ]
        }
        {...props}
    />
}