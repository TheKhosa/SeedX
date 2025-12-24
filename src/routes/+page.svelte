<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatSize, calculateHealth, type TorrentHealth } from '$lib/types';

	let { data } = $props();

	let searchQuery = $state(data.query);
	let selectedCategory = $state(data.category);

	const categories = [
		{ value: 'all', label: 'All Categories' },
		{ value: 'software', label: 'Software' },
		{ value: 'movies', label: 'Movies' },
		{ value: 'music', label: 'Music' },
		{ value: 'games', label: 'Games' },
		{ value: 'books', label: 'Books' },
		{ value: 'other', label: 'Other' }
	];

	function handleSearch(e: Event) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedCategory !== 'all') params.set('category', selectedCategory);
		goto(`/?${params.toString()}`);
	}

	function getHealthColor(health: TorrentHealth): string {
		const colors = {
			excellent: 'bg-green-500',
			good: 'bg-green-400',
			moderate: 'bg-yellow-500',
			poor: 'bg-orange-500',
			dead: 'bg-red-500'
		};
		return colors[health];
	}

	function getHealthLabel(health: TorrentHealth): string {
		return health.charAt(0).toUpperCase() + health.slice(1);
	}

	function getCategoryIcon(category: string): string {
		const icons: Record<string, string> = {
			software: '💿',
			movies: '🎬',
			music: '🎵',
			games: '🎮',
			books: '📚',
			other: '📦'
		};
		return icons[category] ?? '📦';
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Browse Torrents - SeedX</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Legal Torrent Directory</h1>
		<p class="text-gray-400">Browse and download open source software, creative commons content, and more</p>
	</div>

	<!-- Search and Filter -->
	<form onsubmit={handleSearch} class="mb-8 flex flex-col sm:flex-row gap-4">
		<div class="flex-1">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search torrents..."
				class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>
		<select
			bind:value={selectedCategory}
			class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
		>
			{#each categories as cat}
				<option value={cat.value}>{cat.label}</option>
			{/each}
		</select>
		<button
			type="submit"
			class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
		>
			Search
		</button>
	</form>

	<!-- Results Count -->
	<div class="mb-4 text-gray-400">
		{data.torrents.length} torrent{data.torrents.length !== 1 ? 's' : ''} found
		{#if data.query}
			for "{data.query}"
		{/if}
	</div>

	<!-- Torrent List -->
	{#if data.torrents.length === 0}
		<div class="text-center py-16 bg-gray-800 rounded-lg">
			<p class="text-gray-400 text-lg">No torrents found</p>
			<p class="text-gray-500 mt-2">Try adjusting your search or <a href="/upload" class="text-blue-500 hover:underline">upload a new torrent</a></p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.torrents as torrent}
				{@const health = calculateHealth(torrent.seeders, torrent.leechers)}
				<div class="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-gray-600">
					<div class="flex flex-col lg:flex-row lg:items-center gap-4">
						<!-- Main Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3 mb-2">
								<span class="text-2xl" title={torrent.category}>{getCategoryIcon(torrent.category)}</span>
								<a href="/torrent/{torrent.id}" class="text-xl font-semibold text-white hover:text-blue-400 transition-colors truncate">
									{torrent.name}
								</a>
							</div>
							<p class="text-gray-400 text-sm line-clamp-2 mb-3">{torrent.description}</p>
							<div class="flex flex-wrap items-center gap-4 text-sm text-gray-400">
								<span class="flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
									</svg>
									{torrent.uploadedBy}
								</span>
								<span class="flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
									</svg>
									{formatDate(torrent.uploadedAt)}
								</span>
								<span class="flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
									</svg>
									{torrent.downloads} downloads
								</span>
							</div>
						</div>

						<!-- Stats -->
						<div class="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-2 text-sm">
							<div class="flex items-center gap-2">
								<span class="w-3 h-3 rounded-full {getHealthColor(health)}" title="Health: {getHealthLabel(health)}"></span>
								<span class="text-gray-300 font-medium">{getHealthLabel(health)}</span>
							</div>
							<div class="text-gray-400">
								<span class="text-green-400 font-medium">{torrent.seeders}</span> seeders
								<span class="mx-1">|</span>
								<span class="text-red-400 font-medium">{torrent.leechers}</span> leechers
							</div>
							<div class="text-gray-300 font-medium">
								{formatSize(torrent.size)}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex lg:flex-col gap-2">
							<a
								href={torrent.magnetLink}
								class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
								</svg>
								Magnet
							</a>
							<a
								href="/torrent/{torrent.id}"
								class="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
							>
								Details
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
