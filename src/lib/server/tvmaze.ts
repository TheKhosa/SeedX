/**
 * TVMaze API integration for TV show metadata
 * Free API, no authentication required
 * https://www.tvmaze.com/api
 */

const BASE_URL = 'https://api.tvmaze.com';

export interface TVMazeShow {
	id: number;
	name: string;
	type: string;
	language: string;
	genres: string[];
	status: string;
	premiered: string | null;
	ended: string | null;
	runtime: number | null;
	rating: { average: number | null };
	image: { medium: string; original: string } | null;
	summary: string | null;
	network: { name: string; country: { name: string } } | null;
	webChannel: { name: string } | null;
}

export interface TVMazeEpisode {
	id: number;
	name: string;
	season: number;
	number: number;
	airdate: string;
	airtime: string;
	runtime: number | null;
	rating: { average: number | null };
	image: { medium: string; original: string } | null;
	summary: string | null;
}

export interface TVMazeSearchResult {
	score: number;
	show: TVMazeShow;
}

/**
 * Search for TV shows by name
 */
export async function searchShows(query: string): Promise<TVMazeSearchResult[]> {
	try {
		const response = await fetch(`${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
		if (!response.ok) {
			throw new Error(`TVMaze API error: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error('[TVMaze] Search error:', error);
		return [];
	}
}

/**
 * Get show details by TVMaze ID
 */
export async function getShow(showId: number): Promise<TVMazeShow | null> {
	try {
		const response = await fetch(`${BASE_URL}/shows/${showId}`);
		if (!response.ok) {
			return null;
		}
		return await response.json();
	} catch (error) {
		console.error('[TVMaze] Get show error:', error);
		return null;
	}
}

/**
 * Get all episodes for a show
 */
export async function getShowEpisodes(showId: number): Promise<TVMazeEpisode[]> {
	try {
		const response = await fetch(`${BASE_URL}/shows/${showId}/episodes`);
		if (!response.ok) {
			return [];
		}
		return await response.json();
	} catch (error) {
		console.error('[TVMaze] Get episodes error:', error);
		return [];
	}
}

/**
 * Get a specific episode by show ID, season, and episode number
 */
export async function getEpisode(
	showId: number,
	season: number,
	episode: number
): Promise<TVMazeEpisode | null> {
	try {
		const response = await fetch(
			`${BASE_URL}/shows/${showId}/episodebynumber?season=${season}&number=${episode}`
		);
		if (!response.ok) {
			return null;
		}
		return await response.json();
	} catch (error) {
		console.error('[TVMaze] Get episode error:', error);
		return null;
	}
}

/**
 * Extract show name from torrent name
 * Removes quality indicators, release group, etc.
 */
export function extractShowName(torrentName: string): string {
	let name = torrentName;

	// Remove file extension if present
	name = name.replace(/\.(mkv|mp4|avi|mov)$/i, '');

	// Remove everything after S01E01 pattern
	name = name.replace(/[.\s]S\d{1,2}E\d{1,2}.*/i, '');

	// Remove everything after year pattern like 2024
	name = name.replace(/[.\s](19|20)\d{2}[.\s].*/i, '');

	// Replace dots and underscores with spaces
	name = name.replace(/[._]/g, ' ');

	// Remove extra whitespace
	name = name.replace(/\s+/g, ' ').trim();

	return name;
}

/**
 * Auto-detect TV show from torrent name
 * Returns the best matching show and episode info
 */
export async function detectTVShow(torrentName: string): Promise<{
	show: TVMazeShow | null;
	episode: TVMazeEpisode | null;
	season: number | null;
	episodeNumber: number | null;
	confidence: number;
}> {
	// Extract season and episode from name
	const seMatch = torrentName.match(/S(\d{1,2})E(\d{1,2})/i);
	const altMatch = torrentName.match(/(\d{1,2})x(\d{2})/);

	let season: number | null = null;
	let episodeNumber: number | null = null;

	if (seMatch) {
		season = parseInt(seMatch[1], 10);
		episodeNumber = parseInt(seMatch[2], 10);
	} else if (altMatch) {
		season = parseInt(altMatch[1], 10);
		episodeNumber = parseInt(altMatch[2], 10);
	}

	// Extract and search for show name
	const showName = extractShowName(torrentName);
	if (!showName) {
		return { show: null, episode: null, season, episodeNumber, confidence: 0 };
	}

	console.log(`[TVMaze] Searching for: "${showName}"`);
	const results = await searchShows(showName);

	if (results.length === 0) {
		return { show: null, episode: null, season, episodeNumber, confidence: 0 };
	}

	// Get the best match
	const bestMatch = results[0];
	const show = bestMatch.show;
	const confidence = bestMatch.score;

	console.log(`[TVMaze] Found: "${show.name}" (confidence: ${confidence.toFixed(2)})`);

	// If we have season/episode info, fetch the specific episode
	let episode: TVMazeEpisode | null = null;
	if (season !== null && episodeNumber !== null) {
		episode = await getEpisode(show.id, season, episodeNumber);
		if (episode) {
			console.log(`[TVMaze] Episode: S${season}E${episodeNumber} - "${episode.name}"`);
		}
	}

	return {
		show,
		episode,
		season,
		episodeNumber,
		confidence
	};
}

/**
 * Strip HTML tags from summary
 */
export function stripHtml(html: string | null): string {
	if (!html) return '';
	return html.replace(/<[^>]*>/g, '').trim();
}
