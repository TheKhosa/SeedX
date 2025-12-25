import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTorrentsByUser, getUserStats } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const torrents = getTorrentsByUser(locals.user.username);
	const stats = getUserStats(locals.user.username);

	return {
		torrents,
		stats
	};
};
