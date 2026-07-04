import { useMemo, type ReactNode } from 'react';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useGetThemeQuery } from '../services/theme';

interface ThemeWrapperProps {
  children: ReactNode;
  themeName?: string;
}

const ThemeWrapper = ({ children, themeName = 'default' }: ThemeWrapperProps) => {
  const { data: themeOptions, isLoading } = useGetThemeQuery(themeName);

  const theme = useMemo(() => createTheme(themeOptions ?? {}), [themeOptions]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;