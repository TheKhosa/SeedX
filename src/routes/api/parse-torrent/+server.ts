import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	parseTorrentFile,
	extractQualityFromName,
	extractSeasonEpisode,
	guessCategory
} from '$lib/server/torrent-utils';
import { fetchMagnetMetadata } from '$lib/server/seeder';
import { detectTVShow, stripHtml } from '$lib/server/tvmaze';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const contentType = request.headers.get('content-type') || '';

		if (contentType.includes('multipart/form-data')) {
			// Handle file upload
			const formData = await request.formData();
			const file = formData.get('torrent') as File | null;

			if (!file) {
				return json({ error: 'No torrent file provided' }, { status: 400 });
			}

			const buffer = Buffer.from(await file.arrayBuffer());
			const info = await parseTorrentFile(buffer);

			// Extract additional metadata
			const quality = extractQualityFromName(info.name);
			const { season, episode } = extractSeasonEpisode(info.name);
			const category = guessCategory(info.name, info.files);

			// Auto-detect TV show if category is TV
			let tvShow = null;
			if (category === 'tv') {
				try {
					const tvResult = await detectTVShow(info.name);
					if (tvResult.show && tvResult.confidence > 0.5) {
						tvShow = {
							id: tvResult.show.id,
							name: tvResult.show.name,
							premiered: tvResult.show.premiered,
							image: tvResult.show.image?.medium,
							network: tvResult.show.network?.name || tvResult.show.webChannel?.name,
							episode: tvResult.episode
								? {
										name: tvResult.episode.name,
										season: tvResult.episode.season,
										number: tvResult.episode.number,
										airdate: tvResult.episode.airdate,
										summary: stripHtml(tvResult.episode.summary)
									}
								: null,
							confidence: tvResult.confidence
						};
					}
				} catch (e) {
					console.error('[API] TV detection error:', e);
				}
			}

			return json({
				success: true,
				data: {
					name: info.name,
					infoHash: info.infoHash,
					size: info.size,
					files: info.files,
					magnetLink: info.magnetLink,
					quality,
					season,
					episode,
					category,
					comment: info.comment,
					createdBy: info.createdBy,
					creationDate: info.creationDate,
					tvShow
				}
			});
		} else if (contentType.includes('application/json')) {
			// Handle magnet link - fetch real metadata from DHT/peers
			const body = await request.json();
			const magnetUri = body.magnetLink;

			if (!magnetUri || !magnetUri.startsWith('magnet:')) {
				return json({ error: 'Invalid magnet link' }, { status: 400 });
			}

			console.log('[API] Fetching metadata for magnet:', magnetUri.slice(0, 80) + '...');

			// Use WebTorrent to fetch actual metadata from peers
			const result = await fetchMagnetMetadata(magnetUri, 60000);

			if (!result.success || !result.data) {
				return json({
					error: result.error || 'Failed to fetch torrent metadata from peers'
				}, { status: 408 });
			}

			const { data } = result;

			// Extract additional metadata from the real torrent name
			const quality = extractQualityFromName(data.name);
			const { season, episode } = extractSeasonEpisode(data.name);
			const category = guessCategory(data.name, data.files);

			console.log(`[API] Got metadata: ${data.name} (${data.size} bytes, ${data.files.length} files)`);

			// Auto-detect TV show if category is TV
			let tvShow = null;
			if (category === 'tv') {
				try {
					const tvResult = await detectTVShow(data.name);
					if (tvResult.show && tvResult.confidence > 0.5) {
						tvShow = {
							id: tvResult.show.id,
							name: tvResult.show.name,
							premiered: tvResult.show.premiered,
							image: tvResult.show.image?.medium,
							network: tvResult.show.network?.name || tvResult.show.webChannel?.name,
							episode: tvResult.episode
								? {
										name: tvResult.episode.name,
										season: tvResult.episode.season,
										number: tvResult.episode.number,
										airdate: tvResult.episode.airdate,
										summary: stripHtml(tvResult.episode.summary)
									}
								: null,
							confidence: tvResult.confidence
						};
					}
				} catch (e) {
					console.error('[API] TV detection error:', e);
				}
			}

			return json({
				success: true,
				data: {
					name: data.name,
					infoHash: data.infoHash,
					size: data.size,
					files: data.files,
					magnetLink: data.magnetLink,
					quality,
					season,
					episode,
					category,
					numPeers: data.numPeers,
					tvShow
				}
			});
		}

		return json({ error: 'Invalid content type' }, { status: 400 });
	} catch (error) {
		console.error('[API] Parse torrent error:', error);
		return json({
			error: error instanceof Error ? error.message : 'Failed to parse torrent'
		}, { status: 500 });
	}
};
