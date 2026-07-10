"use client";

import { Maximize2 } from "lucide-react";

interface VideoPreviewProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
}

export default function VideoPreview({ title, subtitle, imageUrl, videoUrl, duration }: VideoPreviewProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-bold tracking-wider text-purple-400">PREVIEW (9:16)</p>

      <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-700 bg-black">
        {videoUrl ? (
          <video controls src={videoUrl} className="h-full w-full object-cover" />
        ) : (
          <>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={title ?? "Preview"} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black" />
            )}

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/90 to-transparent p-4 text-center">
              {title && (
                <p className="text-lg font-black leading-tight text-white drop-shadow-lg">{title}</p>
              )}
              {subtitle && <p className="text-xs font-semibold text-slate-200">{subtitle}</p>}
            </div>

            {!imageUrl && !title && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-slate-500">
                Generate a video to see the preview here.
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 text-slate-500">
        <Maximize2 className="h-4 w-4" />
        {duration != null && (
          <span className="text-xs text-slate-400">Total: {duration}s</span>
        )}
      </div>
    </div>
  );
}
