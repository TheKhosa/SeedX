import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { login, createSessionCookie } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const result = login(email, password);

		if (!result.success) {
			return fail(400, { error: result.error, email });
		}

		createSessionCookie(result.userId!, cookies);
		throw redirect(303, '/');
	}
};
