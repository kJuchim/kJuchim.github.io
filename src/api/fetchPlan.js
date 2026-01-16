
export const fetchPlan = async (groupId = '126/1') => {
    try {
        // Using the proxy path setup in vite.config.js
        // Locally: /api/l_pozycjaplanu1.php -> https://plan.ue.wroc.pl/l_pozycjaplanu1.php
        // Vercel: /api/l_pozycjaplanu1.php -> api/plan.js (via rewrite)
        const response = await fetch(`/api/l_pozycjaplanu1.php?se=58&gr=${groupId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        return html;
    } catch (error) {
        console.error("Failed to fetch plan:", error);
        return null;
    }
};
