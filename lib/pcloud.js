// Resolves a pCloud share ("Get link") URL into the actual direct,
// streamable file URL. Admins can just paste the normal share link
// (e.g. https://u.pcloud.link/publink/show?code=XXXX) rather than
// manually calling pCloud's API themselves — this does it server-side
// on every stream request.
export function isPcloudLink(url) {
  try {
    const u = new URL(url);
    return u.hostname.endsWith('pcloud.link') && u.pathname.includes('/publink/');
  } catch {
    return false;
  }
}

export async function resolvePcloudUrl(url) {
  const u = new URL(url);
  const code = u.searchParams.get('code');
  if (!code) throw new Error('pCloud link is missing its share code');

  // EU accounts use a different API host than US accounts.
  const apiHost = u.hostname.startsWith('e.') ? 'eapi.pcloud.com' : 'api.pcloud.com';

  const apiRes = await fetch(
    `https://${apiHost}/getpublinkdownload?code=${encodeURIComponent(code)}&forcedownload=1`
  );
  const data = await apiRes.json();

  if (data.result !== 0 || !data.hosts?.length || !data.path) {
    throw new Error('Could not resolve pCloud link (link may be expired or private)');
  }

  return `https://${data.hosts[0]}${data.path}`;
}
