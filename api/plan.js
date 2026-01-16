export default async function handler(request, response) {
    try {
        // Construct target URL with query parameters
        const { search } = new URL(request.url, `http://${request.headers.host}`);
        const targetUrl = `https://plan.ue.wroc.pl/plan${search}`;

        // Check if it's actually l_pozycjaplanu1.php based on common patterns if 'plan' fails?
        // But local uses /plan, so we stick to /plan. 

        const apiRes = await fetch(targetUrl, {
            headers: {
                'Referer': 'https://plan.ue.wroc.pl/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const data = await apiRes.text();

        response.status(apiRes.status).send(data);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch plan' });
    }
}
