import { redirect, type Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';

const publicPaths = ['/login', '/register'];

export const handle: Handle = async ({ event, resolve }) => {
	const user = getSessionUser(event.cookies);
	event.locals.user = user;

	const isPublicPath = publicPaths.some(path => event.url.pathname === path);

	if (!user && !isPublicPath) {
		throw redirect(303, '/login');
	}

	if (user && isPublicPath) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
