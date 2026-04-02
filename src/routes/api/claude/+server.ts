import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = request.headers.get('x-api-key');

	if (!apiKey) {
		return json({ error: { message: 'Missing API key' } }, { status: 401 });
	}

	try {
		const body = await request.json();

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		const data = await response.json();

		if (!response.ok) {
			return json(data, { status: response.status });
		}

		return json(data);
	} catch (error: any) {
		console.error('Claude Proxy Error:', error);
		return json({ error: { message: error.message || 'Internal Server Error' } }, { status: 500 });
	}
};
