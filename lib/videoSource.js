import { isPcloudLink, resolvePcloudUrl } from './pcloud';

// Detects which known hosting service a pasted URL belongs to, and
// returns the resolved DIRECT, streamable file URL for it. Falls back
// to treating the URL as already-direct if nothing matches.
//
// Supported:
// - pCloud share links (u.pcloud.link/publink/...)
// - Dropbox share links (auto-fixes ?dl=0 to ?dl=1, or adds it)
// - Google Drive share links (file/d/<id>/view style)
// - Anything else: used as-is (assumed to already be a direct file URL)
export async function resolveVideoSource(url) {
  if (isPcloudLink(url)) {
    return resolvePcloudUrl(url);
  }

  const dropbox = resolveDropboxUrl(url);
  if (dropbox) return dropbox;

  const drive = resolveGoogleDriveUrl(url);
  if (drive) return drive;

  return url;
}

function resolveDropboxUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('dropbox.com')) return null;

    // Force the raw-content flag Dropbox needs for direct playback,
    // regardless of whether the admin pasted ?dl=0, no dl param, or
    // already had ?dl=1.
    u.searchParams.set('dl', '1');
    return u.toString();
  } catch {
    return null;
  }
}

function resolveGoogleDriveUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('drive.google.com') && u.hostname !== 'drive.google.com') return null;

    // Match /file/d/<id>/... or an already-direct ?id=<id> link.
    const match = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = match ? match[1] : u.searchParams.get('id');
    if (!id) return null;

    // Note: Google Drive shows an interstitial "can't scan this file
    // for viruses" page instead of raw bytes for files over ~25MB,
    // which breaks direct streaming for most movie-sized files. This
    // works reliably only for smaller files.
    return `https://drive.google.com/uc?export=download&id=${id}`;
  } catch {
    return null;
  }
}

// A YouTube link can't be proxied as a raw file at all (YouTube doesn't
// serve one) — it needs to be embedded via YouTube's own iframe player
// instead. Used by the client player to decide which mode to render.
export function getYouTubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    let videoId = null;

    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/watch') {
        videoId = u.searchParams.get('v');
      } else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/embed/')[1];
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/shorts/')[1];
      }
    }

    if (!videoId) return null;
    videoId = videoId.split('?')[0].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}
