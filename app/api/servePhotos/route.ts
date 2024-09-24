import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('ServePhotos route called');
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    console.log('Requested filename:', filename);

    if (!filename) {
      console.log('No filename provided');
      return new NextResponse('Filename is required', { status: 400 });
    }

    // Ensure the filename is safe and doesn't contain path traversal
    const safeName = path.basename(filename);
    console.log('Safe filename:', safeName);

    // Define the directory where your photos are stored
    const photoDir = path.join(process.cwd(), 'public', 'photos');
    console.log('Photo directory:', photoDir);

    // Construct the full path to the file
    const filePath = path.join(photoDir, safeName);
    console.log('Full file path:', filePath);

    // Check if the file exists
    try {
      await fs.access(filePath);
      console.log('File exists');
    } catch {
      console.log('File not found');
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    console.log('File read successfully, size:', fileBuffer.length);

    // Determine the MIME type (you might want to expand this for other file types)
    const mimeType = safeName.endsWith('.jpg') || safeName.endsWith('.jpeg') 
      ? 'image/jpeg' 
      : 'application/octet-stream';
    console.log('MIME type:', mimeType);

    // Return the file
    console.log('Sending response');
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${safeName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving photo:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}