import { HStack } from "@chakra-ui/react"
import { AnimatedInfoTooltip } from "../Tooltip"

export const TextInfo = ({ message, children, color = 'mainTextColor' }) => {
    return <HStack>
        <AnimatedInfoTooltip
            message={message}
            iconProps={{ color, fontSize: '12px' }}
        />
        {children}
    </HStack>
}