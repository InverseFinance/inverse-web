import { ChakraProvider, createStandaloneToast } from '@chakra-ui/react'
import '../blog/styles/index.css'
import './index.css'
import './animations.css'
import '@fontsource/inter/100.css'
import '@fontsource/inter/200.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import '@app/pages/markdown.css'
import { fetcher } from '@app/util/web3'
import { Web3ReactProvider } from '@web3-react/core'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SWRConfig } from 'swr'
import React, { useEffect } from 'react';
import { useRouter } from 'next/dist/client/router'
import { gaPageview } from '@app/util/analytics'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { metamaskHooks, metamaskInjector, walletConnectV2, walletConnectV2Hooks, coinbaseWallet, coinbaseWalletHooks, gnosisSafe, gnosisSafeHooks } from '@app/variables/connectors'
const { ToastContainer } = createStandaloneToast()

export const BlogContext = React.createContext({ locale: 'en-US', category: 'home' });

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const { themeStyles } = useAppTheme();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gaPageview(url)
    }
    //When the component is mounted, subscribe to router changes
    //and log those page views
    router.events.on('routeChangeComplete', handleRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <ChakraProvider theme={themeStyles}>
      <Web3ReactProvider connectors={
        [
          [metamaskInjector, metamaskHooks],
          [walletConnectV2, walletConnectV2Hooks],
          [coinbaseWallet, coinbaseWalletHooks],
          [gnosisSafe, gnosisSafeHooks],
        ]
      }>
        <Head>
          <title>Inverse Finance - Fixed-Rate DeFi borrowing</title>
          <meta name="description" content="Inverse Finance is an Open Source Protocol for fixed-rate borrowing. Earn high yields with the DOLA stablecoin. Stake INV to earn real yield through DBR streaming." />
          <meta name="keywords" content="Fixed-Rate, Decentralized Finance, DeFi, lending, borrowing, DAO, stablecoins, Ethereum, wstEth, ETH, CRV, cvxCRV, INV, DOLA, WBTC, real yield, audited, safe, borrow, lend, rewards, transparency, FiRM, DBR, DOLA borrowing right, Fixed Rate, Fixed Rate Market" />

          <meta name="og:title" content="Inverse Finance - Fixed-Rate DeFi borrowing" />
          <meta name="og:description" content="Inverse Finance is an Open Source Protocol for Fixed-Rate borrowing. Earn high yields with the DOLA stablecoin. Stake INV to earn real yield through DBR streaming." />
          {/* <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/1Ma9aOfVoZhPqBSfWypXPO/51c94241f900cd3f3252e4628916250e/inv_medium_article_image_1.png?w=3840&q=75" /> */}
          <meta name="twitter:site" content="@InverseFinance" />
          <meta name="twitter:image:alt" content="inverse finance" />
          <meta property="twitter:card" content="summary_large_image" />
          <meta name="google-site-verification" content="bMAjdxhP6hV5H0ZFaFW4AZVipI0NRmFZ2DQPWxgquP4" />

          <link rel="icon" type="image/png" href="/assets/favicon.png"></link>
          <meta name="google-site-verification" content="bMAjdxhP6hV5H0ZFaFW4AZVipI0NRmFZ2DQPWxgquP4" />
          <link rel="apple-touch-icon" href="/assets/apple-touch.png" />
          <script
            src={`/js/blockaid.js`}
          />
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
              page_path: window.location.pathname,
            });
          `,
            }}
          />
        </Head>
        <SWRConfig
          value={{
            fetcher,
            refreshInterval: 300000,
          }}
        >
          <svg style={{ height: 0 }}>
            <defs>
              <linearGradient id="primary-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#332d69" />
                <stop offset="1" stopColor="#8881c900" />
              </linearGradient>
              <linearGradient id="secondary-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#34E795ee" />
                <stop offset="1" stopColor="#34E79500" />
              </linearGradient>
              <linearGradient id="info-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#4299e1" />
                <stop offset="1" stopColor="#4299e100" />
              </linearGradient>
              <linearGradient id="gold-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#ffd700" />
                <stop offset="1" stopColor="#ffd70000" />
              </linearGradient>
              <linearGradient id="warning-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#ed8936" />
                <stop offset="1" stopColor="#ed893600" />
              </linearGradient>
              <linearGradient id="blue-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#18205D" />
                <stop offset="1" stopColor="#18205D00" />
              </linearGradient>
              <linearGradient id="light-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#f5f5f5" />
                <stop offset="1" stopColor="#f5f5f500" />
              </linearGradient>
            </defs>
          </svg>
          <Component {...pageProps} />
        </SWRConfig>
      </Web3ReactProvider>
      <ToastContainer />
      {/* <script src="/qualaroo.js" /> */}
    </ChakraProvider>
  )
}

export default App
