import { SubmitButton } from "@app/components/common/Button"
import { ButtonProps } from "@chakra-ui/react"

export const StepNavBtn = (props: ButtonProps) => {
    return <SubmitButton h={{ base: '40px', md: '50px' }} fontSize={{ base: '16px', md: '20px' }} minW="fit-content" w="150px" {...props} />
}