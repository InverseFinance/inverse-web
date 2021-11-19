import { ReactNode } from 'react';
import { AlertTitle, AlertDescription, Alert, AlertProps, ThemingProps } from '@chakra-ui/react'
import { InfoAnimatedIcon } from '../Animation/InfoAnim'
import { WarningIcon } from '@chakra-ui/icons';

type MessageProps = {
    status: AlertProps["status"],
    title?: ReactNode,
    description?: ReactNode,
    icon?: ReactNode,
    variant?: ThemingProps<"Alert">["variant"],
    alertProps?: AlertProps,
}

export const InfoMessage = ({ title, description, alertProps }: Partial<MessageProps>) => {
    return <Message status="info" title={title} description={description} icon={<InfoAnimatedIcon boxProps={{ mr: '2' }} />} variant="solid" {...alertProps} />
}

export const AlertMessage = ({ title, description, alertProps }: Partial<MessageProps>) => {
    return <Message status="warning" title={title} description={description} icon={<WarningIcon mr="2" />} {...alertProps} />
}

export const Message = ({
    title,
    description,
    status = 'info',
    icon,
    variant,
    ...alertProps
}: MessageProps) => {
    return (
        <Alert variant={variant} status={status} borderRadius="5" display="inline-block" w="fit-content" {...alertProps}>
            {icon}
            {
                title ? <AlertTitle>{title}</AlertTitle> : null
            }
            <AlertDescription>
                {description || 'An error occured, please try reloading the page'}
            </AlertDescription>
        </Alert>
    )
}