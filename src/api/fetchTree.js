
export const fetchTreeSource = async () => {
    try {
        // Fetch the root page via proxy
        const response = await fetch('/api/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Failed to fetch tree source:", error);
        return null;
    }
};
