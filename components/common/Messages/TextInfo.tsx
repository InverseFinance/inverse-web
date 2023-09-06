import { Stack, StackProps } from "@chakra-ui/react"
import { AnimatedInfoTooltip } from "../Tooltip"

export const TextInfo = ({ message, children, color = 'mainTextColor', direction = 'row' }: {
    message: string,
    children: any,
    color?: string,
    direction?: StackProps['direction']
}) => {
    return <Stack direction={direction}>
        <AnimatedInfoTooltip
            message={message}
            iconProps={{ color, fontSize: '12px' }}
        />
        {children}
    </Stack>
}