import type { PageServerLoad } from './$types';
import { searchTorrents, type SortField, type SortOrder } from '$lib/server/db';

const validSortFields: SortField[] = ['date', 'seeders', 'leechers', 'size', 'downloads', 'name'];
const validSortOrders: SortOrder[] = ['asc', 'desc'];

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? 'all';
	const subcategory = url.searchParams.get('subcategory') ?? '';

	// Get sort parameters with validation
	const sortByParam = url.searchParams.get('sort') ?? 'date';
	const sortOrderParam = url.searchParams.get('order') ?? 'desc';

	const sortBy: SortField = validSortFields.includes(sortByParam as SortField)
		? sortByParam as SortField
		: 'date';
	const sortOrder: SortOrder = validSortOrders.includes(sortOrderParam as SortOrder)
		? sortOrderParam as SortOrder
		: 'desc';

	const torrents = searchTorrents(query, category, subcategory, sortBy, sortOrder);

	return {
		torrents,
		query,
		category,
		subcategory,
		sortBy,
		sortOrder
	};
};
