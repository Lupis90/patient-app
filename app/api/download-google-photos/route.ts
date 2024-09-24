import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const { photos } = await req.json();

  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const downloadedPhotos = [];

  for (const photo of photos) {
    try {
      console.log('Downloading photo:', photo);

      const downloadUrl = `${photo.baseUrl}=d`;

      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Explicitly type response.data as Buffer
      const buffer = Buffer.from(response.data as Buffer);
      const base64Data = buffer.toString('base64');

      downloadedPhotos.push({
        name: `${photo.id}.jpg`,
        type: 'image/jpeg',
        data: `data:image/jpeg;base64,${base64Data}`,
      });
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  }

  console.log('Downloaded photos:', downloadedPhotos.length);

  return NextResponse.json(downloadedPhotos);
}