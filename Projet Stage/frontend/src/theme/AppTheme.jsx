import React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import ColorModeSelect from './ColorModeSelect';

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

export function useColorMode() {
  return React.useContext(ColorModeContext);
}

export default function AppTheme({ children }) {
  const [mode, setMode] = React.useState('light');

  const colorMode = React.useMemo(() => ({
    toggleColorMode: () => {
      setMode(prev => (prev === 'light' ? 'dark' : 'light'));
    },
  }), []);

  const theme = React.useMemo(() =>
    createTheme({
      palette: {
        mode,
      },
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ColorModeSelect />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
