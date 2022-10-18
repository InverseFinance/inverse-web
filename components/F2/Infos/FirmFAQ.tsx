import { FAQ } from "@app/components/common/FAQ"

export const FirmFAQ = () => {

    return <FAQ
        label="FiRM FAQ"
        items={
            [
                {
                    title: 'What is FiRM?',
                    body: `FiRM is a new Fixed-Rate Market for borrowing DOLAn thanks to DBR tokens`
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
            ]
        }
    />
}