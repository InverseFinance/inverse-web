import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle, Flex } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

interface Props {
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return <Flex alignItems="center" justifyContent="center" p="2" w="full" h="full">
                <Alert status="warning" borderRadius="5" display="inline-block" w="fit-content">
                    <WarningIcon mr="2" />
                    {
                        this.props.title ? <AlertTitle>{this.props.title}</AlertTitle> : null
                    }
                    <AlertDescription>
                        {this.props.description || 'An error occured, please try reloading the page'}
                    </AlertDescription>
                </Alert>
            </Flex>
        }

        return this.props.children;
    }
}