
/**
 * Maps standard UE Wr time slot indices to hours.
 */
const TIME_SLOTS = [
    { start: "08:00", end: "09:30" },
    { start: "09:45", end: "11:15" },
    { start: "11:30", end: "13:00" },
    { start: "13:15", end: "14:45" },
    { start: "15:00", end: "16:30" },
    { start: "16:45", end: "18:15" },
    { start: "18:30", end: "20:00" },
    { start: "20:15", end: "21:45" },
];

/**
 * Parses the raw HTML from plan.ue.wroc.pl into a structured JSON object.
 * @param {string} htmlString - The raw HTML string.
 * @returns {Array} - An array of class objects.
 */
export const parsePlanHTML = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Select all rows in the main table
    const rows = Array.from(doc.querySelectorAll('table.h3 tr'));

    const schedule = [];
    let currentDate = null;

    rows.forEach(row => {
        // Skip header rows (contain "8:00", "Dzień", etc.)
        if (row.textContent.includes('8:00') && row.textContent.includes('9:00')) {
            return;
        }

        const cells = Array.from(row.children);
        if (cells.length === 0) return;

        let scheduleCells = [];
        let group = 'All';

        // Check for Date Cell (usually rowspan, class h1, text like YYYY.MM.DD)
        const firstCell = cells[0];
        const firstCellText = firstCell.textContent.trim();
        const dateMatch = firstCellText.match(/\d{4}\.\d{2}\.\d{2}/);

        if (dateMatch) {
            currentDate = dateMatch[0]; // "2025.10.18"
            // If date is present, structure is: [Date][Group][...ScheduleCells]
            if (cells.length > 1) {
                group = cells[1].textContent.trim();
                scheduleCells = cells.slice(2);
            }
        } else {
            // Continuation row, structure is: [Group][...ScheduleCells]
            // We skip the first 1 cell
            // Safety check: Is the first cell a Group cell? (class h2)
            if (firstCell.classList.contains('h2')) {
                group = firstCell.textContent.trim();
                scheduleCells = cells.slice(1);
            } else {
                // Fallback or potentially weird row (e.g. "Dzień" header repeated)
                // If it doesn't look like schedule data, skip
                if (firstCell.classList.contains('h1')) return; // Likely a header repeater
                scheduleCells = cells;
            }
        }

        // 1 column unit = 15 minutes
        // Start time = 08:00 (480 minutes)
        let visualColumnIndex = 0;

        scheduleCells.forEach(cell => {
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            const isClass = cell.classList.contains('p1');

            if (isClass) {
                // Calculate time
                // Start minutes from 8:00
                const startMinutes = 480 + (visualColumnIndex * 15);
                const endMinutes = startMinutes + (colspan * 15);

                const formatTime = (totalMins) => {
                    const h = Math.floor(totalMins / 60);
                    const m = totalMins % 60;
                    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                };

                const startTime = formatTime(startMinutes);
                const endTime = formatTime(endMinutes);

                // Parse content
                const link = cell.querySelector('a');
                if (link) {
                    const title = link.getAttribute('title'); // "Subject (Lecturer)"
                    const shortName = link.textContent.trim(); // "DMB"
                    const href = link.getAttribute('href');

                    let subject = title;
                    let lecturer = "";
                    const splitIndex = title.lastIndexOf('(');
                    if (splitIndex !== -1) {
                        subject = title.substring(0, splitIndex).trim();
                        lecturer = title.substring(splitIndex + 1, title.length - 1).trim();
                    }

                    let type = 'other';
                    if (subject.includes('(W)')) type = 'lecture';
                    else if (subject.includes('(L)')) type = 'lab';
                    else if (subject.match(/\([CĆc]\)/)) type = 'exercise';
                    else if (subject.includes('(P)')) type = 'project';
                    else if (subject.includes('(S)')) type = 'seminar';

                    const idMatch = href.match(/id=(\d+)/);
                    const id = idMatch ? idMatch[1] : null;

                    // Parse room
                    const clone = cell.cloneNode(true);
                    const linkInClone = clone.querySelector('a');
                    if (linkInClone) linkInClone.remove();

                    const brs = clone.querySelectorAll('br');
                    brs.forEach(br => br.replaceWith(' '));

                    let rawRoomText = clone.textContent.trim();
                    let room = rawRoomText.replace(/\s+/g, ' ').trim();

                    // Specific cleanup if known prefixes exist
                    // Example: "TINF 209D" -> remove TINF? Or just find the room.
                    // Room usually matches patterns like: "209D", "3/14", "101", "A1", "B"

                    // Regex to find a potential room number at the end or standalone
                    // Matches: 
                    // 1. "3/14" (digits/digits)
                    // 2. "209D" (digits + optional letter)
                    // 3. "A1" (letter + digits)
                    // 4. "B" (single letter, risky? but buildings are usually A, B, C...)
                    // Let's rely on the extraction of the *last* token if it looks like a room

                    const tokens = room.split(' ');
                    const lastToken = tokens[tokens.length - 1];

                    // Check if last token is likely a room
                    // It should contain a digit OR be a known alphanumeric room
                    const roomRegex = /^(\d+[a-zA-Z]?|[a-zA-Z]\d+|\d+\/\d+)$/;

                    // If the extraction is "TINF 209D", we might want "209D".
                    // If it's just "Online", we want "Online" (but we check isOnline first).

                    const isOnline = room.toLowerCase().includes('zda') || room.toLowerCase().includes('online');

                    if (tokens.length > 0 && roomRegex.test(lastToken)) {
                        room = lastToken;
                    } else if (isOnline) {
                        // Check strictly if there are NO digits in the *entire* string before calling it confirmed online?
                        // User said "jak jest numer sali to stacjonarne".
                        // Logic: If we found a room token, we use it (above).
                        // If NOT, and it says zda/online, then it's null/online.
                        room = null;
                    } else if (!room || room === '') {
                        room = null;
                    }

                    // Fallback: If room is still null, checks if shortName (link text) contains the room.
                    // Example: "TINF 209D" -> "209D" is the room.
                    if (!room && shortName) {
                        const snTokens = shortName.split(' ');
                        const snLastToken = snTokens[snTokens.length - 1];
                        if (snTokens.length > 1 && roomRegex.test(snLastToken)) {
                            room = snLastToken;
                        }
                    }

                    if (currentDate) {
                        schedule.push({
                            date: currentDate,
                            group,
                            subject,
                            lecturer,
                            shortName,
                            id,
                            type,
                            room,
                            start: startTime,
                            end: endTime
                        });
                    }
                }
            }

            visualColumnIndex += colspan;
        });
    });

    return schedule;
};

/**
 * Parses the available groups from the HTML select element.
 */
export const parseGroups = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const select = doc.querySelector('select[name="grupa"]');

    if (!select) return [];

    const options = Array.from(select.querySelectorAll('option'));
    return options.map(opt => ({
        value: opt.value,
        label: opt.textContent.trim()
    })).filter(opt => opt.value && opt.label);
};

export const parseTreeJS = (htmlContent) => {
    const lines = htmlContent.split('\n');
    const nodes = {};
    const tree = [];

    nodes['aux0'] = { id: 'root', label: 'Root', fullLabel: '', children: [] };
    tree.push(nodes['aux0']);

    const regex = /(?:(\w+)\s*=\s*)?appendChild\s*\(\s*(\w+)\s*,\s*['"](.+?)['"]\s*,\s*(-?\d+)\s*,\s*['"](.*?)['"]\s*,\s*['"](.*?)['"]\s*\)/;

    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            const [_, variableName, parentVar, label, type, url, extraId] = match;

            const parent = nodes[parentVar];
            const parentLabel = parent && parent.id !== 'root' ? parent.fullLabel : '';
            const fullLabel = parentLabel ? `${parentLabel} / ${label.trim()}` : label.trim();

            const newNode = {
                label: label.trim(),
                fullLabel: fullLabel,
                url: url.trim(),
                children: []
            };

            if (newNode.url && newNode.url.includes('?')) {
                const params = new URLSearchParams(newNode.url.split('?')[1]);
                newNode.se = params.get('se');
                newNode.gr = params.get('gr');
            }

            if (variableName) nodes[variableName] = newNode;
            if (nodes[parentVar]) nodes[parentVar].children.push(newNode);
        }
    });

    return nodes['aux0'].children;
};
