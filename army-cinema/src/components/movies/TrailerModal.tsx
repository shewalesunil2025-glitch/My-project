import { Modal } from '@/components/ui/Modal';
import { youtubeEmbedUrl } from '@/lib/sanitize';

export function TrailerModal({ open, onClose, title, url }: { open: boolean; onClose: () => void; title: string; url?: string | null }) {
  const src = youtubeEmbedUrl(url);
  return (
    <Modal open={open} onClose={onClose} title={`${title} — Trailer`} size="xl">
      {src ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={src}
            title={`${title} trailer`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <p className="text-fg-muted">The trailer for this title hasn’t been added yet.</p>
      )}
    </Modal>
  );
}
