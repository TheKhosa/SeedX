<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatSize, calculateHealth, type TorrentHealth, CATEGORIES, type TorrentCategory } from '$lib/types';

	let { data } = $props();

	let searchQuery = $state(data.query);
	let selectedCategory = $state<TorrentCategory | 'all'>(data.category as TorrentCategory | 'all');
	let selectedSubcategory = $state(data.subcategory);
	let sortBy = $state(data.sortBy || 'date');
	let sortOrder = $state(data.sortOrder || 'desc');

	type SortOption = { value: string; label: string };
	const sortOptions: SortOption[] = [
		{ value: 'date', label: 'Date Added' },
		{ value: 'seeders', label: 'Seeders' },
		{ value: 'leechers', label: 'Leechers' },
		{ value: 'size', label: 'Size' },
		{ value: 'downloads', label: 'Downloads' },
		{ value: 'name', label: 'Name' }
	];

	const allCategories: { value: TorrentCategory | 'all'; label: string; icon: string }[] = [
		{ value: 'all', label: 'All', icon: '🌐' },
		...Object.entries(CATEGORIES).map(([key, cat]) => ({
			value: key as TorrentCategory,
			label: cat.label,
			icon: cat.icon
		}))
	];

	$effect(() => {
		// Reset subcategory when category changes
		if (selectedCategory === 'all' || !CATEGORIES[selectedCategory as TorrentCategory]?.subcategories.length) {
			selectedSubcategory = '';
		}
	});

	function buildParams(): URLSearchParams {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedCategory !== 'all') params.set('category', selectedCategory);
		if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
		if (sortBy !== 'date') params.set('sort', sortBy);
		if (sortOrder !== 'desc') params.set('order', sortOrder);
		return params;
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		goto(`/?${buildParams().toString()}`);
	}

	function handleCategoryClick(category: TorrentCategory | 'all') {
		selectedCategory = category;
		selectedSubcategory = '';
		const params = buildParams();
		if (category === 'all') {
			params.delete('category');
		} else {
			params.set('category', category);
		}
		params.delete('subcategory');
		goto(`/?${params.toString()}`);
	}

	function handleSortChange() {
		goto(`/?${buildParams().toString()}`);
	}

	function toggleSortOrder() {
		sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		handleSortChange();
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
		return CATEGORIES[category as TorrentCategory]?.icon ?? '📦';
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getCurrentSubcategories() {
		if (selectedCategory === 'all') return [];
		return CATEGORIES[selectedCategory as TorrentCategory]?.subcategories ?? [];
	}
</script>

<svelte:head>
	<title>Browse Torrents - SeedX</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<!-- Category Navigation -->
	<div class="mb-8">
		<div class="flex flex-wrap gap-2 mb-4">
			{#each allCategories as cat}
				<button
					onclick={() => handleCategoryClick(cat.value)}
					class="px-4 py-2 rounded-lg font-medium transition-all {
						selectedCategory === cat.value
							? 'bg-blue-600 text-white'
							: 'bg-gray-800 text-gray-300 hover:bg-gray-700'
					}"
				>
					<span class="mr-2">{cat.icon}</span>
					{cat.label}
				</button>
			{/each}
		</div>

		<!-- Subcategory filters -->
		{#if getCurrentSubcategories().length > 0}
			<div class="flex flex-wrap gap-2 pl-4 border-l-2 border-gray-700">
				<button
					onclick={() => { selectedSubcategory = ''; handleSearch(new Event('click')); }}
					class="px-3 py-1 rounded text-sm font-medium transition-all {
						!selectedSubcategory
							? 'bg-blue-500 text-white'
							: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
					}"
				>
					All
				</button>
				{#each getCurrentSubcategories() as sub}
					<button
						onclick={() => { selectedSubcategory = sub.value; handleSearch(new Event('click')); }}
						class="px-3 py-1 rounded text-sm font-medium transition-all {
							selectedSubcategory === sub.value
								? 'bg-blue-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}"
					>
						{sub.label}
					</button>
				{/each}
			</div>
		{/if}

		<!-- TV Shows special link -->
		{#if selectedCategory === 'tv'}
			<div class="mt-4">
				<a
					href="/browse/tv"
					class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
				>
					<span>📺</span>
					Browse TV Shows by Series
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
					</svg>
				</a>
			</div>
		{/if}
	</div>

	<!-- Search -->
	<form onsubmit={handleSearch} class="mb-8 flex flex-col sm:flex-row gap-4">
		<div class="flex-1">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search torrents..."
				class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>
		<button
			type="submit"
			class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
		>
			Search
		</button>
	</form>

	<!-- Results Count and Sorting -->
	<div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div class="text-gray-400">
			{data.torrents.length} torrent{data.torrents.length !== 1 ? 's' : ''} found
			{#if data.query}
				for "{data.query}"
			{/if}
			{#if selectedCategory !== 'all'}
				in {CATEGORIES[selectedCategory as TorrentCategory]?.label ?? selectedCategory}
			{/if}
		</div>

		<!-- Sort Controls -->
		<div class="flex items-center gap-2">
			<span class="text-gray-500 text-sm">Sort by:</span>
			<select
				bind:value={sortBy}
				onchange={handleSortChange}
				class="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				{#each sortOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<button
				onclick={toggleSortOrder}
				class="p-1.5 bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
				title={sortOrder === 'desc' ? 'Descending (highest first)' : 'Ascending (lowest first)'}
			>
				{#if sortOrder === 'desc'}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
					</svg>
				{:else}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
					</svg>
				{/if}
			</button>
		</div>
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
								{#if torrent.subcategory}
									<span class="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300 uppercase">
										{torrent.subcategory}
									</span>
								{/if}
								{#if torrent.quality}
									<span class="px-2 py-0.5 bg-blue-900 rounded text-xs text-blue-300 uppercase">
										{torrent.quality}
									</span>
								{/if}
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
