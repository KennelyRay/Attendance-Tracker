'use client';

import { Button } from '@/components/ui/Button';

export type LeaveAttachmentPreview = {
  title: string;
  mimeType: string;
  previewUrl: string;
  downloadUrl?: string;
  sizeLabel?: string;
};

function isInlinePreviewable(mimeType: string) {
  return mimeType === 'application/pdf' || mimeType.startsWith('image/');
}

export function LeaveAttachmentPreviewModal({
  attachment,
  onClose,
}: {
  attachment: LeaveAttachmentPreview;
  onClose: () => void;
}) {
  const canInlinePreview = isInlinePreviewable(attachment.mimeType);

  return (
    <div className="app-overlay-scroll z-[60] bg-slate-950/80 backdrop-blur-sm">
      <div className="app-overlay-panel flex max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
        <div className="flex flex-col gap-3 border-b border-slate-800/80 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-100">{attachment.title}</div>
            <div className="mt-1 text-sm text-slate-400">
              {attachment.mimeType}
              {attachment.sizeLabel ? ` • ${attachment.sizeLabel}` : ''}
            </div>
          </div>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="min-h-[24rem] flex-1 overflow-auto bg-slate-900/60 p-5">
          {attachment.mimeType.startsWith('image/') ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.title}
              className="mx-auto max-h-[68vh] w-auto max-w-full rounded-xl border border-slate-800/80 bg-slate-950 object-contain"
            />
          ) : attachment.mimeType === 'application/pdf' ? (
            <iframe
              title={attachment.title}
              src={attachment.previewUrl}
              className="h-[68vh] w-full rounded-xl border border-slate-800/80 bg-white"
            />
          ) : (
            <div className="flex h-full min-h-[24rem] items-center justify-center">
              <div className="max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/80 px-6 py-5 text-center ring-1 ring-inset ring-white/5">
                <div className="text-base font-semibold text-slate-100">Preview Not Available</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">
                  This file type cannot be previewed inline. Use the download button below to open
                  it in an external app.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800/80 px-6 py-4 sm:flex-row sm:justify-end">
          {attachment.downloadUrl ? (
            <a
              href={attachment.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-400 sm:w-auto"
            >
              {canInlinePreview ? 'Open / Download' : 'Download File'}
            </a>
          ) : null}
          <Button className="w-full sm:w-auto" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
