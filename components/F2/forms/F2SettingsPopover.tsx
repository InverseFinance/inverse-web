import { SettingsIcon } from '@chakra-ui/icons'
import { HStack, Popover, PopoverTrigger, PopoverArrow, PopoverContent, PopoverCloseButton, PopoverHeader, PopoverBody, Button } from '@chakra-ui/react'
import { F2DurationInput } from './F2DurationInput'

export const F2SettingsPopover = ({    
    onDurationChange,
}: {    
    onDurationChange: (v: number) => void
}) => {
    return <HStack>
        <Popover placement="bottom-start">
            <PopoverTrigger>
                <Button _active={{ bg: 'transparent' }} _focus={{ bg: 'transparent' }} _hover={{}} bg="transparent">
                    <SettingsIcon cursor="pointer" />
                </Button>
            </PopoverTrigger>
            <PopoverContent minW={{ base: '400px', lg: '500px' }} maxW='98vw' className="blurred-container primary-bg" _focus={{}}>
                <PopoverArrow bg="mainBackgroundColor" />
                <PopoverCloseButton />
                <PopoverHeader>Fixed-Rate loan Duration</PopoverHeader>
                <PopoverBody >
                    <F2DurationInput isInPopover={true} onChange={onDurationChange} />
                </PopoverBody>
            </PopoverContent>
        </Popover>
    </HStack>
}