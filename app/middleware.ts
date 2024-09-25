import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Use your Supabase client
import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client based on the incoming request headers
  const supabaseClient = createMiddlewareSupabaseClient({ req, res });

  // Get the session from Supabase
  const { data: { session } } = await supabaseClient.auth.getSession();

  // If no session exists, redirect to login
  if (!session) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res; // Allow the request to continue if the user is authenticated
}

export const config = {
    matcher: [
      './((?!login).*)', // Protect all routes except login
    ],
  };