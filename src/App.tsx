import React from 'react';
import OrbitSurface from './components/OrbitSurface';
import ErrorBoundary from './components/ErrorBoundary';

function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <OrbitSurface />
    </ErrorBoundary>
  );
}

export default App;
