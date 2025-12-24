<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let dragover = $state(false);
	let fileName = $state('');

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			fileName = input.files[0].name;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragover = false;
		const fileInput = document.getElementById('torrentFile') as HTMLInputElement;
		if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
			const dt = new DataTransfer();
			dt.items.add(e.dataTransfer.files[0]);
			fileInput.files = dt.files;
			fileName = e.dataTransfer.files[0].name;
		}
	}

	const categories = [
		{ value: 'software', label: 'Software' },
		{ value: 'movies', label: 'Movies' },
		{ value: 'music', label: 'Music' },
		{ value: 'games', label: 'Games' },
		{ value: 'books', label: 'Books' },
		{ value: 'other', label: 'Other' }
	];
</script>

<svelte:head>
	<title>Upload Torrent - SeedX</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-2">Upload Torrent</h1>
	<p class="text-gray-400 mb-8">Share legal content with the community</p>

	<form method="POST" enctype="multipart/form-data" use:enhance class="space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl">
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

		<div>
			<label for="name" class="block text-sm font-medium text-gray-300 mb-1">Torrent Name</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				value={form?.name ?? ''}
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				placeholder="e.g., Ubuntu 24.04 LTS Desktop"
			/>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-300 mb-1">Description</label>
			<textarea
				id="description"
				name="description"
				rows="4"
				required
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
				placeholder="Describe the content and confirm it's legal to share..."
			>{form?.description ?? ''}</textarea>
		</div>

		<div>
			<label for="category" class="block text-sm font-medium text-gray-300 mb-1">Category</label>
			<select
				id="category"
				name="category"
				required
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="">Select a category</option>
				{#each categories as cat}
					<option value={cat.value} selected={form?.category === cat.value}>{cat.label}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="magnetLink" class="block text-sm font-medium text-gray-300 mb-1">Magnet Link</label>
			<input
				id="magnetLink"
				name="magnetLink"
				type="text"
				required
				value={form?.magnetLink ?? ''}
				class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
				placeholder="magnet:?xt=urn:btih:..."
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="size" class="block text-sm font-medium text-gray-300 mb-1">Size (bytes)</label>
				<input
					id="size"
					name="size"
					type="number"
					required
					min="1"
					value={form?.size ?? ''}
					class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="e.g., 5100000000"
				/>
			</div>

			<div>
				<label for="seeders" class="block text-sm font-medium text-gray-300 mb-1">Initial Seeders</label>
				<input
					id="seeders"
					name="seeders"
					type="number"
					value={form?.seeders ?? '1'}
					min="0"
					class="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
		</div>

		<div class="pt-4 border-t border-gray-700">
			<label class="flex items-start space-x-3">
				<input
					type="checkbox"
					name="legal"
					required
					class="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm text-gray-300">
					I confirm that this content is legal to distribute and does not infringe on any copyrights or intellectual property rights.
				</span>
			</label>
		</div>

		<button
			type="submit"
			class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
		>
			Upload Torrent
		</button>
	</form>
</div>
