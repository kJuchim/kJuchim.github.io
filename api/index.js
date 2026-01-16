export default async function handler(request, response) {
    try {
        const targetUrl = 'https://plan.ue.wroc.pl/';

        const apiRes = await fetch(targetUrl, {
            headers: {
                'Referer': 'https://plan.ue.wroc.pl/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const data = await apiRes.text();

        response.status(apiRes.status).send(data);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch data' });
    }
}
