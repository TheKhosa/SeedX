<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Login - SeedX</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-blue-500">SeedX</h1>
			<p class="mt-2 text-gray-400">Legal Torrent Directory</p>
			<h2 class="mt-6 text-2xl font-semibold">Sign in to your account</h2>
		</div>

		<form method="POST" use:enhance class="mt-8 space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl">
			{#if form?.error}
				<div class="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
					{form.error}
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-300">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						value={form?.email ?? ''}
						class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-300">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Enter your password"
					/>
				</div>
			</div>

			<button
				type="submit"
				class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
			>
				Sign in
			</button>

			<p class="text-center text-gray-400">
				Don't have an account?
				<a href="/register" class="text-blue-500 hover:text-blue-400 transition-colors">Register</a>
			</p>
		</form>
	</div>
</div>
