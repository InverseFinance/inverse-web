import { ButtonProps } from "@chakra-ui/react"
import { SubmitButton } from "."
import { lightTheme } from '@app/variables/theme'

export const RSubmitButton = (props: ButtonProps) => {
    return <SubmitButton borderLeftRadius="50px" borderRightRadius="50px" {...props} />
}

export const LandingSubmitButton = (props: ButtonProps) => {
    return <RSubmitButton px="40px" {...props} />
}

export const LandingOutlineButton = (props: ButtonProps) => {
    return <RSubmitButton color={lightTheme.colors.mainTextColor} border={`1px solid ${lightTheme.colors.mainTextColor}`} bgColor="white" px="40px" {...props} />
}