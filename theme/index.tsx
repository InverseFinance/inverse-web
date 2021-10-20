import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    purple: {
      50: '#eeedf7',
      100: '#dddbf0',
      150: '#ccc9e8',
      200: '#bbb7e0',
      250: '#aaa5d9',
      300: '#9993d1',
      350: '#8881c9',
      400: '#776fc2',
      450: '#665cba',
      500: '#564bb1',
      550: '#4d449f',
      600: '#453c8d',
      650: '#3c347b',
      700: '#332d69',
      750: '#2a2557',
      800: '#221d45',
      850: '#191633',
      900: '#100e21',
      950: '#0f0d1f',
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
