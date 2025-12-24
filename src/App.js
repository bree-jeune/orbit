import React from 'react';
import OrbitSurface from './components/OrbitSurface.js';
import ErrorBoundary from './components/ErrorBoundary.js';

function App() {
  return (
    <ErrorBoundary>
      <OrbitSurface />
    </ErrorBoundary>
  );
}

export default App;
