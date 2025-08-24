import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SignIn from './pages/SignIn';   // your sign-in component path
import SignUp from './pages/SignUp';   // your sign-up component path
import Dashboard from './pages/Dashboard'; // import Dashboard here!

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
