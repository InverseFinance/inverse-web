import { Stack, StackProps } from "@chakra-ui/react"
import { AnimatedInfoTooltip } from "../Tooltip"

export const TextInfo = ({ message, children, color = 'mainTextColor', direction = 'row', ...props }: {
    message: string,
    children: any,
    color?: string,
    direction?: StackProps['direction']
} & Partial<StackProps>) => {
    return <Stack alignItems="center" direction={direction} {...props}>
        <AnimatedInfoTooltip
            message={message}
            iconProps={{ color, fontSize: '12px' }}
        />
        {children}
    </Stack>
}

export const TextInfoSimple = ({ message, children, color = 'mainTextColor', direction = 'row', ...props }: {
    message: string,
    children: any,
    color?: string,
    direction?: StackProps['direction']
} & Partial<StackProps>) => {
    return <Stack alignItems="center" direction={direction} {...props}>
        <AnimatedInfoTooltip
            message={message}
            iconProps={{ color, fontSize: '12px' }}
        >
            {children}
        </AnimatedInfoTooltip>
    </Stack>
}