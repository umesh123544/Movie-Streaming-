import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET /api/account/profile — signed-in viewer only, current name/avatar
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ name: user.name, avatarUrl: user.avatarUrl || null });
}

// PUT /api/account/profile  { name?, avatarUrl? } — update name and/or avatar
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, avatarUrl } = await req.json();
  const update = {};
  if (typeof name === 'string') {
    if (!name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    update.name = name.trim();
  }
  if (typeof avatarUrl === 'string') {
    update.avatarUrl = avatarUrl;
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(session.user.id, update, { new: true });

  return NextResponse.json({ name: user.name, avatarUrl: user.avatarUrl || null });
}
