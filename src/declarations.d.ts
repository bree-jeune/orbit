// CSS modules
declare module '*.css';

// Allow importing JS files as modules (for incremental migration)
declare module './components/OrbitSurface' {
  import React from 'react';
  const OrbitSurface: React.FC;
  export default OrbitSurface;
}

declare module './components/ErrorBoundary' {
  import React from 'react';
  interface Props {
    children: React.ReactNode;
  }
  class ErrorBoundary extends React.Component<Props> {}
  export default ErrorBoundary;
}

declare module './components/OrbitItem' {
  import React from 'react';
  const OrbitItem: React.FC<any>;
  export default OrbitItem;
}

declare module './components/MusicToggle' {
  import React from 'react';
  interface Props {
    isPlaying: boolean;
    onToggle: () => void;
  }
  const MusicToggle: React.FC<Props>;
  export default MusicToggle;
}

declare module './components/OrbitInput' {
  import React from 'react';
  interface Props {
    totalItems: number;
    onAdd: (value: string) => void;
  }
  const OrbitInput: React.FC<Props>;
  export default OrbitInput;
}

declare module './hooks/useAudio' {
  export function useAudio(): {
    playHover: () => void;
    playClick: () => void;
    toggleMusic: () => void;
    isMusicPlaying: boolean;
  };
}

declare module './store/orbitStore' {
  export interface OrbitState {
    items: any[];
    visibleItems: any[];
    context: any;
    isLoading: boolean;
  }

  export function getState(): OrbitState;
  export function subscribe(callback: (state: OrbitState) => void): () => void;
  export function initialize(): Promise<void>;
  export function startAutoRecompute(): void;
  export function stopAutoRecompute(): void;
  export function addToOrbit(title: string, detail?: string): Promise<void>;
  export function markOpened(id: string): Promise<void>;
  export function quiet(id: string, hours: number): Promise<void>;
  export function pin(id: string, until?: string): Promise<void>;
  export function unpin(id: string): Promise<void>;
  export function remove(id: string): Promise<void>;
  export function setPlace(place: string): void;
}
