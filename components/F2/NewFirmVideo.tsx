import { Divider, VStack, Stack, Text } from "@chakra-ui/react";
import { Link } from "../common/Link";

export const NewFirmVideo = () => {
    return <VStack maxW="1200px" w='full' alignItems="center" spacing="0" px="6" mb="4">
        <VStack w='full' alignItems="center" spacing="3" position="relative" zIndex={1}>
            <Stack direction={{ base: 'column', lg: 'row' }} alignItems="center" spacing="5">
                <VStack w='full' spacing="0" alignItems="center" justifyItems="center" justifyContent="center">
                    <Link
                        fontSize={'18px'}
                        textDecoration="underline"
                        href="https://firm.inverse.finance"
                        isExternal
                        target="_blank"
                        _hover={{ color: 'accentTextColor' }}
                    >Discover the new FiRM app</Link>
                    <Text textAlign="center" fontSize={'16px'} color="mainTextColorLight" lineHeight="normal">
                        A brand new website dedicated to FiRM with improved UI/UX
                    </Text>
                </VStack>
                <video
                    autoPlay={true}
                    muted
                    loop
                    width="400"
                    height="auto"
                    playsInline
                    webkit-playsinline="true"
                    style={{ zIndex: 10, maxWidth: '98%' }}
                >
                    <source src="/assets/new-firm-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </Stack>
        </VStack>
        <Divider pt="4" w='full' maxW="1200px" />
    </VStack>
}