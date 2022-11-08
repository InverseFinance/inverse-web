import { ButtonProps } from "@chakra-ui/react"
import { SubmitButton } from "."
import { lightTheme } from '@app/variables/theme'

export const RSubmitButton = (props: ButtonProps) => {
    return <SubmitButton borderLeftRadius="50px" borderRightRadius="50px" {...props} />
}

export const LandingSubmitButton = (props: ButtonProps) => {
    return <RSubmitButton boxShadow="none" textTransform="inherit" px="40px" {...props} />
}

export const LandingOutlineButton = (props: ButtonProps) => {
    return <LandingSubmitButton color={lightTheme.colors.mainTextColor} border={`1px solid ${lightTheme.colors.mainTextColor}`} bgColor="white" {...props} />
}