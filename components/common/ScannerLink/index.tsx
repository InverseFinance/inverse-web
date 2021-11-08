
import useScanner from '@inverse/hooks/useScanner';
import { namedAddress } from '@inverse/util';
import { BLOCK_SCAN } from '@inverse/config/constants';
import { Link } from '@inverse/components/common/Link';

const ScannerLink = ({
	value,
	type = 'address',
	shorten = true,
	children,
	label,
	chainId,
	scanUrl = '',
	useBlockScan = false,
}: {
    scanUrl?: string;
    value?: string;
    label?: string;
    type?: 'address' | 'tx';
    shorten?: boolean;
    useBlockScan?: boolean;
    chainId?: string;
    children?: React.ReactNode | React.ReactNode[];
}
) => {
	const netScanner = useScanner(chainId);
	const scannerUrl = scanUrl || (useBlockScan ? BLOCK_SCAN : netScanner);
	const address = value || children?.toString() || '';
	const content = label || (shorten && (!children || typeof children === 'string') ? namedAddress(address, chainId) : children||value);

	return (
		<Link
            isExternal={true}
			href={`${scannerUrl}/${type}/${address}`}
			target="_blank"
			rel="noreferrer"
			title={address}
            style={{ textDecoration: 'underline' }}
		>
			{content}
		</Link>
	)
};

export default ScannerLink;
