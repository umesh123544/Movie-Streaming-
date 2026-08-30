import mongoose from 'mongoose';

// Singleton document — there's only ever one admin account (defined by
// ADMIN_EMAIL/ADMIN_PASSWORD_HASH in env vars), this just stores the
// customizable parts of that account's profile (currently: display name).
const AdminProfileSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'singleton', unique: true },
    name: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

export default mongoose.models.AdminProfile || mongoose.model('AdminProfile', AdminProfileSchema);
