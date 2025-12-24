/**
 * Walkthrough Component
 *
 * First-time user orientation with step-by-step guide.
 * Provides an immersive introduction to Orbit.
 */

import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../config/constants';

const STEPS = [
  {
    title: 'Welcome to Orbit',
    description: 'Your context-aware attention surface. Things that matter float to you at the right time.',
    highlight: 'center',
  },
  {
    title: 'Add Items',
    description: 'Press / or click the input to add things to your orbit. Tasks, ideas, reminders—anything.',
    highlight: 'input',
  },
  {
    title: 'Smart Surfacing',
    description: 'Items orbit closer based on context—time of day, location, patterns. The most relevant rise to the surface.',
    highlight: 'orbit',
  },
  {
    title: 'Switch Modes',
    description: 'Toggle between home, work, or create custom modes. Items know where they belong.',
    highlight: 'modes',
  },
  {
    title: 'Take Action',
    description: 'Click any item to expand options: mark done, quiet temporarily, pin to keep visible, or remove.',
    highlight: 'actions',
  },
  {
    title: 'Immerse Yourself',
    description: 'Enable ambient audio for a focused, spatial experience. Your orbit breathes with you.',
    highlight: 'music',
  },
];

export default function Walkthrough({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsExiting(true);
    localStorage.setItem(STORAGE_KEYS.FIRST_RUN, 'complete');
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleNext();
    } else if (e.key === 'Escape') {
      handleSkip();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  if (!isVisible) return null;

  return (
    <div className={`walkthrough-overlay ${isExiting ? 'exiting' : ''}`}>
      {/* Spotlight effect */}
      <div className={`walkthrough-spotlight spotlight-${step.highlight}`} />

      {/* Content card */}
      <div className="walkthrough-card">
        {/* Progress dots */}
        <div className="walkthrough-progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`walkthrough-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'complete' : ''}`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="walkthrough-content">
          <h2 className="walkthrough-title">{step.title}</h2>
          <p className="walkthrough-description">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="walkthrough-actions">
          <button className="walkthrough-skip" onClick={handleSkip}>
            skip
          </button>
          <button className="walkthrough-next" onClick={handleNext}>
            {isLastStep ? 'get started' : 'next'}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="walkthrough-hint">
          press enter to continue · esc to skip
        </div>
      </div>
    </div>
  );
}

/**
 * Check if walkthrough should show
 */
export function shouldShowWalkthrough() {
  return localStorage.getItem(STORAGE_KEYS.FIRST_RUN) !== 'complete';
}
