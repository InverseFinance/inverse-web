import { Input } from '@app/components/common/Input'
import { RadioGridCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { INPUT_BORDER } from '@app/variables/theme'
import { VStack, Text, HStack, Stack, StackProps, NumberInputProps } from '@chakra-ui/react'
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
    'weeks': 7,
    'months': 30,
    'quarters': 90,
    'years': 365,
}

export const F2DurationInput = ({
    onChange, showText = true,
    defaultValue = '12',
    defaultType = 'months',
    isInPopover,
}: {
    onChange: (v: number) => void,
    showText?: boolean
    defaultValue?: string
    defaultType?: 'days' | 'weeks' | 'months' | 'quarters' | 'years'
    isInPopover?: boolean
}) => {
    const [durationType, setDurationType] = useState(defaultType);
    const [inputValue, setInputValue] = useState(defaultValue);

    const handleChange = (v: string) => {
        setInputValue(v.replace(/[^0-9.]/gi, ''));
    }

    useEffect(() => {
        if (!inputValue?.trim()) {
            onChange(0)
            return
        }
        const nbDays = multiplicators[durationType] * parseFloat(inputValue);
        onChange(nbDays > 0 && !isNaN(nbDays) ? nbDays : 0);
    }, [durationType, inputValue]);

    const override = isInPopover ? 'full' : undefined;

    return <VStack w='full' alignItems="flex-start" spacing="2">
        {showText && <Text fontWeight="bold" fontSize="14px">For <b>how long</b> do you want to <b>lock-in</b> a Fixed Rate?</Text>}
        <Stack direction={isInPopover ? 'column' : { base: 'column', sm: 'row' }} w='full' spacing="4">
            <Input w={{ base: 'full', sm: override || '20%', md: override || '50%' }} value={inputValue} defaultValue="12" onChange={(e) => handleChange(e.target.value)} />
            <RadioGridCardGroup
                wrapperProps={{
                    minChildWidth: { base: '60px', sm: '90px' },
                    spacing: '1',
                    overflow: 'auto',
                    position: 'relative',
                    my: '2',
                    w: { base: 'full%', sm: override || '80%', md: override || '50%' },
                }}
                group={{
                    name: 'durationType',
                    defaultValue: 'months',
                    value: durationType,
                    onChange: (v: string) => setDurationType(v),
                }}
                radioCardProps={{ w: { base: '60px', sm: '90px' }, fontSize: { base: '12px', sm: '14px' }, textAlign: 'center', px: { base: '1px', sm: '2px' }, py: '3', position: 'relative' }}
                options={[
                    { value: 'days', label: 'Days' },
                    { value: 'weeks', label: 'Weeks' },
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