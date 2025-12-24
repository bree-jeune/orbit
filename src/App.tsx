import React from 'react';
import OrbitSurface from './components/OrbitSurface';
import ErrorBoundary from './components/ErrorBoundary';
import { storage } from "./storage";


function App(): React.ReactElement {
  React.useEffect(() => {
    (async () => {
      const items = await storage.get("orbit-items", []);
      await storage.set("orbit-items", items);
    })();
  }, []);

  return (
    <ErrorBoundary>
      <OrbitSurface />
    </ErrorBoundary>
  );
}



export default App;
