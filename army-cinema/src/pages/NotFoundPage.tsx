import { Compass } from 'lucide-react';
import { usePageMeta } from '@/lib/seo';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';

export default function NotFoundPage() {
  usePageMeta('Page not found');
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<Compass className="size-6" />}
        title="Off the map"
        message="We couldn’t find that page. It may have moved, or the link may be broken."
        action={<ButtonLink to="/">Back to home</ButtonLink>}
      />
    </div>
  );
}
