import { useRadio, UseRadioProps, Box, UseRadioGroupProps, useRadioGroup, HStack, BoxProps, StackProps } from '@chakra-ui/react'

export const RadioCard = ({ radioProps, ...props }: { radioProps: UseRadioProps } & Partial<BoxProps>) => {
    const { getInputProps, getCheckboxProps } = useRadio(radioProps)

    const input = getInputProps()
    const checkbox = getCheckboxProps()

    return (
        <Box as='label'>
            <input {...input} />
            <Box
                {...checkbox}
                cursor='pointer'
                borderWidth='1px'
                borderRadius='md'
                boxShadow='md'
                borderColor='grey'
                _checked={{
                    bg: 'infoAlpha',
                    color: 'white',
                    borderColor: 'secondary',
                }}
                px={5}
                py={3}
                {...props}
            />
        </Box>
    )
}

type RadioCardGroupOptions = { value: string, label?: React.ReactNode }[];

export const RadioCardGroup = ({
    options,
    group,
    radioCardProps,
    wrapperProps,
}: {
    options: RadioCardGroupOptions,
    group: UseRadioGroupProps,
    radioCardProps?: Partial<BoxProps>,
    wrapperProps?: Partial<StackProps>,
}) => {
    const { getRootProps, getRadioProps } = useRadioGroup(group)

    const groupProps = getRootProps()

    return (
        <HStack {...wrapperProps} {...groupProps}>
            {options.map((option, i) => {
                const radioProps = getRadioProps({ value: option.value })
                return (
                    <RadioCard key={i} radioProps={radioProps} {...radioCardProps}>
                        {option.label || option.value}
                    </RadioCard>
                )
            })}
        </HStack>
    )
}