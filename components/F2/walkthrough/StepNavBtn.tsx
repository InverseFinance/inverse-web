import { SubmitButton } from "@app/components/common/Button"
import { ButtonProps } from "@chakra-ui/react"

export const StepNavBtn = (props: ButtonProps) => {
    return <SubmitButton h="50px" fontSize="20px" minW="fit-content" w="150px" {...props} />
}