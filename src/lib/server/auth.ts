import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { createSession, createUser, deleteSession, getSession, getUserByEmail, getUserById, getUserByUsername } from './db';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = createHash('sha256').update(password + salt).digest('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
	const [salt, hash] = storedHash.split(':');
	const inputHash = createHash('sha256').update(password + salt).digest('hex');
	try {
		return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
	} catch {
		return false;
	}
}

export interface AuthResult {
	success: boolean;
	error?: string;
	userId?: string;
}

export function register(username: string, email: string, password: string): AuthResult {
	// Validate inputs
	if (!username || username.length < 3 || username.length > 20) {
		return { success: false, error: 'Username must be between 3 and 20 characters' };
	}
	if (!/^[a-zA-Z0-9_]+$/.test(username)) {
		return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
	}
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { success: false, error: 'Invalid email address' };
	}
	if (!password || password.length < 8) {
		return { success: false, error: 'Password must be at least 8 characters' };
	}

	// Check for existing users
	if (getUserByEmail(email)) {
		return { success: false, error: 'Email already registered' };
	}
	if (getUserByUsername(username)) {
		return { success: false, error: 'Username already taken' };
	}

	const passwordHash = hashPassword(password);
	const user = createUser(username, email, passwordHash);
	return { success: true, userId: user.id };
}

export function login(email: string, password: string): AuthResult {
	const user = getUserByEmail(email);
	if (!user) {
		return { success: false, error: 'Invalid email or password' };
	}

	if (!verifyPassword(password, user.passwordHash)) {
		return { success: false, error: 'Invalid email or password' };
	}

	return { success: true, userId: user.id };
}

export function createSessionCookie(userId: string, cookies: Cookies): void {
	const session = createSession(userId);
	cookies.set(SESSION_COOKIE, session.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) {
		deleteSession(sessionId);
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getSessionUser(cookies: Cookies) {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return null;

	const session = getSession(sessionId);
	if (!session) return null;

	const user = getUserById(session.userId);
	if (!user) return null;

	return {
		id: user.id,
		username: user.username,
		email: user.email
	};
}
