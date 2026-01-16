
import React, { useState } from 'react';

const TreeNode = ({ node, onSelect }) => {
    const [expanded, setExpanded] = useState(false);

    const hasChildren = node.children && node.children.length > 0;
    const isLeaf = node.url && (node.se || node.gr);

    const handleClick = (e) => {
        e.stopPropagation();
        if (hasChildren) {
            setExpanded(!expanded);
        } else if (isLeaf) {
            onSelect(node);
        }
    };

    return (
        <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
            <div
                onClick={handleClick}
                style={{
                    cursor: 'pointer',
                    color: isLeaf ? 'var(--text-primary)' : 'var(--accent-color)',
                    fontWeight: isLeaf ? 'normal' : 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: 0.9,
                    transition: 'colors 0.2s',
                }}
            >
                {!isLeaf && (
                    <span>{expanded ? '📂' : '📁'}</span>
                )}
                <span style={{
                    textDecoration: isLeaf ? 'none' : 'none',
                    borderBottom: isLeaf ? '1px solid transparent' : 'none',
                }}>
                    {node.label}
                </span>
            </div>

            {expanded && hasChildren && (
                <div style={{ paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-color)' }}>
                    {node.children.map((child, idx) => (
                        <TreeNode key={idx} node={child} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

const NavigationTree = ({ rootNodes, onSelect }) => {
    return (
        <div className="glass-panel" style={{
            padding: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            marginBottom: '2rem'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Course Directory</h3>
            {rootNodes.map((node, idx) => (
                <TreeNode key={idx} node={node} onSelect={onSelect} />
            ))}
        </div>
    );
};

export default NavigationTree;
