import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import AdminProfile from '@/models/AdminProfile';

// GET /api/admin/profile — admin only, current display name
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const profile = await AdminProfile.findOneAndUpdate(
    { key: 'singleton' },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ name: profile.name });
}

// PUT /api/admin/profile  { name } — admin only, update display name
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
  }

  await connectDB();
  const profile = await AdminProfile.findOneAndUpdate(
    { key: 'singleton' },
    { name: name.trim() },
    { upsert: true, new: true }
  );

  return NextResponse.json({ name: profile.name });
}
