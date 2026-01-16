
import React from 'react';

const ViewSwitcher = ({ currentView, onViewChange, days }) => {
    const ALL_WEEK = 'week';

    // Polish day mapping for the switcher tabs
    const getPolishDay = (dateStr) => {
        const date = new Date(dateStr.replace(/\./g, '-'));
        if (isNaN(date.getTime())) return dateStr;
        const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

        const [y, m, d] = dateStr.split('.');
        return `${days[date.getDay()]} ${d}.${m}`;
    };

    return (
        <div className="view-switcher" style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
        }}>
            <button
                className={`glass-panel`}
                onClick={() => onViewChange(ALL_WEEK)}
                style={{
                    padding: '0.5rem 1rem',
                    border: currentView === ALL_WEEK ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
                    background: currentView === ALL_WEEK ? 'rgba(59, 130, 246, 0.2)' : 'var(--glass-bg)',
                    color: currentView === ALL_WEEK ? 'var(--primary-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: currentView === ALL_WEEK ? 'bold' : 'normal'
                }}
            >
                Cały Tydzień
            </button>

            {days.map(day => (
                <button
                    key={day}
                    className={`glass-panel`}
                    onClick={() => onViewChange(day)}
                    style={{
                        padding: '0.5rem 1rem',
                        border: currentView === day ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
                        background: currentView === day ? 'rgba(59, 130, 246, 0.2)' : 'var(--glass-bg)',
                        color: currentView === day ? 'var(--primary-color)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: currentView === day ? 'bold' : 'normal'
                    }}
                >
                    {getPolishDay(day)}
                </button>
            ))}
        </div>
    );
};

export default ViewSwitcher;
