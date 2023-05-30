import { ChakraProvider } from '@chakra-ui/react'
import '../blog/styles/index.css'
import './polyfill.css'
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
import { fetcher, getLibrary } from '@app/util/web3'
import { Web3ReactProvider } from '@web3-react/core'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SWRConfig } from 'swr'
import React, { useEffect } from 'react';
import { useRouter } from 'next/dist/client/router'
import { gaPageview } from '@app/util/analytics'
import { useAppTheme } from '@app/hooks/useAppTheme'

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
      <Web3ReactProvider getLibrary={getLibrary}>
        <Head>
          <title>{process.env.NEXT_PUBLIC_TITLE}</title>
          <meta name="description" content="Inverse Finance is an Open Source Protocol for borrowing at a fixed-rate. Stake INV to earn real yield through DBR streaming." />
          <meta name="keywords" content="Decentralized Finance, DeFi, lending, borrowing, DAO, stablecoins, Ethereum, stEth, ETH, CRV, cvxCRV, INV, DOLA, gOHM, real yield, audited, borrow, lend, bonds, rewards, transparency, FiRM, DBR, DOLA borrowing right, Fixed Rate, Fixed Rate Market" />

          <meta name="og:title" content="Inverse Finance" />
          <meta name="og:description" content="Inverse Finance is an Open Source Protocol for borrowing at a fixed-rate. Stake INV to earn real yield through DBR streaming." />          
          <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/1Ma9aOfVoZhPqBSfWypXPO/51c94241f900cd3f3252e4628916250e/inv_medium_article_image_1.png?w=3840&q=75" />
          <meta name="twitter:site" content="@InverseFinance" />
          <meta name="twitter:image:alt" content="inverse finance" />
          <meta property="twitter:card" content="summary_large_image" />
          <meta name="google-site-verification" content="bMAjdxhP6hV5H0ZFaFW4AZVipI0NRmFZ2DQPWxgquP4" />          

          <link rel="icon" type="image/png" href="/assets/favicon.png"></link>          
          <meta name="google-site-verification" content="bMAjdxhP6hV5H0ZFaFW4AZVipI0NRmFZ2DQPWxgquP4" />
          <link rel="apple-touch-icon" href="/assets/apple-touch.png" />
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
              <linearGradient id="warning-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#ed8936" />
                <stop offset="1" stopColor="#ed893600" />
              </linearGradient>
            </defs>
          </svg>
          <Component {...pageProps} />
        </SWRConfig>
      </Web3ReactProvider>
    </ChakraProvider>
  )
}

export default App
