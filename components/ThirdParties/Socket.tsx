import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@app/util/wallet";
import { useEffect, useState } from "react";

import dynamic from 'next/dynamic';
import { WidgetProps } from "@socket.tech/plugin";
import { MAIN_TOKENS_ARRAY } from "./tokenlist";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { SkeletonBlob } from "../common/Skeleton";

const DynamicComponent = dynamic(() =>
    import('@socket.tech/plugin').then((mod) => mod.Bridge), {
    ssr: false,
    loading: () => <SkeletonBlob />,
});

function hexToRgb(hex) {
    try {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : undefined;
    } catch (e) { }
    return undefined
}

function SocketBridge({
    defaultSourceNetwork = 1,
    defaultDestNetwork = 1,
    enableSameChainSwaps = true,
    defaultSourceToken = 'USDC',
    defaultDestToken = 'DOLA',
}: Partial<WidgetProps>) {
    const [enable, setEnable] = useState(false)
    const { provider } = useWeb3React<Web3Provider>();
    const { themeName, themeStyles } = useAppTheme();

    useEffect(() => {
        setEnable(true)
    }, []);

    if (!enable) return null;
    
    const isLight = themeName === 'light';
    const colors = themeStyles.colors;

    return <DynamicComponent
        provider={provider}
        title={'Bridge / Swap'}
        API_KEY={process.env.NEXT_PUBLIC_SOCKET_API_KEY!}
        sourceNetworks={[1, 10, 137, 56, 43114, 250, 42161]}
        destNetworks={[1, 10, 137, 56, 43114, 250, 42161]}
        defaultSourceNetwork={defaultSourceNetwork}
        defaultDestNetwork={defaultDestNetwork}
        enableSameChainSwaps={enableSameChainSwaps}
        defaultSourceToken={defaultSourceToken}
        defaultDestToken={defaultDestToken}
        tokenList={MAIN_TOKENS_ARRAY}
        // singleTxOnly={true}
        selectivelyShowRefuel={true}
        customize={
            {                
                width: 400,
                responsiveWidth: true,
                borderRadius: 1,
                secondary: isLight ? hexToRgb(colors.mainBackgroundColor) : 'rgb(68,69,79)',
                primary: isLight ? hexToRgb(colors.containerContentBackground) : 'rgb(31,34,44)',
                accent: isLight ? hexToRgb(colors.mainTextColor) : hexToRgb(colors.mainTextColor),
                onAccent: isLight ? hexToRgb(colors.contrastMainTextColor) : 'rgb(0,0,0)',
                interactive: isLight ? hexToRgb(colors.mainBackgroundColor) : 'rgb(0,0,0)',
                onInteractive: isLight ? hexToRgb(colors.mainTextColor) : 'rgb(240,240,240)',
                text: isLight ? hexToRgb(colors.mainTextColor) : 'rgb(255,255,255)',
                secondaryText: isLight ? hexToRgb(colors.mainTextColorLight) : 'rgb(200,200,200)',
            }
        }
    />
}

export default SocketBridge;