import { useEffect, useState } from 'react';
import { NetworkIds } from '@inverse/types';
import { getScanner } from '@inverse/util/web3';

const getChainId = (chainId?: string): string => {
	return chainId || localStorage.getItem('signerChainId') || NetworkIds.mainnet
}

export default function useScanner(chainId?: string): string {
	const [scanner, setScanner] = useState(getScanner(getChainId(chainId)));

	useEffect(() => {
		const scan = getScanner(getChainId(chainId));
		setScanner(scan);
	}, [chainId]);

	return scanner;
}
