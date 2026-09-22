import { ok, serverError } from 'wix-http-functions';
import { runUnifiedSearchInternal } from 'backend/searchCore';

export async function get_searchDebug(request) {
    try {
        const result = await runUnifiedSearchInternal('mr ps', { limit: 20 });
        return ok({
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                total: result.total,
                titles: (result.results || []).map(item => item.title),
                groups: result.groups
            })
        });
    } catch (error) {
        return serverError({
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: String(error && error.message || error)
            })
        });
    }
}
