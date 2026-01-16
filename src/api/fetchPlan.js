
export const fetchPlan = async (groupId = '126/1') => {
    try {
        // Using the proxy path setup in vite.config.js
        const response = await fetch(`/api/plan?se=58&gr=${groupId}`);
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
