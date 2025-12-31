/**
 * Settings Component
 * 
 * Overlay for user preferences, audio settings, and account status.
 */

import React, { useState } from 'react';
import { firebaseService } from '../services/firebase';
import { getState } from '../store/orbitStore.js';
import './Settings.css';

export default function Settings({
    onClose,
    audioSettings,
    aiStatus,
    firebaseStatus,
    onUpdateAiKey,
    onClearData
}) {
    const { isMusicPlaying, noiseType, toggleMusic, switchNoise } = audioSettings;
    const [tempApiKey, setTempApiKey] = useState(aiStatus.key || '');

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-card" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="settings-section">
                    <h3>Immersive Audio</h3>
                    <div className="setting-item">
                        <label>Ambient Sound</label>
                        <button
                            className={`toggle ${isMusicPlaying ? 'on' : 'off'}`}
                            onClick={toggleMusic}
                        >
                            {isMusicPlaying ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
                    <div className="setting-item vertical">
                        <label>Noise Color</label>
                        <div className="noise-selector">
                            {['ambient', 'brownNoise', 'pinkNoise', 'whiteNoise'].map((type) => (
                                <button
                                    key={type}
                                    className={`noise-pill ${noiseType === type ? 'active' : ''}`}
                                    onClick={() => switchNoise(type)}
                                >
                                    {type.replace('Noise', '')}
                                </button>
                            ))}
                        </div>
                        <p className="setting-hint">Uses 8D spatial audio to help you focus. Noise colors are procedurally generated for maximum immersion.</p>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Artificial Intelligence</h3>
                    <div className="setting-item vertical">
                        <label>Gemini API Key</label>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Enter API Key..."
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                            />
                            <button
                                className="save-btn"
                                onClick={() => onUpdateAiKey(tempApiKey)}
                            >
                                Save
                            </button>
                        </div>
                        <p className={`status-text ${aiStatus.isReady ? 'success' : 'error'}`}>
                            {aiStatus.isReady ? '● AI Ready' : '● Missing Key'}
                        </p>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Cloud Sync (Firebase)</h3>
                    <div className="setting-item">
                        <label>Status</label>
                        <span className={`status-pill ${firebaseStatus.isAvailable ? 'connected' : 'disconnected'}`}>
                            {firebaseStatus.isAvailable ? 'Connected' : 'Offline'}
                        </span>
                    </div>
                    {firebaseStatus.isAvailable && (
                        <div className="setting-item">
                            <label>Manual Sync</label>
                            <button
                                className="sync-btn"
                                onClick={() => {
                                    firebaseService.syncState(getState().items);
                                }}
                            >
                                Sync Now
                            </button>
                        </div>
                    )}
                    {firebaseStatus.userId && (
                        <div className="setting-item vertical">
                            <label>User Identifier</label>
                            <code>{firebaseStatus.userId}</code>
                        </div>
                    )}
                    <p className="setting-hint">
                        {firebaseStatus.isAvailable
                            ? 'Your orbit is automatically synced to the cloud using anonymous authentication.'
                            : 'Sign in not configured. Ensure FIREBASE environment variables are set.'}
                    </p>
                </div>

                <div className="settings-section danger-zone">
                    <h3>Danger Zone</h3>
                    <div className="setting-item">
                        <label>Local Data</label>
                        <button className="clear-btn" onClick={onClearData}>
                            Clear All Data
                        </button>
                    </div>
                </div>

                <div className="settings-footer">
                    <p>Orbit v2.0 · Designed for focus</p>
                </div>
            </div>
        </div>
    );
}
