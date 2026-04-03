import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		defaults: {
			gemini: env.GEMINI_API_KEY || '',
			claude: env.CLAUDE_API_KEY || ''
		}
	};
};
