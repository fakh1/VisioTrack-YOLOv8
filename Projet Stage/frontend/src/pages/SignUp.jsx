import React, { useState } from 'react';
import {
  Box,
  Button,
  CssBaseline,
  FormControl,
  FormLabel,
  Link,
  Stack,
  TextField,
  Typography,
  Card,
} from '@mui/material';
import { styled } from '@mui/material/styles';
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

export default function SignUp() {
  const [fullNameError, setFullNameError] = useState(false);
  const [fullNameErrorMessage, setFullNameErrorMessage] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateInputs = (fullName, email, password) => {
    let valid = true;

    if (!fullName || fullName.trim().length < 3) {
      setFullNameError(true);
      setFullNameErrorMessage('Full name must be at least 3 characters.');
      valid = false;
    } else {
      setFullNameError(false);
      setFullNameErrorMessage('');
    }

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
    const fullName = formData.get('fullname');
    const email = formData.get('email');
    const password = formData.get('password');

    if (!validateInputs(fullName, email, password)) return;

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
        }),
      });

      if (response.status === 201) {
        const data = await response.json();
        alert('✅ ' + data.message);
        navigate('/'); // Redirect to Sign In page
      } else if (response.status === 409) {
        setEmailError(true);
        setEmailErrorMessage('Email already exists.');
      } else {
        alert('❌ Something went wrong. Try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Server error. Please try later.');
    }

    setLoading(false);
  };

  return (
    <>
      <CssBaseline />
      <StyledCard>
        <Typography variant="h4" component="h1" textAlign="center">
          Sign Up
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl>
            <FormLabel htmlFor="fullname">Full Name</FormLabel>
            <TextField
              id="fullname"
              name="fullname"
              error={fullNameError}
              helperText={fullNameErrorMessage}
              required
              fullWidth
            />
          </FormControl>

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

          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>

          <Typography sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/" variant="body2">
              Sign In
            </Link>
          </Typography>
        </Box>
      </StyledCard>
    </>
  );
}
