import { WarningIcon } from '@chakra-ui/icons';
import { Alert, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { ReactNode } from 'react-markdown';

export const AlertMessage = ({ title, description }: { title?: ReactNode, description?: ReactNode }) => {
    return (
        <Alert status="warning" borderRadius="5" display="inline-block" w="fit-content">
            <WarningIcon mr="2" />
            {
                title ? <AlertTitle>{title}</AlertTitle> : null
            }
            <AlertDescription>
                {description || 'An error occured, please try reloading the page'}
            </AlertDescription>
        </Alert>
    )
}