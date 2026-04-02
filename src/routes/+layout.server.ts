import { GEMINI_API_KEY, CLAUDE_API_KEY } from '$env/static/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		defaults: {
			gemini: GEMINI_API_KEY || '',
			claude: CLAUDE_API_KEY || ''
		}
	};
};
