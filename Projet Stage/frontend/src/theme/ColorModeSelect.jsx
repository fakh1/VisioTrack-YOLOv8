import React from 'react';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useColorMode } from './AppTheme';

export default function ColorModeSelect() {
  const { toggleColorMode } = useColorMode();
  const [mode, setMode] = React.useState('light');

  React.useEffect(() => {
    setMode(document.body.getAttribute('data-theme') || 'light');
  }, []);

  return (
    <IconButton
      onClick={() => {
        toggleColorMode();
        setMode(prev => (prev === 'light' ? 'dark' : 'light'));
      }}
      sx={{ position: 'fixed', top: 8, right: 8 }}
      aria-label="Toggle light/dark mode"
    >
      {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
}
