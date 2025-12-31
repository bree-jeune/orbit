/**
 * Vault Component
 * 
 * A full-screen overlay showing all items in orbit,
 * including those not currently surfaced.
 */

import React, { useState } from 'react';
import './Vault.css';

export default function Vault({ items, onClose, onPin, onUnpin, onRemove, onDone, onQuiet }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, quieted, pinned

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
        if (filter === 'all') return matchesSearch;
        if (filter === 'pinned') return matchesSearch && item.signals.isPinned;
        if (filter === 'quieted') return matchesSearch && item.signals.quietUntil && new Date(item.signals.quietUntil) > new Date();
        if (filter === 'active') return matchesSearch && !item.signals.isPinned && (!item.signals.quietUntil || new Date(item.signals.quietUntil) <= new Date());
        return matchesSearch;
    }).sort((a, b) => (b.computed?.score || 0) - (a.computed?.score || 0));

    return (
        <div className="vault-overlay" onClick={onClose}>
            <div className="vault-card" onClick={(e) => e.stopPropagation()}>
                <div className="vault-header">
                    <div className="vault-title-row">
                        <h2>Orbit Vault</h2>
                        <button className="close-btn" onClick={onClose} aria-label="Close vault">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="vault-controls">
                        <div className="search-box">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search your orbit..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="filter-pills">
                            {['all', 'pinned', 'active', 'quieted'].map(f => (
                                <button
                                    key={f}
                                    className={`filter-pill ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="vault-list">
                    {filteredItems.length === 0 ? (
                        <div className="vault-empty">
                            {search ? 'No items match your search' : 'Your vault is empty'}
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <div key={item.id} className={`vault-item ${item.signals.isPinned ? 'pinned' : ''}`}>
                                <div className="vault-item-info">
                                    <div className="vault-item-title">{item.title}</div>
                                    <div className="vault-item-meta">
                                        <span className="relevance">Score: {Math.round((item.computed?.score || 0) * 100)}%</span>
                                        {item.signals.isPinned && <span className="badge pinned">Pinned</span>}
                                        {item.signals.quietUntil && new Date(item.signals.quietUntil) > new Date() && (
                                            <span className="badge quiet">Quieted</span>
                                        )}
                                    </div>
                                </div>
                                <div className="vault-item-actions">
                                    <button
                                        onClick={() => onDone(item.id)}
                                        className="action-btn done"
                                        title="Mark Done"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    </button>
                                    <button
                                        onClick={() => item.signals.isPinned ? onUnpin(item.id) : onPin(item.id)}
                                        className={`action-btn pin ${item.signals.isPinned ? 'active' : ''}`}
                                        title={item.signals.isPinned ? "Unpin" : "Pin"}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    </button>
                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="action-btn remove"
                                        title="Remove"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="vault-footer">
                    {items.length} total items in your personal gravity field
                </div>
            </div>
        </div>
    );
}
