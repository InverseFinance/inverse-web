
import useScanner from '@app/hooks/useScanner';
import { namedAddress } from '@app/util';
import { BLOCK_SCAN } from '@app/config/constants';
import { Link } from '@app/components/common/Link';
import { LinkProps } from '@chakra-ui/react';

const ScannerLink = ({
	value,
	type = 'address',
	shorten = true,
	children,
	label,
	chainId,
	scanUrl = '',
	useBlockScan = false,
	...props
}: {
	scanUrl?: string;
	value?: string;
	label?: React.ReactNode | React.ReactNode[];
	type?: 'address' | 'tx';
	shorten?: boolean;
	useBlockScan?: boolean;
	chainId?: string;
	children?: React.ReactNode | React.ReactNode[];
} & Partial<LinkProps>
) => {
	const netScanner = useScanner(chainId);
	const scannerUrl = scanUrl || (useBlockScan ? BLOCK_SCAN : netScanner);
	const address = value || children?.toString() || '';
	const content = label || (shorten && (!children || typeof children === 'string') ? namedAddress(address, chainId) : children || value);

	return (
		<Link
			isExternal={true}
			href={`${scannerUrl}/${type}/${address}`}
			target="_blank"
			rel="noreferrer"
			title={address}
			color="white"
			justifyItems="center"
			align="center"
			style={{ textDecoration: 'underline' }}
			{...props}
		>
			{content}
		</Link>
	)
};

export default ScannerLink;
