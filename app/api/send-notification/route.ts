// app/api/send-notification/route.ts

import { NextRequest, NextResponse } from 'next/server';
import * as webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { subscription, title, body } = await req.json();

    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify({ title, body })
    );
    return NextResponse.json({ message: 'Notification sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}