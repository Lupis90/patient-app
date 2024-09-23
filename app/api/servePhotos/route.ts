import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const photoFolder = "C:\\Users\\robco\\Documents\\PRP_visit\\FotoPRP";

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const filePath = path.join(photoFolder, ...params.path);

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath);
    const response = new NextResponse(fileContent);
    response.headers.set('Content-Type', 'image/jpeg');
    return response;
  } else {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}