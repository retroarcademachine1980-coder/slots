import { redirectFor } from 'public/routes/legacyRedirects';
/** Call ONCE at boot on a legacy query bookmark only. No observer/link rewriter,
 * no content renderer, and no catch-all root redirect. replace() is not HTTP301.
 */
export function queryAliasReplacement(currentUrl, manifest) {
  const result = redirectFor(currentUrl, manifest);
  return result.ok && result.method === 'clientReplace'
    ? { ok: true, replaceWith: result.to }
    : { ok: false, code: result.ok ? 'not_query_alias' : result.code };
}
