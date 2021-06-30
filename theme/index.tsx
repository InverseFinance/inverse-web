import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
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
    primary: '#5E17EB',
    secondary: '#34E795',
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
