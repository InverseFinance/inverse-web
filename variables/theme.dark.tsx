import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    mainBackgroundColor: '#2a2557',
    containerContentBackground: '#2a2557',
    gradient3: 'linear-gradient(125deg, rgba(25,22,51,1) 0%, rgba(42,37,87,1) 50%, rgba(25,22,51,1) 100%)',
    gradient2: 'linear-gradient(125deg, rgba(34,29,69,1) 0%, rgba(51,45,105,1) 50%, rgba(34,29,69,1) 100%);',
    gradient1: 'linear-gradient(125deg, rgba(42,37,87,1) 0%, rgba(69,60,141,1) 50%, rgba(42,37,87,1) 100%);',
    mainBackground: 'radial-gradient(circle at center, #2a2557, #100e21 50%)',
    verticalGradient: 'linear-gradient(0deg, #100e21ff, #2a255722 60%)',
    verticalGradientTopBottom: 'linear-gradient(180deg, #100e21ff, #2a255722 60%)',
    verticalGradientGray: 'linear-gradient(0deg, rgba(51,51,51,0.2) 0%, rgba(51,51,51,0.7) 40%, rgba(51,51,51,0.7) 60%, rgba(51,51,51,0.2) 100%)',
    announcementBarBackgroundColor: "transparent",
    announcementBarBackground: "url('/assets/landing/graphic1.webp')",
    contrastMainTextColor: '#333',
    mainTextColor: '#fff',
    secondaryTextColor: '#bbb7e0',
    accentTextColor: '#34E795',
    lightAccentTextColor: '#dddbf0',
    navBarBackground: '#100e21',
    navBarBorderColor: '#221d45',
    footerBgColor: 'transparent',
    primary: {
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
    body: 'Geist',
  },
  components: {
    Text: {
      baseStyle: {
        color: 'white',
      },
    },
  },
})

export const ANNOUNCEMENT_BAR_BORDER = '1px solid #221d45' 
export const TABS_COLOR_SCHEME = 'white' 
export const TABS_VARIANT = 'solid-rounded'
export const INPUT_BORDER = `none`
export const BUTTON_BG = 'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(160,160,250) 100%)';
export const BUTTON_BG_COLOR = 'primary.600';
export const BUTTON_TEXT_COLOR = 'white';
export const BUTTON_BOX_SHADOW = '';
export const THEME_NAME = 'dark';

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
