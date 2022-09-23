import { extendTheme } from '@chakra-ui/react'

export const lightTheme = extendTheme({
  initialColorMode: 'light',
  colors: {
    mainBackgroundColor: '#eeedf7',
    containerContentBackground: '#ffffff',//'linear-gradient(125deg, rgba(234,229,255,1) 0%, rgba(251,245,255,1) 50%, rgba(234,229,255,1) 100%);',
    gradient3: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(239,239,239,1) 50%, rgba(255,255,255,1) 100%)',//'linear-gradient(125deg, rgba(225,222,251,1) 0%, rgba(242,237,255,1) 50%, rgba(225,222,251,1) 100%);',
    gradient2: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(239,239,239,1) 50%, rgba(255,255,255,1) 100%)',//'linear-gradient(125deg, rgba(234,229,255,1) 0%, rgba(251,245,255,1) 50%, rgba(234,229,255,1) 100%);',
    gradient1: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(239,239,239,1) 50%, rgba(255,255,255,1) 100%)',//'linear-gradient(125deg, rgba(242,237,255,1) 0%, rgba(169,155,255,1) 50%, rgba(242,237,255,1) 100%);',
    mainBackground: 'radial-gradient(circle at center, #dddce6, #eeedf7 50%)',
    verticalGradient: 'linear-gradient(0deg, #100e21ff, #2a255722 60%)',
    verticalGradientTopBottom: 'linear-gradient(180deg, #100e21ff, #2a255722 60%)',
    verticalGradientGray: 'linear-gradient(0deg, rgba(51,51,51,0.2) 0%, rgba(51,51,51,0.7) 40%, rgba(51,51,51,0.7) 60%, rgba(51,51,51,0.2) 100%)',
    announcementBarBackgroundColor: "transparent",
    announcementBarBackground: 'none',//"url('/assets/landing/graphic1.webp')",
    contrastMainTextColor: '#fff',
    mainTextColor: '#333',
    secondaryTextColor: '#666',
    accentTextColor: '#6d46d8',// dola bg
    lightAccentTextColor: '#776fc2',
    navBarBackgroundColor: '#eeedf7',
    navBarBackground: undefined,
    navBarBorderColor: '#cccccc',
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
    secondary: '#25C9A1',
    secondaryPlus: '#00FF8A',
    secondaryAlpha: '#34E79522',
    success: '#25C9A1',
    successAlpha: '#25C9A122',
    successLight: '#25C9A199',
    lightWarning: 'orangered',
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
});

const theme = lightTheme;

export const ANNOUNCEMENT_BAR_BORDER = '1px solid #dddddd' 
export const TABS_COLOR_SCHEME = 'white' 
export const TABS_VARIANT = 'line'
export const INPUT_BORDER = undefined//`1px solid ${theme.colors['primary']['500']}`

export const BUTTON_BG = 'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(120,120,255) 100%)';
export const BUTTON_BORDER_COLOR = 'primary.600';
export const BUTTON_BG_COLOR = 'accentTextColor';
export const BUTTON_TEXT_COLOR = 'white';
export const BUTTON_BOX_SHADOW = `0 0 1px 1px ${theme.colors['primary']['500']}`;

export const OUTLINE_BUTTON_BG = 'primary.800'//'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(160,160,250) 100%)';
export const OUTLINE_BUTTON_BG_COLOR = '';
export const OUTLINE_BUTTON_BORDER_COLOR = 'accentTextColor';
export const OUTLINE_BUTTON_TEXT_COLOR = 'accentTextColor';
export const OUTLINE_BUTTON_BOX_SHADOW = '';

export const NAV_BUTTON_BG = 'primary.800'//'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(160,160,250) 100%)';
export const NAV_BUTTON_BG_COLOR = '';
export const NAV_BUTTON_BORDER_COLOR = 'accentTextColor';
export const NAV_BUTTON_TEXT_COLOR = 'accentTextColor';
export const NAV_BUTTON_BOX_SHADOW = '';

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

// import { extendTheme } from '@chakra-ui/react'
export const darkTheme = extendTheme({
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
    mainTextColor: '#ffffff',
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
    body: 'Inter',
  },
  components: {
    Text: {
      baseStyle: {
        color: 'white',
      },
    },
  },
});

// const theme = extendTheme(darkTheme)

// export const ANNOUNCEMENT_BAR_BORDER = '1px solid #221d45' 
// export const TABS_COLOR_SCHEME = 'white' 
// export const TABS_VARIANT = 'solid-rounded'
// export const INPUT_BORDER = `none`

// export const BUTTON_BG = 'primary.500'//'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(160,160,250) 100%)';
// export const BUTTON_BG_COLOR = 'primary.500';
// export const BUTTON_BORDER_COLOR = 'primary.500';
// export const BUTTON_TEXT_COLOR = 'white';
// export const BUTTON_BOX_SHADOW = '';

// export const OUTLINE_BUTTON_BG = 'primary.850'//'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(160,160,250) 100%)';
// export const OUTLINE_BUTTON_BG_COLOR = 'primary.600';
// export const OUTLINE_BUTTON_BORDER_COLOR = 'primary.600';
// export const OUTLINE_BUTTON_TEXT_COLOR = 'white';
// export const OUTLINE_BUTTON_BOX_SHADOW = '';

// export const NAV_BUTTON_BG = 'primary.800'//'linear-gradient(125deg, rgb(80,80,180,1) 0%, rgb(160,160,250) 100%)';
// export const NAV_BUTTON_BG_COLOR = 'primary.600';
// export const NAV_BUTTON_BORDER_COLOR = 'primary.600';
// export const NAV_BUTTON_TEXT_COLOR = 'white';
// export const NAV_BUTTON_BOX_SHADOW = '';

// export const THEME_NAME = 'dark';

// export const CHART_COLORS = [
//   '#bbb7e0',
//   '#9993d1',
//   '#776fc2',
//   '#564bb1',
//   '#453c8d',
//   '#332d69',
//   '#221d45',
//   '#100e21',
//   '#0f0d1f',
// ];

// export default theme
