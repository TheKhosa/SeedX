import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TRACKER_CONFIG } from '$lib/server/tracker';

// POST /api/tunnel - Set the tunnel URL
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();

		if (!url || typeof url !== 'string') {
			return json({ error: 'Invalid URL' }, { status: 400 });
		}

		TRACKER_CONFIG.setTunnelUrl(url);

		return json({
			success: true,
			announceUrl: TRACKER_CONFIG.announceUrl,
			wsAnnounceUrl: TRACKER_CONFIG.wsAnnounceUrl
		});
	} catch (error) {
		return json({ error: 'Failed to set tunnel URL' }, { status: 500 });
	}
};

// GET /api/tunnel - Get current tunnel info
export const GET: RequestHandler = async () => {
	return json({
		tunnelUrl: TRACKER_CONFIG.tunnelUrl,
		announceUrl: TRACKER_CONFIG.announceUrl,
		wsAnnounceUrl: TRACKER_CONFIG.wsAnnounceUrl
	});
};
