import { useState, useEffect } from 'react';
import { getEnsName, namedAddress, shortenAddress } from '@app/util';

export const useNamedAddress = (address? : string | undefined | null, chainId?: string | number, ensName?: string, priorityToEns = false) => {
  const initial = namedAddress(address||'', chainId, ensName);
  const [name, setName] = useState(initial);

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      if(!address) { return }
      const initial = namedAddress(address||'', chainId, ensName);
      if(!isMounted){ return }
      setName(initial);
      if (!ensName && ((initial !== shortenAddress(address) && priorityToEns) || (initial === shortenAddress(address)))) {
        const fetchedEnsName = await getEnsName(address);
        if (fetchedEnsName) {
          if(!isMounted){ return }
          setName(fetchedEnsName)
        }
      }
    }
    init();
    return () => {
      isMounted = false
    }
  }, [address, chainId, ensName])

  return { addressName: name, address };
}
