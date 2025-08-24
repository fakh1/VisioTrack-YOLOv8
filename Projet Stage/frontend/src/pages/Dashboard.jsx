import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Stack,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoURL, setVideoURL] = useState('');
  const [stats, setStats] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setVideoURL('');
    setStats(null);
  };

  const handleRunDetection = async () => {
    if (!selectedFile) {
      alert('Please select a video file first!');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('video', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/run-detection', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process video');
      }

      const data = await response.json();
      setVideoURL(data.video_url);
      setStats(data.stats);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing the video');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        People Counting Dashboard
      </Typography>

      <Card sx={{ p: 3, mb: 4 }}>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Choose Video
              <input
                type="file"
                accept="video/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>

            {selectedFile && (
              <Typography variant="body1" color="textSecondary">
                Selected: {selectedFile.name}
              </Typography>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayCircleIcon />}
              onClick={handleRunDetection}
              disabled={isProcessing}
            >
              Run Detection
            </Button>

            {isProcessing && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Processing video, please wait...
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Display results */}
      {videoURL && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Detection Result
          </Typography>

          <video
            src={videoURL}
            controls
            style={{ width: '100%', borderRadius: 8, marginTop: 10 }}
          ></video>

          {stats && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Statistics</Typography>
              <Typography variant="body1" color="success.main">
                Enter: {stats.Enter}
              </Typography>
              <Typography variant="body1" color="error.main">
                Exit: {stats.Exit}
              </Typography>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}
