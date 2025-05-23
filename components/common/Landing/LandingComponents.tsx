import { Text, VStack } from "@chakra-ui/react"
import { SimpleCard } from "../Cards/Simple"
import { lightTheme } from "@app/variables/theme"
import { LandingSubmitButton } from "../Button/RSubmitButton"
import { Link } from "../Link"
import { biggestSize, smallerSize } from "@app/variables/responsive"
import { SubmitButton } from "../Button"

export const landingMainColor = "#040826"
export  const landingMutedColor = "#5A5D78"
export  const landingYellowColor = "#FFF6B6"
export  const landingGreenColor = "#BEF297"
export  const landingDarkNavy2 = "#303454"
export  const landingPurple = "#B69AFF"
export  const landingPurpleText = "#581EF4"

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
        <LandingHeading alignSelf="flex-start" color={landingMainColor} fontSize={'16px'}>{name}</LandingHeading>
    </VStack>
}
