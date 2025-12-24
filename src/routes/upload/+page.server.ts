import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createTorrent } from '$lib/server/db';
import type { TorrentCategory } from '$lib/types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString() ?? '';
		const description = data.get('description')?.toString() ?? '';
		const category = data.get('category')?.toString() as TorrentCategory ?? '';
		const magnetLink = data.get('magnetLink')?.toString() ?? '';
		const size = parseInt(data.get('size')?.toString() ?? '0', 10);
		const seeders = parseInt(data.get('seeders')?.toString() ?? '1', 10);
		const legal = data.get('legal');

		if (!name || !description || !category || !magnetLink || !size) {
			return fail(400, {
				error: 'All fields are required',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString()
			});
		}

		if (!magnetLink.startsWith('magnet:?')) {
			return fail(400, {
				error: 'Invalid magnet link format',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString()
			});
		}

		if (!legal) {
			return fail(400, {
				error: 'You must confirm the content is legal to distribute',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString()
			});
		}

		// Extract info hash from magnet link
		const infoHashMatch = magnetLink.match(/btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/);
		const infoHash = infoHashMatch ? infoHashMatch[1] : '';

		if (!infoHash) {
			return fail(400, {
				error: 'Could not extract info hash from magnet link',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString()
			});
		}

		createTorrent({
			name,
			description,
			category,
			infoHash,
			size,
			files: [{ path: name, size }],
			seeders: Math.max(0, seeders),
			leechers: 0,
			uploadedBy: locals.user!.username,
			magnetLink
		});

		return { success: true };
	}
};
