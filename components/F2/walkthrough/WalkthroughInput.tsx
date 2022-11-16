import { SimpleAmountForm, SimpleAmountFormProps } from "@app/components/common/SimpleAmountForm"

export const WalkthroughInput = (
    props: Partial<SimpleAmountFormProps>
) => {
    return <SimpleAmountForm
        showMaxBtn={false}
        hideInputIfNoAllowance={false}
        hideButtons={true}
        showBalance={true}
        inputProps={{
            autoFocus: true,
            fontSize: { base: '16px', sm: '20px', md: '30px', lg: '40px' },
            // fontSize: { base: '14px', sm: '20px', md: '22px', lg: '24px' },
            py: { base: '20px', md: '30px', lg: '40px' }
        }}
        inputLeftProps={{ fontSize: { base: '14px', md: '18px', lg: '20px' } }}
        {...props}
    />
}