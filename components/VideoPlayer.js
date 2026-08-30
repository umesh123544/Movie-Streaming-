'use client';

import { useRef, useState } from 'react';

export default function VideoPlayer({ movieId, posterUrl, title }) {
  const tracked = useRef(false);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  function handlePlay() {
    // Record a watch-history entry once per page load, the first time
    // playback actually starts (not just when the page opens).
    if (tracked.current) return;
    tracked.current = true;
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId }),
    }).catch(() => {}); // best-effort — never block playback on this
  }

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-md overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {loading && !errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-void">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-marquee/30 border-t-marquee rounded-full animate-spin" />
            <p className="text-xs text-muted">Loading {title || 'video'}…</p>
          </div>
        </div>
      )}

      {errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-void">
          <div className="text-center px-6">
            <p className="text-velvet text-sm font-medium">This video couldn&apos;t be loaded.</p>
            <p className="text-muted text-xs mt-1">The source link may be broken or unavailable.</p>
          </div>
        </div>
      )}

      <video
        key={movieId}
        className="w-full h-full"
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        preload="metadata"
        poster={posterUrl}
        onPlay={handlePlay}
        onLoadedData={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setErrored(true);
        }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        src={`/api/stream/${movieId}`}
      >
        Your browser doesn&apos;t support video playback.
      </video>
    </div>
  );
}
