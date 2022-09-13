import { Input } from '@app/components/common/Input'
import { RadioGridCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { VStack, Text, HStack, Stack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

const multiplicators = {
    'days': 1,
    'weeks': 7,
    'months': 30,
    'quarters': 90,
    'years': 365,
}

export const F2DurationInput = ({
    onChange, showText = true
}: {
    onChange: (v: number) => void,
    showText?: boolean
}) => {
    const [durationType, setDurationType] = useState('months');
    const [inputValue, setInputValue] = useState('12');

    const handleChange = (v: string) => {
        setInputValue(v.replace(/[^0-9.]/gi, ''));
    }

    useEffect(() => {
        if (!inputValue?.trim()) {
            onChange(0)
            return
        }
        const nbDays = multiplicators[durationType] * parseFloat(inputValue);
        onChange(nbDays > 0 && !isNaN(nbDays)  ? nbDays : 0);
    }, [durationType, inputValue]);

    return <VStack w='full' alignItems="flex-start" spacing="40px">
        {showText && <Text fontWeight="bold" fontSize="14px">For <b>how long</b> do you want to <b>lock-in</b> a Fixed Rate?</Text>}
        <Stack direction={{ base: 'column', sm: 'row' }} w='full' spacing="4">
            <Input w={{ base: 'full', sm: '20%', md: '50%' }} value={inputValue} defaultValue="12" onChange={(e) => handleChange(e.target.value)} />
            <RadioGridCardGroup
                wrapperProps={{
                    minChildWidth: { base: '60px', sm: '90px' },
                    spacing: '1',
                    overflow: 'auto',
                    position: 'relative',
                    my: '2',                               
                    w: { base: 'full%', sm: '80%', md: '50%' },
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
