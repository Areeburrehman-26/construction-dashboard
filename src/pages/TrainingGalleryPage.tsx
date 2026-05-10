import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  crackFolderImages,
  ppeFolderImages,
} from "../utils/trainingFolderAssets";

type LightboxState = {
  url: string;
  name: string;
} | null;

function ImageSection({
  title,
  description,
  images,
}: {
  title: string;
  description: string;
  images: { name: string; url: string }[];
}) {
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      {images.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No images found in this folder for the build.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((item) => (
            <li key={item.url}>
              <button
                type="button"
                onClick={() => setLightbox({ url: item.url, name: item.name })}
                className="group w-full rounded-lg border border-slate-200 bg-slate-50 text-left transition hover:border-amber-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="flex aspect-video max-h-64 items-center justify-center overflow-hidden rounded-t-lg bg-white p-2">
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="max-h-60 w-full object-contain"
                  />
                </div>
                <p className="truncate px-3 py-2 text-xs font-medium text-slate-700 group-hover:text-slate-900">
                  {item.name}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.name}
          onClick={close}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl rounded-xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-2 top-2 rounded-lg bg-slate-900/80 p-2 text-white hover:bg-slate-900"
              aria-label="Close preview"
            >
              <X className="size-5" />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.name}
              className="max-h-[85vh] w-full object-contain"
            />
            <p className="mt-2 truncate px-2 text-center text-sm font-medium text-slate-700">
              {lightbox.name}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function TrainingGalleryPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Model training visuals</h1>
        <p className="mt-1 text-sm text-slate-600">
          Images from the <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">ppe/</code> and{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">crack/</code> folders (curves,
          batches, validation plots). Click a thumbnail for a larger view.
        </p>
      </section>

      <ImageSection
        title="PPE detector folder"
        description="Training and validation outputs for the worker PPE model."
        images={ppeFolderImages}
      />

      <ImageSection
        title="Crack detector folder"
        description="Training and validation outputs for the structural crack model."
        images={crackFolderImages}
      />
    </div>
  );
}
