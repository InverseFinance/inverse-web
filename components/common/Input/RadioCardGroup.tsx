import { useRadio, UseRadioProps, Box, UseRadioGroupProps, useRadioGroup, HStack, BoxProps, StackProps, SimpleGrid, SimpleGridProps } from '@chakra-ui/react'
import { GenericComponent, RadioCardGroupOptions } from '@app/types'
import React from 'react'

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
                    color: 'mainTextColor',
                    borderColor: 'secondary',
                }}
                px={5}
                py={3}
                {...props}
            />
        </Box>
    )
}

export const RadioCardGroup = ({
    options,
    group,
    radioCardProps,
    wrapperProps,
    WrapperComponent = HStack,
}: {
    options: RadioCardGroupOptions,
    group: UseRadioGroupProps,
    radioCardProps?: Partial<BoxProps>,
    wrapperProps?: Partial<StackProps>,
    WrapperComponent?: GenericComponent,
}) => {
    const { getRootProps, getRadioProps } = useRadioGroup(group)

    const groupProps = getRootProps()

    return (
        <WrapperComponent  {...wrapperProps} {...groupProps}>
            {options.map((option, i) => {
                const radioProps = getRadioProps({ value: option.value })
                return (
                    <RadioCard key={i} radioProps={radioProps} {...radioCardProps}>
                        {option.label || option.value}
                    </RadioCard>
                )
            })}
        </WrapperComponent>
    )
}

export const RadioGridCardGroup = (props: {
    options: RadioCardGroupOptions,
    group: UseRadioGroupProps,
    radioCardProps?: Partial<BoxProps>,
    wrapperProps?: Partial<SimpleGridProps>,
}) => {
    return <RadioCardGroup
        {...props}
        WrapperComponent={SimpleGrid}
    />
}