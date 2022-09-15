import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    mainBackgroundColor: '#ffffff',
    containerContentBackground: '#ffffff',
    gradient3: 'linear-gradient(125deg, rgba(225,222,251,1) 0%, rgba(242,237,255,1) 50%, rgba(225,222,251,1) 100%);',
    gradient2: 'linear-gradient(125deg, rgba(234,229,255,1) 0%, rgba(251,245,255,1) 50%, rgba(234,229,255,1) 100%);',
    gradient1: 'linear-gradient(125deg, rgba(242,237,255,1) 0%, rgba(169,155,255,1) 50%, rgba(242,237,255,1) 100%);',
    mainBackground: 'ffffff',//radial-gradient(circle at center, #2a2557, #100e21 50%)',
    verticalGradient: 'linear-gradient(0deg, #100e21ff, #2a255722 60%)',
    verticalGradientTopBottom: 'linear-gradient(180deg, #100e21ff, #2a255722 60%)',
    verticalGradientGray: 'linear-gradient(0deg, rgba(51,51,51,0.2) 0%, rgba(51,51,51,0.7) 40%, rgba(51,51,51,0.7) 60%, rgba(51,51,51,0.2) 100%)',
    announcementBarBackgroundColor: "transparent",
    announcementBarBackground: 'none',//"url('/assets/landing/graphic1.webp')",
    mainTextColor: '#333',
    secondaryTextColor: '#666',
    accentTextColor: '#665cba',
    navBarBackground: '#ececec',
    navBarBorderColor: '#e9e9e9',
    footerBgColor: '#dcdcdc',
    primary: {
      50: '#c0c0c0',
      100: '#c3c3c3',
      150: '#c6c6c6',
      200: '#c9c9c9',
      250: '#cccccc',
      300: '#d0d0d0',
      350: '#d3d3d3',
      400: '#d6d6d6',
      450: '#d9d9d9',
      500: '#dcdcdc',
      550: '#e0e0e0',
      600: '#e3e3e3',
      650: '#e6e6e6',
      700: '#e9e9e9',
      750: '#ececec',
      800: '#f0f0f0',
      850: '#f3f3f3',
      900: '#f6f6f6',
      950: '#f9f9f9',
    },
    inverse: {
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
    primaryPlus: '#6200ff',
    primaryAlpha: '#5E17EB22',
    darkPrimary: '#221d45',
    darkPrimaryAlpha: '#221d4522',
    lightPrimary: '#bbb7e0',
    lightPrimaryAlpha: '#bbb7e022',
    secondary: '#34E795',
    secondaryPlus: '#00FF8A',
    secondaryAlpha: '#34E79522',
    success: '#25C9A1',
    successAlpha: '#25C9A122',
    successLight: '#25C9A199',
    lightWarning: '#edc536',
    error: '#F44061',
    errorAlpha: '#F4406166',
    warning: '#ed8936',
    warningAlpha: '#ed893622',
    info: '#4299e1',
    infoAlpha: '#4299e122',
  },
  fonts: {
    body: 'Inter',
  },
  components: {
    Text: {
      baseStyle: {
        color: '#333',
      },
    },
  },
})

export const ANNOUNCEMENT_BAR_BORDER = '1px solid #dddddd' 
export const TABS_COLOR_SCHEME = 'white' 
export const TABS_VARIANT = 'line'
export const INPUT_BORDER = `1px solid ${theme.colors['primary']['500']}`
export const BUTTON_BG = 'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(120,120,255) 100%)';
export const BUTTON_BG_COLOR = 'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(80,80,180) 100%)';
export const BUTTON_TEXT_COLOR = 'white';
export const THEME_NAME = 'light';

export const CHART_COLORS = [
  '#bbb7e0',
  '#9993d1',
  '#776fc2',
  '#564bb1',
  '#453c8d',
  '#332d69',
  '#221d45',
  '#100e21',
  '#0f0d1f',
];

export default theme
