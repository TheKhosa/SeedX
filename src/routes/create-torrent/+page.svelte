<script lang="ts">
	import { CATEGORIES, type TorrentCategory, formatSize } from '$lib/types';

	let { data } = $props();

	// Form state
	let files = $state<FileList | null>(null);
	let name = $state('');
	let description = $state('');
	let comment = $state('');
	let selectedCategory = $state<TorrentCategory>('other');
	let isPrivate = $state(false);
	let autoSeed = $state(true);

	// UI state
	let dragover = $state(false);
	let creating = $state(false);
	let error = $state('');
	let success = $state(false);
	let createdTorrent = $state<{
		id: string;
		infoHash: string;
		magnetLink: string;
		downloadUrl: string;
	} | null>(null);

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			files = input.files;
			// Auto-fill name from first file
			if (!name && files.length === 1) {
				name = files[0].name;
			}
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragover = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			const input = document.getElementById('fileInput') as HTMLInputElement;
			input.files = e.dataTransfer.files;
			files = e.dataTransfer.files;
			if (!name && files.length === 1) {
				name = files[0].name;
			}
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!files || files.length === 0) {
			error = 'Please select files to create a torrent from';
			return;
		}

		creating = true;
		error = '';
		success = false;

		try {
			const formData = new FormData();

			// For now, we only support single file torrents
			// Multi-file would require server-side file handling
			formData.append('file', files[0]);
			formData.append('name', name || files[0].name);
			formData.append('description', description);
			formData.append('comment', comment);
			formData.append('category', selectedCategory);
			formData.append('private', isPrivate.toString());
			formData.append('autoSeed', autoSeed.toString());

			const response = await fetch('/api/create-torrent', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to create torrent');
			}

			// Get torrent info from headers
			const torrentId = response.headers.get('X-Torrent-Id') || '';
			const infoHash = response.headers.get('X-Info-Hash') || '';
			const magnetLink = response.headers.get('X-Magnet-Link') || '';

			// Create download URL from blob
			const blob = await response.blob();
			const downloadUrl = URL.createObjectURL(blob);

			createdTorrent = {
				id: torrentId,
				infoHash,
				magnetLink,
				downloadUrl
			};

			success = true;

			// Auto-download the torrent file
			const a = document.createElement('a');
			a.href = downloadUrl;
			a.download = `${name || 'torrent'}.torrent`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create torrent';
		} finally {
			creating = false;
		}
	}

	function getTotalSize(): number {
		if (!files) return 0;
		let total = 0;
		for (let i = 0; i < files.length; i++) {
			total += files[i].size;
		}
		return total;
	}

	function copyMagnet() {
		if (createdTorrent?.magnetLink) {
			navigator.clipboard.writeText(createdTorrent.magnetLink);
		}
	}
</script>

<svelte:head>
	<title>Create Torrent - SeedX</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-2">Create Torrent</h1>
	<p class="text-gray-400 mb-8">Create a new .torrent file with SeedX tracker</p>

	{#if success && createdTorrent}
		<div class="bg-green-500/20 border border-green-500 rounded-lg p-6 mb-8">
			<h2 class="text-xl font-semibold text-green-400 mb-4">Torrent Created Successfully!</h2>

			<div class="space-y-4">
				<div>
					<label class="block text-sm text-gray-400 mb-1">Info Hash</label>
					<code class="block p-2 bg-gray-800 rounded text-sm text-gray-300 font-mono break-all">
						{createdTorrent.infoHash}
					</code>
				</div>

				<div>
					<label class="block text-sm text-gray-400 mb-1">Magnet Link</label>
					<div class="flex gap-2">
						<input
							type="text"
							readonly
							value={createdTorrent.magnetLink}
							class="flex-1 p-2 bg-gray-800 rounded text-sm text-gray-300 font-mono"
						/>
						<button
							onclick={copyMagnet}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
						>
							Copy
						</button>
					</div>
				</div>

				<div class="flex gap-4">
					<a
						href={createdTorrent.downloadUrl}
						download="{name || 'torrent'}.torrent"
						class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
					>
						<span>📥</span>
						Download .torrent File
					</a>
					<a
						href={createdTorrent.magnetLink}
						class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
					>
						<span>🧲</span>
						Open Magnet Link
					</a>
				</div>

				{#if autoSeed}
					<p class="text-sm text-green-400 flex items-center gap-2">
						<span>✓</span>
						This torrent is being seeded by SeedX
					</p>
				{/if}

				<div class="pt-4 border-t border-gray-700">
					<a href="/torrent/{createdTorrent.id}" class="text-blue-400 hover:underline">
						View torrent page →
					</a>
				</div>
			</div>
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl">
		{#if error}
			<div class="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
				{error}
			</div>
		{/if}

		<!-- File Drop Zone -->
		<div
			class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {
				dragover ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
			}"
			ondragover={(e) => { e.preventDefault(); dragover = true; }}
			ondragleave={() => dragover = false}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
		>
			<input
				type="file"
				id="fileInput"
				class="hidden"
				onchange={handleFileChange}
			/>
			<label for="fileInput" class="cursor-pointer">
				<div class="text-4xl mb-4">📂</div>
				<p class="text-lg font-medium text-gray-300 mb-2">
					{#if files && files.length > 0}
						{files.length} file{files.length !== 1 ? 's' : ''} selected ({formatSize(getTotalSize())})
					{:else}
						Drop files here or click to browse
					{/if}
				</p>
				<p class="text-sm text-gray-500">Select the file(s) to create a torrent from</p>
			</label>
		</div>

		<!-- Selected Files List -->
		{#if files && files.length > 0}
			<div class="p-4 bg-gray-700/50 rounded-lg">
				<h4 class="text-sm font-medium text-gray-300 mb-2">Selected Files</h4>
				<div class="max-h-40 overflow-y-auto space-y-1 text-sm">
					{#each Array.from(files) as file}
						<div class="flex justify-between text-gray-400">
							<span class="truncate pr-4">{file.name}</span>
							<span class="text-gray-500 whitespace-nowrap">{formatSize(file.size)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div>
			<label for="name" class="block text-sm font-medium text-gray-300 mb-1">Torrent Name</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				placeholder="Leave empty to use filename"
			/>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-300 mb-1">Description</label>
			<textarea
				id="description"
				rows="3"
				bind:value={description}
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
				placeholder="Description for the torrent listing"
			></textarea>
		</div>

		<div>
			<label for="comment" class="block text-sm font-medium text-gray-300 mb-1">Comment (embedded in .torrent)</label>
			<input
				id="comment"
				type="text"
				bind:value={comment}
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				placeholder="Optional comment embedded in the torrent file"
			/>
		</div>

		<div>
			<label for="category" class="block text-sm font-medium text-gray-300 mb-1">Category</label>
			<select
				id="category"
				bind:value={selectedCategory}
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				{#each Object.entries(CATEGORIES) as [key, cat]}
					<option value={key}>{cat.icon} {cat.label}</option>
				{/each}
			</select>
		</div>

		<div class="space-y-3 pt-4 border-t border-gray-700">
			<label class="flex items-center gap-3">
				<input
					type="checkbox"
					bind:checked={autoSeed}
					class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-gray-300">
					<strong class="text-green-400">Auto-seed</strong> - Start seeding immediately with SeedX
				</span>
			</label>

			<label class="flex items-center gap-3">
				<input
					type="checkbox"
					bind:checked={isPrivate}
					class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-gray-300">
					<strong>Private torrent</strong> - Only allows peers from the tracker
				</span>
			</label>
		</div>

		<div class="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
			<h3 class="text-blue-300 font-medium mb-2">What happens when you create a torrent:</h3>
			<ul class="text-sm text-gray-300 space-y-1">
				<li>• A .torrent file is generated with SeedX as the primary tracker</li>
				<li>• The torrent is added to the SeedX directory</li>
				{#if autoSeed}
					<li>• The file starts being seeded by our seedbox automatically</li>
				{/if}
				<li>• You can share the magnet link or .torrent file with others</li>
			</ul>
		</div>

		<button
			type="submit"
			disabled={creating || !files || files.length === 0}
			class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
		>
			{#if creating}
				<span class="animate-pulse">Creating Torrent...</span>
			{:else}
				<span>✨ Create Torrent</span>
			{/if}
		</button>
	</form>
</div>
