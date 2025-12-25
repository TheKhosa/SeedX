import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSeederStats, getAllTorrentStats } from '$lib/server/seeder';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const overallStats = getSeederStats();
		const torrentStats = getAllTorrentStats();

		return json({
			success: true,
			data: {
				overall: overallStats,
				torrents: torrentStats
			}
		});
	} catch (error) {
		console.error('[API] Seeder stats error:', error);
		return json({
			error: error instanceof Error ? error.message : 'Failed to get seeder stats'
		}, { status: 500 });
	}
};
