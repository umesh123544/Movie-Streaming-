'use client';

import { useRef, useState } from 'react';
import { getYouTubeEmbedUrl } from '@/lib/videoSource';

export default function VideoPlayer({ movieId, videoUrl, posterUrl, title, subtitleUrl, qualities = [] }) {
  const tracked = useRef(false);
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [speed, setSpeed] = useState(1);

  const youtubeEmbedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  function handlePlay() {
    if (tracked.current) return;
    tracked.current = true;
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId }),
    }).catch(() => {});
  }

  // YouTube videos can't be proxied as a raw file — they only play
  // through YouTube's own embeddable iframe player. Skip/speed/quality
  // controls below aren't shown for this mode; use YouTube's own
  // on-screen controls instead.
  if (youtubeEmbedUrl) {
    if (!tracked.current) {
      tracked.current = true;
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId }),
      }).catch(() => {});
    }
    return (
      <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
        <iframe
          className="w-full h-full"
          src={youtubeEmbedUrl}
          title={title || 'Video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }


  function skip(seconds) {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  }

  function changeSpeed(rate) {
    setSpeed(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }

  function changeQuality(label) {
    const video = videoRef.current;
    const wasPlaying = video && !video.paused;
    const currentTime = video ? video.currentTime : 0;

    setQuality(label);

    // Swap the source but preserve playback position/state — otherwise
    // switching quality mid-watch would restart the video from 0:00.
    requestAnimationFrame(() => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = currentTime;
      if (wasPlaying) videoRef.current.play().catch(() => {});
    });
  }

  const streamSrc =
    quality === 'auto'
      ? `/api/stream/${movieId}`
      : `/api/stream/${movieId}?quality=${encodeURIComponent(quality)}`;

  return (
    <div>
      <div
        className="relative w-full aspect-video bg-black rounded-md overflow-hidden"
        onContextMenu={(e) => e.preventDefault()}
      >
        {loading && !errored && (
          <div className="absolute inset-0 flex items-center justify-center bg-void z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-marquee/30 border-t-marquee rounded-full animate-spin" />
              <p className="text-xs text-muted">Loading {title || 'video'}…</p>
            </div>
          </div>
        )}

        {errored && (
          <div className="absolute inset-0 flex items-center justify-center bg-void z-10">
            <div className="text-center px-6">
              <p className="text-velvet text-sm font-medium">This video couldn&apos;t be loaded.</p>
              <p className="text-muted text-xs mt-1">The source link may be broken or unavailable.</p>
            </div>
          </div>
        )}

        <video
          key={`${movieId}-${quality}`}
          ref={videoRef}
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
          src={streamSrc}
        >
          {subtitleUrl && (
            <track
              kind="subtitles"
              src={`/api/subtitle/${movieId}`}
              srcLang="en"
              label="Subtitles"
              default
            />
          )}
          Your browser doesn&apos;t support video playback.
        </video>
      </div>

      {/* Custom toolbar: skip, speed, quality — sits below the native controls */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
        <button
          onClick={() => skip(-10)}
          className="px-2.5 py-1 rounded border border-white/15 text-muted hover:text-bone hover:border-white/30"
        >
          ⟲ 10s
        </button>
        <button
          onClick={() => skip(10)}
          className="px-2.5 py-1 rounded border border-white/15 text-muted hover:text-bone hover:border-white/30"
        >
          10s ⟳
        </button>

        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-muted">Speed</span>
          {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => changeSpeed(rate)}
              className={`px-2 py-1 rounded border ${
                speed === rate
                  ? 'bg-marquee text-void border-marquee'
                  : 'border-white/15 text-muted hover:text-bone'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {qualities.length > 0 && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-muted">Quality</span>
            <select
              value={quality}
              onChange={(e) => changeQuality(e.target.value)}
              className="bg-surface border border-white/15 rounded px-2 py-1 text-bone"
            >
              <option value="auto">Auto</option>
              {qualities.map((q) => (
                <option key={q.label} value={q.label}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
