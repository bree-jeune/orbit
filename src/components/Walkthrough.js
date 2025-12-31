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
    title: 'Welcome home',
    description: "Orbit is your gentle space for focus. It helps you keep track of what's important, without the noise.",
    highlight: 'center',
  },
  {
    title: 'Clear your mind',
    description: "Add tasks, ideas, or reminders—anything you don't want to forget. Just press / or click the input.",
    highlight: 'input',
  },
  {
    title: 'Right place, right time',
    description: "Your tasks drift closer when they're relevant to where you are and what you're doing.",
    highlight: 'orbit',
  },
  {
    title: 'Separate your spaces',
    description: "Keep work and home distinct. Orbit remembers where everything belongs so you can stay in the zone.",
    highlight: 'modes',
  },
  {
    title: 'Control the flow',
    description: "Click any item to mark it done, snooze it for later, or pin what's critical.",
    highlight: 'actions',
  },
  {
    title: 'Find your focus',
    description: "Turn on ambient sounds to create a calm space for deep work. Your orbit breathes with you.",
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
