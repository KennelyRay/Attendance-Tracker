import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSessionData } from '@/lib/session';
import { ensureLeaveSystemSchema } from '@/lib/leave-system';

function getRequestId(request: NextRequest) {
  return request.headers.get('x-request-id') ?? crypto.randomUUID();
}

function sanitizeDownloadName(fileName: string) {
  return fileName.replace(/[^\w.\-() ]+/g, '_');
}

type RouteContext = {
  params: Promise<{
    attachmentId: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const requestId = getRequestId(request);

  try {
    const session = await getSessionData();

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attachmentId } = await params;
    const attachmentNumericId = Number(attachmentId);

    if (!Number.isInteger(attachmentNumericId)) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const pool = getPool();
    await ensureLeaveSystemSchema(pool);
    const result = await pool.query(
      `
        SELECT
          a.id,
          a.file_name,
          a.mime_type,
          a.file_data,
          lr.user_id
        FROM leave_request_attachments a
        JOIN leave_requests lr ON lr.id = a.leave_request_id
        WHERE a.id = $1
      `,
      [attachmentNumericId]
    );

    const attachment = result.rows[0] as
      | {
          id: number;
          file_name: string;
          mime_type: string;
          file_data: Buffer;
          user_id: number;
        }
      | undefined;

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    if (!session.user.isAdmin && attachment.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const safeFileName = sanitizeDownloadName(attachment.file_name);

    return new NextResponse(new Uint8Array(attachment.file_data), {
      status: 200,
      headers: {
        'Content-Type': attachment.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    console.error('Leave attachment route error', {
      code: 'LEAVE_ATTACHMENT_GET_FAILED',
      requestId,
    });

    return NextResponse.json(
      { error: 'Unable to download attachment', requestId },
      { status: 500 }
    );
  }
}
