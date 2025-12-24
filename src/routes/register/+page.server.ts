import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { register, createSessionCookie } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString() ?? '';
		const email = data.get('email')?.toString() ?? '';
		const password = data.get('password')?.toString() ?? '';
		const confirmPassword = data.get('confirmPassword')?.toString() ?? '';

		if (!username || !email || !password || !confirmPassword) {
			return fail(400, { error: 'All fields are required', username, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', username, email });
		}

		const result = register(username, email, password);

		if (!result.success) {
			return fail(400, { error: result.error, username, email });
		}

		createSessionCookie(result.userId!, cookies);
		throw redirect(303, '/');
	}
};
