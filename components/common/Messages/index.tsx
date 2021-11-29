import { ReactNode } from 'react';
import { AlertTitle, AlertDescription, Alert, AlertProps, ThemingProps, Flex } from '@chakra-ui/react'
import { InfoAnimIcon, WarningAnimIcon, SuccessAnimIcon, ErrorAnimIcon } from '@inverse/components/common/Animation'
import { WarningIcon } from '@chakra-ui/icons';

type MessageProps = {
    status: AlertProps["status"],
    title?: ReactNode,
    description?: ReactNode,
    icon?: ReactNode,
    variant?: ThemingProps<"Alert">["variant"],
    alertProps?: AlertProps,
}

const statusAnims = {
    info: InfoAnimIcon,
    success: SuccessAnimIcon,
    warning: WarningAnimIcon,
    error: ErrorAnimIcon,
}

const StatusMessage = ({ title, description, status = 'info', alertProps }: Partial<MessageProps>) => {
    const alertPropsExtended = { bgColor: `${status}Alpha`, backdropFilter: "blur(1.5rem)", ...alertProps };
    const IconComp = statusAnims[status];
    return <Message status={status}
        title={title}
        description={description}
        icon={<IconComp boxProps={{ mr: '2' }} />}
        variant="solid"
        {...alertPropsExtended} />
}

export const InfoMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="info" />
export const SuccessMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="success" />
export const WarningMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="warning" />
export const ErrorMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="error" />

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
            <Flex alignItems="center">
                {icon}
                <Flex flexDirection="column">
                    {
                        title ? <AlertTitle>{title}</AlertTitle> : null
                    }
                    {
                        description ? <AlertDescription>{description}</AlertDescription> : null
                    }
                </Flex>
            </Flex>
        </Alert>
    )
}