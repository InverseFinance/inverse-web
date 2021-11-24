import { useState, useEffect } from 'react';
import { getEnsName, namedAddress } from '@inverse/util';

export const useNamedAddress = (address? : string | undefined | null, chainId?: string | number, ensName?: string) => {
  const initial = namedAddress(address||'', chainId, ensName);
  const [name, setName] = useState(initial);

  useEffect(() => {
    const init = async () => {
      if(!address) { return }
      const initial = namedAddress(address||'', chainId, ensName);
      setName(initial);
      if (!ensName) {
        const fetchedEnsName = await getEnsName(address);
        if (fetchedEnsName) {
          setName(fetchedEnsName)
        }
      }
    }
    init();
  }, [address, chainId, ensName])

  return { addressName: name, address };
}
