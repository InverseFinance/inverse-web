import { Text, VStack } from "@chakra-ui/react"
import { SimpleCard } from "../Cards/Simple"
import { Link } from "../Link"
import { SubmitButton } from "../Button"

export const landingMainColor = "#040826"
export const landingMutedColor = "#5A5D78"
export const landingYellowColor = "#FFF6B6"
export const landingGreenColor = "#BEF297"
export const landingDarkNavy2 = "#303454"
export const landingPurpleBg = "#B69AFF33"
export const landingPurple = "#B69AFF"
export const landingPurpleText = "#581EF4"
export const landingLightBorderColor = '#E3E3E3';

export const LandingNoisedBtn = ({ children, btnProps, ...props }: { children: React.ReactNode, btnProps?: any, props?: any }) => {
    return <VStack borderRadius="6px" bgColor={landingMainColor} {...props}>
        <LandingBtn w="fit-content" h="50px" minH="50px" fontSize={{ base: '16px', "2xl": '18px' }} px="6" py="2" href="/firm" {...btnProps}>
            {children}
        </LandingBtn>
    </VStack>
}

// export const LandingNoisedBtn = ({ children, btnProps, ...props }: { children: React.ReactNode, btnProps?: any, props?: any }) => {
//     return <VStack borderRadius="6px" bgImage="/assets/landing/noised_shape.png" bgSize="cover" bgRepeat="no-repeat" bgPosition={{ base: 'center', '2xl': '0 20%' }} {...props}>
//         <LandingBtn bgColor="transparent" w="fit-content" h="50px" bg={`linear-gradient(to bottom, ${landingDarkNavy2}cd 10%, ${landingMainColor}ee 95%)`} bgSize="cover" bgRepeat="no-repeat" bgPosition={{ base: 'center', '2xl': '0 20%' }} minH="50px" fontSize={{ base: '16px', "2xl": '18px' }} px="6" py="2" href="/firm" {...btnProps}>
//             {children}
//         </LandingBtn>
//     </VStack>
// }

export const GeistText = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
    return <Text fontFamily="Geist" color={landingMainColor} {...props}>{children}</Text>
}

export const LandingBtn = ({ children, ...props }: { children: React.ReactNode, props?: any }) => <SubmitButton textTransform="inherit" fontFamily="Geist" bgColor={landingMainColor} w={{ base: 'full', sm: 'auto' }} {...props}>{children}</SubmitButton>

export const LandingLink = ({ children, ...props }: { children: React.ReactNode, props?: any }) => <Link _hover={{ color: landingMainColor, textDecoration: 'underline' }} fontFamily="Geist" color={landingMainColor} {...props}>{children}</Link>

export const LandingHeading = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
    return <Text lineHeight="normal" color={"#040826"} className="landing-v3-heading" fontSize="3xl" fontWeight="bold" {...props}>{children}</Text>
}

export const LandingCard = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
    return <SimpleCard boxShadow="0 2px 5px 5px #33333322" borderRadius="2px" py="4" {...props}>{children}</SimpleCard>
}

export const LandingStat = ({ value, name }: { value: number, name: string }) => {
    return <VStack alignItems="flex-start" justifyContent="center" w="full">
        <Text fontFamily="Geist" color={landingMutedColor} fontSize={'16px'}>{name}</Text>
        <Text fontFamily="Geist" color={landingMainColor} fontSize={'16px'} fontWeight="bold">{value}</Text>
    </VStack>
}

export const LandingStatBasic = ({ value, name, ...props }: { value: number, name: string, props?: any }) => {
    return <VStack w='full' px="8" py="4" alignItems="flex-start" {...props}>
        <LandingHeading alignSelf="flex-start" color={landingMainColor} fontSize={'20px'} fontWeight="bold">{value}</LandingHeading>
        <LandingHeading alignSelf="flex-start" color={landingMainColor} fontSize={'16px'} fontWeight="normal">{name}</LandingHeading>
    </VStack>
}

export const LandingStatBasicBig = ({ value, name, ...props }: { value: number, name: string, props?: any }) => {
    return <VStack w='full' px="8" py="4" alignItems="flex-start" {...props}>
        <LandingHeading alignSelf="flex-start" color={landingMainColor} fontSize={'40px'} fontWeight="bold">{value}</LandingHeading>
        <LandingHeading alignSelf="flex-start" color={landingMainColor} fontSize={'16px'} fontWeight="normal">{name}</LandingHeading>
    </VStack>
}
