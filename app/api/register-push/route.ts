// app/api/register-push/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();
    // Save the subscription to your database
    // This is just an example, you should implement the logic to actually save the data
    console.log('New subscription received:', subscription);
    
    return NextResponse.json({ message: 'Subscription registered successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error registering subscription:', error);
    return NextResponse.json({ error: 'Failed to register subscription' }, { status: 500 });
  }
}