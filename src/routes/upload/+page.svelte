<script lang="ts">
	import { enhance } from '$app/forms';
	import { CATEGORIES, type TorrentCategory, type VideoQuality, formatSize } from '$lib/types';

	let { form, data } = $props();

	// Form state - only description is truly required from user
	let name = $state('');
	let description = $state('');
	let magnetLink = $state('');
	let size = $state(0);
	let selectedCategory = $state<TorrentCategory | ''>('');
	let selectedSubcategory = $state('');
	let selectedQuality = $state('');
	let selectedShow = $state('');
	let selectedSeason = $state('');
	let selectedEpisode = $state('');
	let numPeers = $state(0);

	// Auto-detected TV show from TVMaze
	let detectedTvShow = $state<{
		id: number;
		name: string;
		premiered: string | null;
		image: string | null;
		network: string | null;
		episode: {
			name: string;
			season: number;
			number: number;
			airdate: string;
			summary: string;
		} | null;
		confidence: number;
	} | null>(null);

	// UI state
	let dragover = $state(false);
	let fileName = $state('');
	let parsing = $state(false);
	let parseError = $state('');
	let parsedFiles = $state<{ path: string; size: number }[]>([]);
	let torrentParsed = $state(false);

	async function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			await parseTorrentFile(input.files[0]);
		}
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragover = false;
		if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
			await parseTorrentFile(e.dataTransfer.files[0]);
		}
	}

	async function parseTorrentFile(file: File) {
		if (!file.name.endsWith('.torrent')) {
			parseError = 'Please upload a .torrent file';
			return;
		}

		fileName = file.name;
		parsing = true;
		parseError = '';

		try {
			const formData = new FormData();
			formData.append('torrent', file);

			const response = await fetch('/api/parse-torrent', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to parse torrent');
			}

			// Auto-fill all fields from parsed data
			name = result.data.name || '';
			magnetLink = result.data.magnetLink || '';
			size = result.data.size || 0;
			parsedFiles = result.data.files || [];
			torrentParsed = true;

			if (result.data.category && CATEGORIES[result.data.category as TorrentCategory]) {
				selectedCategory = result.data.category;
			}

			if (result.data.quality) {
				selectedQuality = result.data.quality;
			}

			if (result.data.season) {
				selectedSeason = result.data.season.toString();
			}

			if (result.data.episode) {
				selectedEpisode = result.data.episode.toString();
			}

			// Use comment as description if available
			if (result.data.comment) {
				description = result.data.comment;
			}

			// Auto-detected TV show
			if (result.data.tvShow) {
				detectedTvShow = result.data.tvShow;
				// Use episode summary as description if available
				if (result.data.tvShow.episode?.summary && !description) {
					description = result.data.tvShow.episode.summary;
				}
			}
		} catch (error) {
			parseError = error instanceof Error ? error.message : 'Failed to parse torrent file';
		} finally {
			parsing = false;
		}
	}

	async function handleMagnetPaste(e: ClipboardEvent) {
		const pasted = e.clipboardData?.getData('text') || '';
		if (pasted.startsWith('magnet:')) {
			magnetLink = pasted;
			// Auto-parse after a short delay to let the input update
			setTimeout(() => parseMagnet(), 100);
		}
	}

	async function parseMagnet() {
		if (!magnetLink.startsWith('magnet:')) {
			return;
		}

		parsing = true;
		parseError = '';

		try {
			const response = await fetch('/api/parse-torrent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ magnetLink })
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to parse magnet');
			}

			// Auto-fill from magnet with full metadata from peers
			name = result.data.name || name;
			magnetLink = result.data.magnetLink || magnetLink;
			size = result.data.size || 0;
			parsedFiles = result.data.files || [];
			numPeers = result.data.numPeers || 0;
			torrentParsed = true;

			if (result.data.category && CATEGORIES[result.data.category as TorrentCategory]) {
				selectedCategory = result.data.category;
			}

			if (result.data.quality) {
				selectedQuality = result.data.quality;
			}

			if (result.data.season) {
				selectedSeason = result.data.season.toString();
			}

			if (result.data.episode) {
				selectedEpisode = result.data.episode.toString();
			}

			// Auto-detected TV show
			if (result.data.tvShow) {
				detectedTvShow = result.data.tvShow;
				// Use episode summary as description if available
				if (result.data.tvShow.episode?.summary && !description) {
					description = result.data.tvShow.episode.summary;
				}
			}
		} catch (error) {
			parseError = error instanceof Error ? error.message : 'Failed to parse magnet link';
		} finally {
			parsing = false;
		}
	}

	function handleCategoryChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedCategory = target.value as TorrentCategory;
		selectedShow = '';
		selectedSeason = '';
		selectedSubcategory = '';
	}

	function handleShowChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedShow = target.value;
		selectedSeason = '';
		selectedEpisode = '';
	}

	function getSubcategories() {
		if (!selectedCategory || selectedCategory === '') return [];
		return CATEGORIES[selectedCategory]?.subcategories ?? [];
	}

	function getSelectedShowSeasons() {
		if (!selectedShow || !data.shows) return [];
		const show = data.shows.find((s: { id: string }) => s.id === selectedShow);
		return show?.seasons ?? [];
	}

	function getSelectedSeasonEpisodes() {
		if (!selectedShow || !selectedSeason || !data.shows) return [];
		const show = data.shows.find((s: { id: string }) => s.id === selectedShow);
		if (!show) return [];
		const season = show.seasons.find((s: { seasonNumber: number }) => s.seasonNumber === parseInt(selectedSeason));
		return season?.episodes ?? [];
	}

	const videoQualities: { value: VideoQuality; label: string }[] = [
		{ value: '4k', label: '4K / UHD' },
		{ value: '2160p', label: '2160p' },
		{ value: '1080p', label: '1080p' },
		{ value: '720p', label: '720p' },
		{ value: '480p', label: '480p' },
		{ value: 'hdtv', label: 'HDTV' },
		{ value: 'webrip', label: 'WEB-DL / WEBRip' },
		{ value: 'bluray', label: 'BluRay' },
		{ value: 'dvdrip', label: 'DVDRip' }
	];
</script>

<svelte:head>
	<title>Upload Torrent - SeedX</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-2">Upload Torrent</h1>
	<p class="text-gray-400 mb-8">Drop a .torrent file or paste a magnet link</p>

	<!-- Torrent File Drop Zone -->
	<div
		class="mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors {
			dragover ? 'border-blue-500 bg-blue-500/10' : torrentParsed ? 'border-green-500 bg-green-500/10' : 'border-gray-600 hover:border-gray-500'
		}"
		ondragover={(e) => { e.preventDefault(); dragover = true; }}
		ondragleave={() => dragover = false}
		ondrop={handleDrop}
		role="button"
		tabindex="0"
	>
		<input
			type="file"
			id="torrentFile"
			accept=".torrent"
			class="hidden"
			onchange={handleFileChange}
		/>
		<label for="torrentFile" class="cursor-pointer">
			{#if torrentParsed}
				<div class="text-4xl mb-4">✅</div>
				<p class="text-lg font-medium text-green-400 mb-2">{name}</p>
				<p class="text-sm text-gray-400">{formatSize(size)} • {parsedFiles.length} file{parsedFiles.length !== 1 ? 's' : ''}</p>
			{:else}
				<div class="text-4xl mb-4">📁</div>
				<p class="text-lg font-medium text-gray-300 mb-2">
					{#if fileName}
						{fileName}
					{:else}
						Drop a .torrent file here or click to browse
					{/if}
				</p>
				<p class="text-sm text-gray-500">All metadata will be extracted automatically</p>
			{/if}
		</label>
		{#if parsing}
			<div class="mt-4 text-blue-400">
				<span class="animate-pulse">Parsing...</span>
			</div>
		{/if}
	</div>

	<!-- OR divider -->
	<div class="flex items-center gap-4 mb-6">
		<div class="flex-1 border-t border-gray-700"></div>
		<span class="text-gray-500 text-sm">OR paste a magnet link</span>
		<div class="flex-1 border-t border-gray-700"></div>
	</div>

	<!-- Magnet Link Input -->
	<div class="mb-8">
		<input
			type="text"
			bind:value={magnetLink}
			onpaste={handleMagnetPaste}
			onblur={parseMagnet}
			disabled={parsing}
			class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:opacity-50"
			placeholder="magnet:?xt=urn:btih:..."
		/>
		{#if parsing && magnetLink.startsWith('magnet:')}
			<div class="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
				<div class="flex items-center gap-3">
					<div class="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
					<div>
						<p class="text-blue-300 font-medium">Fetching metadata from peers...</p>
						<p class="text-sm text-gray-400">This may take up to 60 seconds</p>
					</div>
				</div>
			</div>
		{/if}
		{#if parseError}
			<div class="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
				{parseError}
			</div>
		{/if}
	</div>

	{#if torrentParsed}
		<form method="POST" use:enhance class="space-y-6 bg-gray-800 p-6 rounded-lg">
			{#if form?.error}
				<div class="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div class="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
					Torrent uploaded successfully! <a href="/" class="underline">View in directory</a>
				</div>
			{/if}

			<!-- Hidden fields for auto-extracted data -->
			<input type="hidden" name="name" value={name} />
			<input type="hidden" name="magnetLink" value={magnetLink} />
			<input type="hidden" name="size" value={size} />
			<input type="hidden" name="seeders" value={numPeers > 0 ? numPeers : 1} />

			<!-- Parsed Info Summary -->
			<div class="p-4 bg-gray-700/50 rounded-lg space-y-2">
				<div class="flex justify-between">
					<span class="text-gray-400">Name</span>
					<span class="text-white font-medium truncate ml-4">{name}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Size</span>
					<span class="text-white">{formatSize(size)}</span>
				</div>
				{#if parsedFiles.length > 0}
					<div class="flex justify-between">
						<span class="text-gray-400">Files</span>
						<span class="text-white">{parsedFiles.length}</span>
					</div>
				{/if}
				{#if numPeers > 0}
					<div class="flex justify-between">
						<span class="text-gray-400">Peers Found</span>
						<span class="text-green-400">{numPeers}</span>
					</div>
				{/if}
			</div>

			<!-- Auto-detected TV Show -->
			{#if detectedTvShow}
				<div class="p-4 bg-purple-900/30 border border-purple-600 rounded-lg">
					<div class="flex gap-4">
						{#if detectedTvShow.image}
							<img
								src={detectedTvShow.image}
								alt={detectedTvShow.name}
								class="w-20 h-28 object-cover rounded"
							/>
						{/if}
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<span class="text-purple-400 text-xs font-medium uppercase">Auto-detected</span>
								<span class="text-gray-500 text-xs">
									{Math.round(detectedTvShow.confidence * 100)}% match
								</span>
							</div>
							<h3 class="text-lg font-semibold text-white">{detectedTvShow.name}</h3>
							{#if detectedTvShow.network || detectedTvShow.premiered}
								<p class="text-sm text-gray-400">
									{detectedTvShow.network || ''}
									{#if detectedTvShow.premiered}
										({detectedTvShow.premiered.split('-')[0]})
									{/if}
								</p>
							{/if}
							{#if detectedTvShow.episode}
								<div class="mt-2 p-2 bg-gray-800/50 rounded">
									<p class="text-sm font-medium text-purple-300">
										S{String(detectedTvShow.episode.season).padStart(2, '0')}E{String(detectedTvShow.episode.number).padStart(2, '0')}: {detectedTvShow.episode.name}
									</p>
									{#if detectedTvShow.episode.airdate}
										<p class="text-xs text-gray-500">Aired: {detectedTvShow.episode.airdate}</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
					<!-- Hidden field for TVMaze show ID -->
					<input type="hidden" name="tvmazeId" value={detectedTvShow.id} />
				</div>
			{/if}

			<!-- Description - the only required user input -->
			<div>
				<label for="description" class="block text-sm font-medium text-gray-300 mb-1">
					Description <span class="text-red-400">*</span>
				</label>
				<textarea
					id="description"
					name="description"
					rows="3"
					required
					bind:value={description}
					class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
					placeholder="Describe this content..."
				></textarea>
			</div>

			<!-- Category Selection -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="category" class="block text-sm font-medium text-gray-300 mb-1">Category</label>
					<select
						id="category"
						name="category"
						required
						bind:value={selectedCategory}
						onchange={handleCategoryChange}
						class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select category</option>
						{#each Object.entries(CATEGORIES) as [key, cat]}
							<option value={key}>{cat.icon} {cat.label}</option>
						{/each}
					</select>
				</div>

				{#if getSubcategories().length > 0}
					<div>
						<label for="subcategory" class="block text-sm font-medium text-gray-300 mb-1">Subcategory</label>
						<select
							id="subcategory"
							name="subcategory"
							bind:value={selectedSubcategory}
							class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Optional</option>
							{#each getSubcategories() as sub}
								<option value={sub.value}>{sub.label}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>

			<!-- Video Quality for TV and Movies -->
			{#if selectedCategory === 'tv' || selectedCategory === 'movies'}
				<div>
					<label for="quality" class="block text-sm font-medium text-gray-300 mb-1">Video Quality</label>
					<select
						id="quality"
						name="quality"
						bind:value={selectedQuality}
						class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Auto-detected or select</option>
						{#each videoQualities as q}
							<option value={q.value}>{q.label}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- TV Show Episode Linking -->
			{#if selectedCategory === 'tv' && data.shows && data.shows.length > 0}
				<div class="p-4 bg-purple-900/30 border border-purple-700 rounded-lg space-y-4">
					<h3 class="text-purple-300 font-medium">Link to TV Show (Optional)</h3>

					<div>
						<select
							id="showId"
							name="showId"
							bind:value={selectedShow}
							onchange={handleShowChange}
							class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="">Select a show</option>
							{#each data.shows as show}
								<option value={show.id}>{show.title}</option>
							{/each}
						</select>
					</div>

					{#if selectedShow}
						<div class="grid grid-cols-2 gap-4">
							<select
								name="seasonNumber"
								bind:value={selectedSeason}
								onchange={() => selectedEpisode = ''}
								class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
							>
								<option value="">Season</option>
								{#each getSelectedShowSeasons() as season}
									<option value={season.seasonNumber}>{season.name}</option>
								{/each}
							</select>

							{#if selectedSeason}
								<select
									name="episodeNumber"
									bind:value={selectedEpisode}
									class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
								>
									<option value="">Episode</option>
									{#each getSelectedSeasonEpisodes() as episode}
										<option value={episode.episodeNumber}>
											E{String(episode.episodeNumber).padStart(2, '0')}
										</option>
									{/each}
								</select>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Legal Confirmation -->
			<div class="pt-4 border-t border-gray-700">
				<label class="flex items-start space-x-3">
					<input
						type="checkbox"
						name="legal"
						required
						class="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-300">
						I confirm this content is legal to distribute
					</span>
				</label>
			</div>

			<button
				type="submit"
				class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
			>
				Upload Torrent
			</button>
		</form>
	{:else}
		<!-- Instructions when no torrent loaded -->
		<div class="text-center py-8 text-gray-500">
			<p>Upload a .torrent file or paste a magnet link to get started</p>
		</div>
	{/if}

	<!-- Create Torrent Link -->
	<div class="mt-8 text-center">
		<a
			href="/create-torrent"
			class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
		>
			<span>✨</span>
			Want to create a new torrent from files?
		</a>
	</div>
</div>
