import { Input } from '@app/components/common/Input'
import { RadioGridCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { VStack, Text } from '@chakra-ui/react'
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
        <VStack w='full'>
            <Input value={inputValue} defaultValue="12" onChange={(e) => handleChange(e.target.value)} />
            <RadioGridCardGroup
                wrapperProps={{
                    minChildWidth: '90px',
                    spacing: '1',
                    overflow: 'auto',
                    position: 'relative',
                    my: '2',                               
                    w: 'full',
                }}
                group={{
                    name: 'durationType',
                    defaultValue: 'months',
                    value: durationType,
                    onChange: (v: string) => setDurationType(v),
                }}
                radioCardProps={{ w: '90px', fontSize: '14px', textAlign: 'center', px: '2', py: '1', position: 'relative' }}
                options={[
                    { value: 'days', label: 'Days' },
                    { value: 'weeks', label: 'Weeks' },
                    { value: 'months', label: 'Months' },
                    { value: 'quarters', label: 'Quarters' },
                    { value: 'years', label: 'Years' },
                ]}
            />
        </VStack>
    </VStack>
}
