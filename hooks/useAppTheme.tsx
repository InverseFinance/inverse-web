import { darkTheme, lightTheme } from "@app/variables/theme";
import { useEffect, useState } from "react";
import { useLocalStorage } from "./useStorage";

export const useAppTheme = () => {
    const { value: savedTheme } = useLocalStorage('theme', 'light');
    const [theme, setTheme] = useState(savedTheme);
  
    useEffect(() => {
      setTheme(savedTheme);
      const triggerAction = ({ detail }) => {
        setTheme(detail.newTheme);
      }
      document.addEventListener('change-theme', triggerAction)
      return () => {      
        document.removeEventListener('change-theme', triggerAction, false);
      }
    }, [savedTheme]);

    return {
        themeName: theme,
        themeStyles: theme === 'dark' ? darkTheme : lightTheme,
    };
}