import { Badge, BadgeProps } from '@chakra-ui/react'

export const NotifBadge = (props: BadgeProps) => {
    return (
        <Badge position="absolute" right="-15px" borderRadius="10px" top="-5px" color="contrastMainTextColor" bgColor="accentTextColor" {...props} />
    )
}