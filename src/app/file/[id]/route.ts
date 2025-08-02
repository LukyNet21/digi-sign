import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";
import { files } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const fileId = (await params).id

  const file = await db.query.files.findFirst({
    where: eq(files.id, Number(fileId))
  })

  if (!file) {
    return new NextResponse(null, { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'media/uploads', file.path);

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.fileName}"`
      }
    })
  } catch (e) {
    return new NextResponse(null, { status: 404 })
  }
}
