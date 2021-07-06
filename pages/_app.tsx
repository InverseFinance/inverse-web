import { ChakraProvider } from '@chakra-ui/react'
import '@fontsource/inter/100.css'
import '@fontsource/inter/200.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import '@inverse/pages/markdown.css'
import theme from '@inverse/theme'
import { fetcher, getLibrary } from '@inverse/util/web3'
import { Web3ReactProvider } from '@web3-react/core'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { SWRConfig } from 'swr'

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Head>
          <title>Inverse Finance</title>
          <link rel="icon" type="image/png" href="/assets/favicon.png"></link>
        </Head>
        <SWRConfig
          value={{
            fetcher,
            refreshInterval: 300000,
          }}
        >
          <Component {...pageProps} />
        </SWRConfig>
      </Web3ReactProvider>
    </ChakraProvider>
  )
}

export default App
