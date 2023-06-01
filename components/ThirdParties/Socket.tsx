import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";

import dynamic from 'next/dynamic';
import { WidgetProps } from "@socket.tech/plugin";

const DynamicComponent = dynamic(() =>
    import('@socket.tech/plugin').then((mod) => mod.Bridge), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

function SocketBridge({
    defaultSourceNetwork,
    defaultDestNetwork,
    enableSameChainSwaps = true,
    defaultSourceToken,
    defaultDestToken,
}: Partial<WidgetProps>) {
    const [enable, setEnable] = useState(false)
    const { library } = useWeb3React<Web3Provider>();

    useEffect(() => {
        setEnable(true)
    }, []);

    if (!library || !enable) return null;

    return <DynamicComponent
        provider={library}
        API_KEY={process.env.NEXT_PUBLIC_SOCKET_API_KEY!}
        sourceNetworks={[1, 10, 137, 56, 43114, 250]}
        destNetworks={[1, 10, 137, 56, 43114, 250]}
        defaultSourceNetwork={defaultSourceNetwork}
        defaultDestNetwork={defaultDestNetwork}
        enableSameChainSwaps={enableSameChainSwaps}
        defaultSourceToken={defaultSourceToken}
        defaultDestToken={defaultDestToken}
    />
}

export default SocketBridge;