import React, { useMemo } from 'react';
import { stringToColor } from '../utils/colorUtils';

const getDayNamePolish = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.replace(/\./g, '-'));
    // Check if valid date
    if (isNaN(date.getTime())) return dateString;

    const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

    // Check if today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return `Dzisiaj (${days[date.getDay()]})`;

    return days[date.getDay()];
};

const TimelineItem = ({ item }) => {
    // Generate color based on subject name
    // Use useMemo to prevent recalculation on every render if not needed, though it's cheap
    const colorStyle = useMemo(() => stringToColor(item.subject || 'Unknown'), [item.subject]);

    const borderColor = colorStyle.border;
    const bgColor = colorStyle.bg;
    const typeColor = borderColor;

    return (
        <div className="timeline-item">
            <div className="time-column">
                <span className="time-start">{item.start}</span>
                <span className="time-end">{item.end}</span>
            </div>

            <div className="content-column glass-panel" style={{
                borderLeft: `4px solid ${borderColor}`,
                background: bgColor, // Dynamic pastel background based on subject
                backdropFilter: 'blur(12px)',
                boxShadow: 'var(--glass-shadow)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {item.type !== 'other' && (
                            <span className="lesson-type" style={{ color: typeColor, borderColor: typeColor }}>{item.type}</span>
                        )}
                        {item.group && item.group !== 'All' && (
                            <span className="lesson-group" style={{
                                fontSize: '0.75rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.2)', // Slightly stronger bg for group badge
                                color: 'var(--text-secondary)'
                            }}>
                                {item.group}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                        {item.room ? item.room : 'Online'}
                    </span>
                </div>
                <h3 className="lesson-title">{item.subject}</h3>
                <div className="lesson-meta">{item.lecturer}</div>
                <div className="lesson-meta">{item.shortName}</div>
            </div>
        </div>
    );
};

const TimelineView = ({ schedule }) => {
    // Group by Date
    const grouped = schedule.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
    }, {});

    return (
        <div className="timeline-container">
            {Object.keys(grouped).map(date => (
                <div key={date} className="day-group">
                    <div className="day-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem', paddingLeft: '0.5rem' }}>
                        <span className="day-date" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>{date}</span>
                        <span className="day-name" style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>{getDayNamePolish(date)}</span>
                    </div>
                    <div className="day-content">
                        {grouped[date].map((item, idx) => (
                            <TimelineItem key={idx} item={item} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TimelineView;
