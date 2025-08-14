import { Stack, Flex, Image, FlexProps, useDisclosure, HStack, VStack, Text } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { AssetsDropdown } from '../Assets/AssetsDropdown';
import { useEffect, useState } from 'react';

type SimpleDropDownProps = {
    list: { label: string, value?: string, image?: string }[],
    selectedValue?: string,
    handleChange: (v: any) => void,
    dropdownSelectedProps?: FlexProps,
    withSearch?: boolean,
}

export const SimpleAssetDropdown = ({
    list,
    selectedValue,
    handleChange,
    dropdownSelectedProps,
    withSearch = false,
}: SimpleDropDownProps) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [justClosed, setJustClosed] = useState(isOpen)

    useEffect(() => {
        if (!isOpen) { setJustClosed(true) }
        setTimeout(() => setJustClosed(false), 200)
    }, [isOpen])

    const selectedItem = list.find(item => (item.value || item.label) === selectedValue) || list[0];

    return (
        <AssetsDropdown
            isOpen={isOpen}
            onClose={onClose}
            onOpen={() => {
                if (!isOpen && !justClosed) { onOpen() }
            }}
            noPadding
            withSearch={withSearch}
            label={
                <HStack w='full' p="2">
                    {
                        !!selectedItem?.image && <Flex w={5} position="relative">
                            <Image ignoreFallback={true} alt={selectedItem.label} w={5} h={5} src={selectedItem.image} />
                        </Flex>
                    }
                    <Flex minW="80px" fontSize="lg" alignItems="center" fontWeight="semibold" color="secondaryTextColor" justify="space-between" {...dropdownSelectedProps}>
                        {selectedItem?.label} <ChevronDownIcon boxSize={6} mt={0.5} />
                    </Flex>
                </HStack>
            }
        >
            {list.map((item, idx) => {
                return (
                    <VStack
                        key={idx}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'primary.850' }}
                        onClick={() => {
                            handleChange(item);
                            onClose();
                        }}
                        cursor="pointer"
                        alignItems="flex-start"
                    >
                        <Stack direction="row" align="center">
                            {
                                !!item.image && <Flex w={5} position="relative">
                                    <Image w={5} h={5} src={item.image} alt={item.label} />
                                </Flex>
                            }
                            <Flex fontWeight="semibold" align="center" color="secondaryTextColor">
                                {item.label}
                            </Flex>
                        </Stack>
                        {
                            !!item.subtitle && <Text
                                color="mainTextColor"
                                textTransform="capitalize"
                            >
                                {item.subtitle}
                            </Text>
                        }
                    </VStack>
                )
            })}
        </AssetsDropdown>
    )
}