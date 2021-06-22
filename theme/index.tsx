import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    turqouise: {
      100: '#d0f7f8',
      200: '#a3eff2',
      300: '#77e7eb',
      400: '#4adfe5',
      500: '#20d5dc',
      600: '#1aaaaf',
      700: '#137f83',
      800: '#0d5456',
      900: '#06292a',
    },
    purple: {
      100: '#d4d1eb',
      200: '#b3addc',
      300: '#928acc',
      400: '#7066bd',
      500: '#5448a8',
      600: '#423984',
      700: '#302a60',
      800: '#211c42',
      900: '#100e21',
    },
    success: '#25C9A1',
    fail: '#F44061',
  },
  fonts: {
    body: 'Inter',
  },
  components: {
    Text: {
      baseStyle: {
        color: 'white',
      },
    },
  },
})

export default theme
