import { FAQ, FAQType } from "@app/components/common/FAQ"

export const FirmFAQ = (props: Partial<FAQType>) => {
    return <FAQ
        label="Frequently Asked Questions"
        items={
            [
                {
                    title: 'What is FiRM?',
                    body: `FiRM is a new Fixed-Rate Market for borrowing DOLA thanks to DBR tokens and is focused on simplicity and safety. All markets are isolated and collaterals cannot be borrowed by others.`
                },
                {
                    title: 'What is DBR?',
                    body: `DBR is a token that serves as a Borrowing Right for the DOLA stablecoin`
                },
                {
                    title: 'How much can I borrow with one DBR?',
                    body: `One DBR gives the right to borrow one DOLA for year (or 2 DOLA for 6 months, etc). This is assuming you have enough collateral deposited.`
                },
                {
                    title: 'Is DBR an ERC20 token?',
                    body: `Yes but not a standard one: the balance decreases over time when having a loan`
                },
                {
                    title: 'How can I get DBR tokens?',
                    body: `You can get DBRs automatically when using the auto-buy or walkthrough feature, DBRs are also available on uniswap.`
                },
                {
                    title: 'Do I need to stake DBR?',
                    body: `No, DBRs should stay in your wallet when you have a loan`
                },
                {
                    title: 'Why does my DBR balance decreases?',
                    body: `DBRs are "burned" over time when you have a loan, the burn rate depends on your amount of debt. If you don't have a loan balance does not decrease.`
                },
                {
                    title: 'What happens if I run out of DBRs?',
                    body: `If you have a DBR deficit and an active loan then someone can top-up your DBR balance with a higher price than the DBR market price, the cost of this forced top-up is added to your debt which can lead to liquidations if too high, so it is recommended that you top-up DBR yourself.`
                },
            ]
        }
        {...props}
    />
}