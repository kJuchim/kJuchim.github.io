
import React, { useState, useEffect } from 'react';
import NavigationTree from './NavigationTree';

const Sidebar = ({ treeNodes, onSelect, favorites, onRemoveFavorite, isOpen, toggleSidebar }) => {
    return (
        <>
            {/* Mobile Toggle Button (Visible only on mobile/closed state) */}
            <button
                className="sidebar-toggle"
                onClick={toggleSidebar}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 100,
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    color: 'var(--text-primary)',
                    display: 'none', // Managed by CSS
                }}
            >
                {isOpen ? '✖' : '☰'}
            </button>

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Menu</h2>
                </div>

                {/* Favorites Section */}
                {favorites.length > 0 && (
                    <div className="favorites-section">
                        <h3 style={{ marginBottom: '0.5rem' }}>Ulubione ⭐</h3>
                        {favorites.map((fav, idx) => (
                            <div key={idx} className="favorite-item" onClick={() => onSelect(fav)}>
                                <span style={{ fontSize: '0.9rem' }}>{fav.fullLabel || fav.label}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.fullLabel || fav.label); }}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tree Section */}
                <div className="tree-section">
                    <h3>Katalog Kursów</h3>
                    <NavigationTree rootNodes={treeNodes} onSelect={onSelect} />
                </div>
            </div>
        </>
    );
};

export default Sidebar;
