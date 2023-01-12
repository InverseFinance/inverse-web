import { SubmitButton } from "@app/components/common/Button"
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { ButtonProps } from "@chakra-ui/react"

export const StepNavBtn = (props: ButtonProps) => {
    return <RSubmitButton
        // px={{ base: '2', sm: '4', md: '6', lg: '6' }}     
        // fontSize={{ base: '12px', sm: '16px', md: '20px' }}
        fontSize={{ base: '12px', sm: '16px' }}
        minW={{ base: "fit-content", sm: '220px' }}
        w={{ base: 'fit-content', sm: "220px" }}
        h={{ base: "50px" }}
        {...props}
    />
}