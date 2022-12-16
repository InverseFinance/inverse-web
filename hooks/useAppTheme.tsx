import { darkTheme, lightTheme, OTHER_THEME_PARAMS } from "@app/variables/theme";
import { useEffect, useState } from "react";
import { useLocalStorage } from "./useStorage";

const saved = {
  theme: 'light',
}

export const useAppTheme = () => {
    const { value: savedTheme } = useLocalStorage('theme', saved.theme);
    const [theme, setTheme] = useState(savedTheme);
  
    useEffect(() => {
      saved.theme = savedTheme;
      setTheme(savedTheme);
      const triggerAction = ({ detail }) => {
        setTheme(detail.newTheme);
        saved.theme = detail.newTheme;
      }
      document.addEventListener('change-theme', triggerAction)
      return () => {      
        document.removeEventListener('change-theme', triggerAction, false);
      }
    }, [savedTheme]);

    return {
        themeName: theme,
        themeStyles: theme === 'dark' ? darkTheme : lightTheme,
        themeParams: OTHER_THEME_PARAMS[theme],
    };
}

export const useAppThemeParams = () => {
    const { themeParams } = useAppTheme();
    return themeParams;
}