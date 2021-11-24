import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import { AlertMessage } from '@inverse/components/common/Messages/index';

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
                <AlertMessage title={this.props.title} description={this.props.description} />
            </Flex>
        }

        return this.props.children;
    }
}