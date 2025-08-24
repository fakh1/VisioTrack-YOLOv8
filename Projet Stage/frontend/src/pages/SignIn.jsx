import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Card,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ForgotPassword from '../components/ForgotPassword';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  margin: 'auto',
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export default function SignIn() {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [openForgot, setOpenForgot] = React.useState(false);
  const navigate = useNavigate();

  const handleOpenForgot = () => setOpenForgot(true);
  const handleCloseForgot = () => setOpenForgot(false);

  const validateInputs = (email, password) => {
    let valid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email.');
      valid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters.');
      valid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!validateInputs(email, password)) return;

    try {
      const res = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Login successful!');
        console.log('User:', data.user);

        // ✅ Store user info for session (optional)
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ Redirect to dashboard
        navigate('/dashboard');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('❌ An error occurred. Please try again later.');
    }
  };

  return (
    <>
      <CssBaseline />
      <StyledCard>
        <Typography variant="h4" component="h1" textAlign="center">
          Sign In
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              id="email"
              name="email"
              type="email"
              error={emailError}
              helperText={emailErrorMessage}
              required
              fullWidth
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              id="password"
              name="password"
              type="password"
              error={passwordError}
              helperText={passwordErrorMessage}
              required
              fullWidth
            />
          </FormControl>

          <FormControlLabel control={<Checkbox name="remember" color="primary" />} label="Remember me" />

          <Button type="submit" variant="contained" fullWidth>
            Sign In
          </Button>

          <Link
            component="button"
            variant="body2"
            onClick={handleOpenForgot}
            sx={{ alignSelf: 'center' }}
          >
            Forgot password?
          </Link>

          <Typography sx={{ textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link href="/signup" variant="body2">
              Sign Up
            </Link>
          </Typography>
        </Box>
      </StyledCard>

      <ForgotPassword open={openForgot} handleClose={handleCloseForgot} />
    </>
  );
}
