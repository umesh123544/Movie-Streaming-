import mongoose from 'mongoose';

const MovieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    genre: { type: String, required: true },
    year: { type: Number },
    posterUrl: { type: String, required: true },
    // The video's URL on Vercel Blob storage (public CDN URL). Never
    // exposed directly to the client — the client only ever sees
    // /api/stream/<movie-id>, which fetches from this URL server-side.
    videoUrl: { type: String, required: true },
    // Optional: subtitle file (.vtt) URL, proxied through /api/subtitle/<id>.
    subtitleUrl: { type: String },
    // Optional: alternate quality versions. If empty, the player just uses
    // videoUrl. Each entry needs a short label (e.g. "480p") and its own URL.
    qualities: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Movie || mongoose.model('Movie', MovieSchema);
