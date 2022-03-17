import { ReactNode, useEffect, useState } from 'react';
import { AlertTitle, AlertDescription, Alert, AlertProps, ThemingProps, Flex, useMediaQuery, AlertDescriptionProps, AlertTitleProps } from '@chakra-ui/react'
import { InfoAnimIcon, WarningAnimIcon, SuccessAnimIcon, ErrorAnimIcon } from '@app/components/common/Animation'
import { WarningIcon } from '@chakra-ui/icons';

type MessageProps = {
    status: AlertProps["status"],
    title?: ReactNode,
    description?: ReactNode,
    icon?: ReactNode,
    variant?: ThemingProps<"Alert">["variant"],
    alertProps?: AlertProps,
    alertTitleProps?: AlertTitleProps,
    alertDescriptionProps?: AlertDescriptionProps,
    showIcon?: boolean,
    iconStatus?: 'info' | 'success' | 'warning' | 'error' | 'danger',
}

const statusAnims = {
    info: InfoAnimIcon,
    success: SuccessAnimIcon,
    warning: WarningAnimIcon,
    error: ErrorAnimIcon,
    danger: WarningAnimIcon,
}

export const StatusMessage = ({ title, description, status = 'info', iconStatus ,showIcon, alertProps, alertDescriptionProps, alertTitleProps }: Partial<MessageProps>) => {
    const alertPropsExtended = {
        className: `blurred-container ${status}-bg compat-mode`,
        ...alertProps,
    };
    const IconComp = statusAnims[iconStatus || status];
    return <Message status={status}
        title={title}
        showIcon={showIcon}
        description={description}
        icon={<IconComp boxProps={{ mr: '2' }} />}
        variant="solid"
        alertTitleProps={alertTitleProps}
        alertDescriptionProps={alertDescriptionProps}
        {...alertPropsExtended}
    />
}

export const ShrinkableInfoMessage = (props: Partial<MessageProps>) => {
    const [isSmallerThan] = useMediaQuery('(max-width: 378px)')
    const [showIcon, setShowIcon] = useState(false)

    useEffect(() => setShowIcon(!isSmallerThan), [isSmallerThan])

    return <StatusMessage
        alertProps={{ w: 'full' }}
        alertTitleProps={{ fontSize: '12px' }}
        alertDescriptionProps={{ fontSize: showIcon ? '12px' : '10px' }}
        {...props}
        status="info"
        showIcon={showIcon}
    />
}
export const InfoMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="info" />
export const SuccessMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="success" />
export const WarningMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="warning" />
export const ErrorMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="error" />
export const DangerMessage = (props: Partial<MessageProps>) => <StatusMessage {...props} status="error" iconStatus="warning" />

export const AlertMessage = ({ title, description, alertProps }: Partial<MessageProps>) => {
    return <Message status="warning" title={title} description={description} icon={<WarningIcon mr="2" />} {...alertProps} />
}

export const Message = ({
    title,
    description,
    status = 'info',
    icon,
    variant,
    showIcon = true,
    alertTitleProps,
    alertDescriptionProps,
    ...alertProps
}: MessageProps) => {
    return (
        <Alert variant={variant} status={status} borderRadius="5" display="inline-block" w="fit-content" {...alertProps}>
            <Flex alignItems="center" w='full'>
                {showIcon && icon}
                <Flex flexDirection="column" w='full'>
                    {
                        title ? <AlertTitle {...alertTitleProps}>{title}</AlertTitle> : null
                    }
                    {
                        description ? <AlertDescription {...alertDescriptionProps}>{description}</AlertDescription> : null
                    }
                </Flex>
            </Flex>
        </Alert>
    )
}