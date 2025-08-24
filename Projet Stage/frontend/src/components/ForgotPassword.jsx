import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography'; // Add this import

import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch(err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setSent(false);
    setEmail('');
    setError('');
    setLoading(false);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        {sent ? (
          <Alert severity="success">
            A password reset link has been sent to <strong>{email}</strong>. 
            Please check your inbox (and spam folder).
          </Alert>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            <form onSubmit={handleSubmit} id="forgot-password-form">
              <TextField
                autoFocus
                margin="dense"
                id="reset-email"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </form>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} disabled={loading}>
          Cancel
        </Button>
        {!sent && (
          <Button 
            type="submit" 
            form="forgot-password-form"
            disabled={loading || !email}
            variant="contained"
            color="primary"
            endIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}