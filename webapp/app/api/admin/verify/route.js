import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('admin_session');
    
    if (session && session.value === 'authenticated') {
      return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
