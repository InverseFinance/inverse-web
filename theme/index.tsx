import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    purple: {
      100: '#e0def1',
      200: '#c2bee3',
      300: '#a39dd6',
      400: '#857dc8',
      500: '#665cba',
      600: '#4f45a3',
      700: '#3f3783',
      800: '#201c42',
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
