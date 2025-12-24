import React from 'react';
import OrbitSurface from './components/OrbitSurface';
import ErrorBoundary from './components/ErrorBoundary';
import { storage } from "./storage";

const items = await storage.get("orbit-items", []);
await storage.set("orbit-items", items);


function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <OrbitSurface />
    </ErrorBoundary>
  );
}

export default App;
