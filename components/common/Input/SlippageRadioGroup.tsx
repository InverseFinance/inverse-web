import { RadioCardGroupOptions } from '@inverse/types'
import { RadioCardGroup } from '@inverse/components/common/Input/RadioCardGroup';

const defaultSlippageOptions: RadioCardGroupOptions = [
    { value: '0.5', label: '0.5%' },
    { value: '1', label: '1%' },
    { value: '3', label: '3%' },
    { value: '5', label: '5%' },
];

export const SlippageRadioGroup = ({
    defaultValue = '1',
    onChange,
    slippageOptions = defaultSlippageOptions,
}: {
    defaultValue?: string,
    onChange: (v: string) => void,
    slippageOptions?: RadioCardGroupOptions,
}) => {
    return (
        <RadioCardGroup
            wrapperProps={{ w: 'full', alignItems: 'center', justify: 'center' }}
            group={{
                name: 'slippage',
                defaultValue: defaultValue,
                onChange: onChange,
            }}
            radioCardProps={{
                p: 1,
                mx: '2px',
                minW: '40px',
                textAlign: 'center',
                fontSize: '12px',
                _checked: {
                    bg: 'infoAlpha',
                    color: 'white',
                    borderColor: 'secondaryAlpha',
                }
            }}
            options={slippageOptions}

        />
    )
}