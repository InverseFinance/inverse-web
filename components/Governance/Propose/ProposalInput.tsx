import { InputProps } from '@chakra-ui/react';
import { Input } from '@app/components/common/Input';

export const ProposalInput = ({ ...props }: InputProps) => <Input textAlign="left" fontSize="12" {...props} />;