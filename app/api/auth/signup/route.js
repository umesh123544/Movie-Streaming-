import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/auth/signup — public, creates a regular viewer account.
// Completely separate from the admin account, which only ever comes
// from ADMIN_EMAIL / ADMIN_PASSWORD_HASH in .env.local.
export async function POST(req) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are all required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email: email.toLowerCase(), passwordHash });

  return NextResponse.json({ success: true }, { status: 201 });
}
