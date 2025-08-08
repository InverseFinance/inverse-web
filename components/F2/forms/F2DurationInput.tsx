import { Input } from '@app/components/common/Input'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { useAppThemeParams } from '@app/hooks/useAppTheme'
import { VStack, Text, Stack, NumberInputProps, InputProps } from '@chakra-ui/react'
import {
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'

const multiplicators = {
    'days': 1,
    // 'weeks': 7,
    'months': 30,
    // 'quarters': 90,
    'years': 365,
}

export const F2DurationInput = ({
    onChange,
    defaultValue = '12',
    defaultType = 'months',
    columnMode,
    inputProps,
}: {
    onChange: (v: number, typedValue: number, type: string) => void,
    defaultValue?: string
    defaultType?: 'days' | 'weeks' | 'months' | 'quarters' | 'years'
    columnMode?: boolean
    inputProps?: InputProps
}) => {
    const [durationType, setDurationType] = useState(defaultType);
    const [inputValue, setInputValue] = useState(defaultValue);
    const { INPUT_BORDER } = useAppThemeParams();

    const handleChange = (v: string) => {
        setInputValue(v.replace(/[^0-9.]/gi, ''));
    }

    useEffect(() => {
        if (!inputValue?.toString().trim()) {
            onChange(0, inputValue, durationType);
            return
        }
        const value = parseFloat(inputValue);
        const isTwelveMonthsModulo = durationType === 'months' && (value % 12 === 0);
        const nbDays = isTwelveMonthsModulo ? 0 : multiplicators[durationType] * value;
        onChange(nbDays > 0 && !isNaN(nbDays) ? nbDays : value/12 * 365, inputValue, durationType);
    }, [durationType, inputValue]);

    const override = columnMode ? 'full' : undefined;

    return <VStack w='full' alignItems="flex-start" spacing="2">        
        <Stack direction={columnMode ? 'column' : { base: 'column', sm: 'row' }} w='full' spacing="4">
            <Input py="0" h='48px' borderWidth='1' border={INPUT_BORDER} w={{ base: 'full', sm: override || '50%' }} value={inputValue} defaultValue="12" onChange={(e) => handleChange(e.target.value)} {...inputProps} />
            <RadioCardGroup
                wrapperProps={{
                    w: { base: 'full', sm : '50%' },
                    justify: 'space-between',
                    display: 'flex',
                    color: 'mainTextColor',
                }}
                group={{
                    name: 'durationType',
                    defaultValue: 'months',
                    value: durationType,
                    onChange: (v: string) => setDurationType(v),
                }}
                radioCardProps={{ h: '48px', mt: { base: '2', sm: '0' }, w: { base: '60px', sm: '80px' }, fontSize: { base: '13px', sm: '14px' }, textAlign: 'center', px: { base: '1px', sm: '2px' }, position: 'relative', display: { base: 'inline-block', sm: 'block' } }}
                options={[
                    { value: 'days', label: 'Days' },
                    // { value: 'weeks', label: 'Weeks' },
                    { value: 'months', label: 'Months' },
                    // { value: 'quarters', label: 'Quarters' },
                    { value: 'years', label: 'Years' },
                ]}
            />
        </Stack>
    </VStack>
}

const DurationNumber = ({
    label,
    ...props
}: { label: string } & Partial<NumberInputProps>) => {
    const { INPUT_BORDER } = useAppThemeParams();
    return <VStack position="relative">
        <Text color="mainTextColor" fontWeight="bold" fontSize="18px" zIndex="1" position="absolute" right="35px" top="15px">{label}</Text>
        <NumberInput
            bgColor="primary.850"
            outline="none"
            border={INPUT_BORDER}
            borderRadius="5px"
            _focus={{ outline: 'none' }}
            defaultValue={1}
            min={0}
            max={99}
            step={1}
            precision={0}
            {...props}
            >
            <NumberInputField
                // _focus={{ outline: 'none' }}
                fontSize="24px"
                fontWeight="500"
                outline="none"
                border="none"
            />
            <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
            </NumberInputStepper>
        </NumberInput>
    </VStack>
}

export const F2DurationMultiInput = ({
    onChange,
}: {
    onChange: (v: number) => void
}) => {
    const [values, setValues] = useState({ years: '0', months: '0', days: '0' });
    const handleChange = (v, key) => {
        const newValues = { ...values, [key]: v }
        setValues(newValues);
        onChange(parseInt(newValues.years) * 365 + parseInt(newValues.months) * 30 + parseInt(newValues.days))
    }

    return <Stack direction={{ base: 'column', md: 'row' }}>
        <DurationNumber defaultValue={1} min={0} max={99} label="Years" onChange={(v) => handleChange(v, 'years')} />
        <DurationNumber defaultValue={0} min={0} max={999} label="Months" onChange={(v) => handleChange(v, 'months')} />
        <DurationNumber defaultValue={0} min={0} max={9999} label="Days" onChange={(v) => handleChange(v, 'days')} />       
    </Stack>
}