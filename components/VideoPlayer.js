'use client';

import { useRef } from 'react';

export default function VideoPlayer({ movieId }) {
  const tracked = useRef(false);

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
      className="w-full aspect-video bg-black rounded-md overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        key={movieId}
        className="w-full h-full"
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        preload="metadata"
        onPlay={handlePlay}
        src={`/api/stream/${movieId}`}
      >
        Your browser doesn&apos;t support video playback.
      </video>
    </div>
  );
}
