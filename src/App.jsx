
import { useState, useEffect } from 'react';
import './index.css';
import { fetchPlan } from './api/fetchPlan';
import { fetchTreeSource } from './api/fetchTree';
import { parsePlanHTML, parseTreeJS } from './utils/parser';
import Sidebar from './components/Sidebar';
import ViewSwitcher from './components/ViewSwitcher';
import TimelineView from './components/TimelineView';

function App() {
  const [schedule, setSchedule] = useState([]);
  const [treeNodes, setTreeNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Group State
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(() => {
    return localStorage.getItem('selectedGroup') || 'All';
  });

  // Views
  const [currentView, setCurrentView] = useState('week');

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Favorites persistence
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('selectedGroup', selectedGroup);
  }, [selectedGroup]);

  // Persist last viewed Node
  useEffect(() => {
    if (selectedNode) {
      localStorage.setItem('lastViewedNode', JSON.stringify(selectedNode));
    }
  }, [selectedNode]);

  const toggleFavorite = (node) => {
    const targetLabel = node.fullLabel || node.label;
    if (favorites.some(f => (f.fullLabel || f.label) === targetLabel)) {
      setFavorites(favorites.filter(f => (f.fullLabel || f.label) !== targetLabel));
    } else {
      setFavorites([...favorites, node]);
    }
  };

  useEffect(() => {
    const loadTree = async () => {
      const html = await fetchTreeSource();
      if (html) {
        const nodes = parseTreeJS(html);
        setTreeNodes(nodes);

        // Auto-load last viewed
        const lastViewed = localStorage.getItem('lastViewedNode');
        if (lastViewed) {
          try {
            const node = JSON.parse(lastViewed);
            handleNodeSelect(node);
          } catch (e) {
            console.error("Failed to restore last viewed plan", e);
          }
        }
      }
    };
    loadTree();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleNodeSelect = async (node) => {
    setSelectedNode(node);

    // Close sidebar on mobile
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    setLoading(true);
    const { se, gr } = node;
    try {
      const response = await fetch(`/api/l_pozycjaplanu1.php?se=${se}&gr=${gr}`);
      if (response.ok) {
        const html = await response.text();
        const parsed = parsePlanHTML(html);
        setSchedule(parsed);

        // Extract groups
        const groups = [...new Set(parsed.map(item => item.group).filter(Boolean))].sort();
        setAvailableGroups(groups);

        // Use saved group if available in this schedule, else default
        // Don't auto-reset to All to preserve preference across navigations if valid
        // But if the saved group isn't here, maybe "All" is safer or just keep it?
        // Let's keep the logic simple: verify if selectedGroup is in new groups?
        // Actually, if I select Group 1, and go to another schedule that has Group 1, I want it to stay.
        // If it doesn't have Group 1, I should probably flip to All or the first available.
        if (selectedGroup !== 'All' && !groups.includes(selectedGroup)) {
          setSelectedGroup('All');
        }

        // Logic to select nearest day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parseDate = (d) => {
          if (!d) return new Date(0); // Safety for nulls
          const parts = d.split('.');
          // Format YYYY.MM.DD
          return new Date(parts[0], parts[1] - 1, parts[2]);
        };

        const sortedDates = [...new Set(parsed.map(i => i.date).filter(Boolean))]
          .sort((a, b) => parseDate(a) - parseDate(b));

        // Find first date >= today for default view ONLY
        // We still want to show some history, but only 2 items back
        const todayIndex = sortedDates.findIndex(d => parseDate(d) >= today);
        let startIndex = 0;

        if (todayIndex > 2) {
          startIndex = todayIndex - 2;
        }

        // Use sliced dates for the UI, but we need to filter the actual items in the schedule?
        // Actually, the ViewSwitcher receives simple days. We can just slice 'uniqueDays' in the render or here.
        // But 'uniqueDays' is derived from 'schedule'.
        // If we want to HIDE older days entirely from the app, we should filter 'parsed' here or later.
        // Let's filter 'parsed' to keep memory clean? No, just filter what we pass to ViewSwitcher?
        // User said "nie pokazuj jakis mega starycz planow tylko 2 plany w tyl".
        // Better to filter the visible tabs.

        // Determination of default view
        let defaultView = 'week';
        if (todayIndex !== -1) {
          defaultView = sortedDates[todayIndex];
        } else if (sortedDates.length > 0) {
          defaultView = sortedDates[sortedDates.length - 1];
        }

        setCurrentView(defaultView);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Filter uniqueDays for the switcher
  const allUniqueDays = [...new Set(schedule.map(item => item.date).filter(Boolean))];
  // Logic to keep only 2 past days relative to "today"
  // We need to know which are past.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDateHelper = (d) => {
    if (!d) return new Date(0);
    const parts = d.split('.');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const sortedAllDays = allUniqueDays.sort((a, b) => parseDateHelper(a) - parseDateHelper(b));
  const upcomingIndex = sortedAllDays.findIndex(d => parseDateHelper(d) >= today);

  let visibleDays = sortedAllDays;
  if (upcomingIndex > 2) {
    // Keep 2 before the upcoming one
    visibleDays = sortedAllDays.slice(upcomingIndex - 2);
  } else if (upcomingIndex === -1 && sortedAllDays.length > 2) {
    // All in past, show last 2
    visibleDays = sortedAllDays.slice(sortedAllDays.length - 2);
  }

  const filteredSchedule = schedule.filter(item => {
    // Date filter
    const dateMatch = currentView === 'week' || item.date === currentView;
    // Group filter
    const groupMatch = selectedGroup === 'All' || item.group === selectedGroup || item.group === 'All';

    // Also ensure we don't show invisible days in 'week' view if we want to restrict history?
    // "nie pokazuj... 2 plany w tyl". Maybe restrict 'week' view too?
    // Assuming 'week' means "visible week".
    const dayIsVisible = visibleDays.includes(item.date);

    return dateMatch && groupMatch && dayIsVisible;
  });

  const isFavorite = selectedNode && favorites.some(f => (f.fullLabel || f.label) === (selectedNode.fullLabel || selectedNode.label));

  return (
    <div className="app-layout">
      <Sidebar
        treeNodes={treeNodes}
        onSelect={handleNodeSelect}
        favorites={favorites}
        onRemoveFavorite={(label) => setFavorites(favorites.filter(f => (f.fullLabel || f.label) !== label))}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        {!isSidebarOpen && (
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
        )}

        <header className="main-header">
          <div className="header-titles">
            <h1 className="title-small">Plan Zajęć</h1>
            {selectedNode && (
              <div className="subtitle">
                Przeglądasz: <b style={{ color: 'var(--accent-color)' }}>{selectedNode.fullLabel || selectedNode.label}</b>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Group Selector */}
            {availableGroups.length > 1 && (
              <div className="custom-select-wrapper" style={{ position: 'relative' }}>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  style={{
                    appearance: 'none',
                    padding: '0.5rem 2rem 0.5rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <option value="All">Wszystkie grupy</option>
                  {availableGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <span style={{
                  position: 'absolute',
                  right: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>▼</span>
              </div>
            )}

            {selectedNode && (
              <button
                onClick={() => toggleFavorite(selectedNode)}
                className="glass-button"
                style={{ color: isFavorite ? 'var(--accent-color)' : 'var(--text-secondary)' }}
              >
                {isFavorite ? '★ Zapisano' : '☆ Zapisz'}
              </button>
            )}
          </div>
        </header>

        {schedule.length > 0 && (
          <ViewSwitcher
            currentView={currentView}
            onViewChange={setCurrentView}
            days={visibleDays}
          />
        )}

        {loading ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            Ładowanie planu...
          </div>
        ) : (
          <>
            {schedule.length === 0 && selectedNode && <p className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>Brak zajęć.</p>}
            {!selectedNode && <p className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>Wybierz grupę z menu, aby rozpocząć.</p>}

            {filteredSchedule.length > 0 && <TimelineView schedule={filteredSchedule} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
