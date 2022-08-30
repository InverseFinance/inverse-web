import { SettingsIcon } from '@chakra-ui/icons'
import { VStack, Text, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb, SliderMark, Popover, PopoverTrigger, PopoverArrow, PopoverContent, PopoverCloseButton, PopoverHeader, PopoverBody, TextProps } from '@chakra-ui/react'

const SliderTick = (props: Partial<TextProps>) => {
    return <Text
        _hover={{ color: 'mainTextColor' }}
        color="secondaryTextColor"
        transition="color 200ms"
        fontSize="sm"
        w="fit-content"
        whiteSpace="nowrap"
        transform="translateX(-50%)"
        cursor="pointer"
        position="absolute"
        {...props} />
}

export const F2DurationSlider = ({
    duration,
    onChange,
}: {
    duration: number,
    onChange: (v: number) => void
}) => {
    return <HStack>
    <Popover placement="bottom-start">
        <PopoverTrigger>
            <SettingsIcon />
        </PopoverTrigger>
        <PopoverContent minW="400px" maxW='98vw' className="blurred-container primary-bg" _focus={{}}>
            <PopoverArrow bg="mainBackgroundColor" />
            <PopoverCloseButton />
            <PopoverHeader>Fixed-Rate loan Duration</PopoverHeader>
            <PopoverBody >
                <VStack w='full' alignItems="flex-start" spacing="40px">
                    <Text fontWeight="bold" fontSize="14px">For how long do you want to lock-in a Fixed Rate?</Text>
                    <VStack w='full' px="8">
                        <Slider
                            value={duration}
                            onChange={onChange}
                            min={1}
                            max={730}
                            step={1}
                            aria-label='slider-ex-4'
                            defaultValue={365}>
                            <SliderMark
                                value={duration}
                                textAlign='center'
                                bg='primary.500'
                                color='white'
                                mt='-45px'
                                borderRadius="50px"
                                transform="translateX(-50%)"
                                w='100px'
                            >
                                {duration} days
                            </SliderMark>
                            <SliderTrack h="15px" bg='primary.100'>
                                <SliderFilledTrack bg={'primary.200'} />
                            </SliderTrack>
                            <SliderThumb h="30px" />
                        </Slider>
                        <HStack py="2" w='full' position="relative">
                            <SliderTick left="0%" onClick={() => setDuration(1)}>1 Day</SliderTick>
                            {/* <SliderTick left="25%" onClick={() => setDuration(180)}>6 Months</SliderTick> */}
                            <SliderTick left="50%" onClick={() => setDuration(365)}>12 Months</SliderTick>
                            {/* <SliderTick left="75%" onClick={() => setDuration(545)}>18 Months</SliderTick> */}
                            <SliderTick left="100%" onClick={() => setDuration(730)}>24 Months</SliderTick>
                        </HStack>
                    </VStack>
                </VStack>
            </PopoverBody>
        </PopoverContent>
    </Popover>
</HStack>
}