import type { LayoutServerLoad } from './$types';
import { getUserStats } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	const stats = user ? getUserStats(user.username) : null;

	return {
		user,
		stats
	};
};
