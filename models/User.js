import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    history: [
      {
        movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
        watchedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
