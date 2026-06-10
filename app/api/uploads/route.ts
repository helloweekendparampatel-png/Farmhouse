import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../_lib/auth';
import { Role } from '@prisma/client';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';
import { uploadImageToS3, useS3Upload } from '@/app/lib/upload-storage';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function safeExtFromFile(file: File) {
  const fromName = path.extname(file.name || '').toLowerCase();
  if (fromName && /^[.][a-z0-9]+$/.test(fromName)) return fromName;

  const type = (file.type || '').toLowerCase();
  if (type === 'image/jpeg') return '.jpg';
  if (type === 'image/png') return '.png';
  if (type === 'image/webp') return '.webp';
  if (type === 'image/gif') return '.gif';
  return '';
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, [Role.ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  const form = await req.formData();
  const files = form.getAll('files').filter((v): v is File => v instanceof File);

  const allowedFolders = new Set(['photography', 'decorations', 'farms']);
  const folderRaw = form.get('folder');
  const folder =
    typeof folderRaw === 'string' && allowedFolders.has(folderRaw.trim())
      ? folderRaw.trim()
      : '';

  if (!files.length) {
    return NextResponse.json({ message: 'files are required' }, { status: 400 });
  }

  const maxFiles = 50;
  if (files.length > maxFiles) {
    return NextResponse.json({ message: `Too many files (max ${maxFiles}).` }, { status: 400 });
  }

  const s3 = useS3Upload();
  if (!s3 && process.env.RENDER === 'true') {
    return NextResponse.json(
      {
        message:
          'Uploads on this host require S3. On Render, set S3_UPLOAD_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY (and optional AWS_REGION, S3_PUBLIC_BASE_URL). Disk uploads are not persisted.',
      },
      { status: 503 },
    );
  }

  const uploaded: { url: string; name: string; size: number; type: string }[] = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Only image uploads are supported.' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = safeExtFromFile(file) || '.img';
    const filename = `${crypto.randomUUID()}${ext}`;
    const objectKey = folder ? `uploads/${folder}/${filename}` : `uploads/${filename}`;

    let url: string;
    if (s3) {
      url = await uploadImageToS3({
        body: buf,
        contentType: file.type,
        objectKey,
      });
    } else {
      const diskDir = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
      await mkdir(diskDir, { recursive: true });
      const diskPath = path.join(diskDir, filename);
      await writeFile(diskPath, buf);
      url = folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;
    }

    uploaded.push({
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  }

  return NextResponse.json({ files: uploaded }, { status: 201 });
}
