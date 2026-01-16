
import React from 'react';

const GroupSelector = ({ groups, selectedGroup, onChange }) => {
    return (
        <div className="group-selector glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
            <label htmlFor="group-select" style={{ marginRight: '1rem', fontWeight: 'bold' }}>
                Select Group:
            </label>
            <select
                id="group-select"
                value={selectedGroup}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '1rem'
                }}
            >
                {groups.map((group) => (
                    <option key={group.value} value={group.value}>
                        {group.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default GroupSelector;
