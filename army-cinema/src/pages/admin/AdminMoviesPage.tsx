import { ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { formatDate, formatDuration, todayKey } from '@/lib/date';
import { usePageMeta } from '@/lib/seo';
import { youtubeEmbedUrl } from '@/lib/sanitize';
import { api, type MovieInput } from '@/services/api';
import { toAppError } from '@/services/errors';
import type { Movie, MovieStatus } from '@/types';
import { AdminPageHeader } from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Poster } from '@/components/ui/Poster';
import { ErrorState } from '@/components/ui/States';

const PALETTES: [string, string][] = [
  ['#5c1320', '#0b1731'],
  ['#1e3a5f', '#050b18'],
  ['#14532d', '#0b1731'],
  ['#7a3b06', '#101a33'],
  ['#8a2f6b', '#141b3a'],
  ['#0e4c6e', '#0a1226'],
];

const EMPTY: MovieInput = {
  title: '',
  tagline: '',
  description: '',
  genres: [],
  language: 'Hindi',
  durationMin: 150,
  certification: 'UA 13+',
  score: null,
  releaseDate: todayKey(),
  director: '',
  cast: [],
  posterUrl: null,
  trailerUrl: null,
  status: 'upcoming',
  featured: false,
  palette: PALETTES[1],
};

const STATUS_TONE: Record<MovieStatus, 'green' | 'info' | 'neutral'> = { now_showing: 'green', upcoming: 'info', archived: 'neutral' };
const STATUS_LABEL: Record<MovieStatus, string> = { now_showing: 'Now showing', upcoming: 'Upcoming', archived: 'Archived' };

function MovieForm({ initial, id, onDone }: { initial: MovieInput; id?: string; onDone: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ ...initial, genresText: initial.genres.join(', '), castText: initial.cast.join(', ') });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const upload = async (f: File | undefined) => {
    if (!f) return;
    setUploading(true);
    try {
      const url = await api.uploadPoster(f);
      setV((cur) => ({ ...cur, posterUrl: url }));
      toast.success('Poster uploaded', 'Optimised for web.');
    } catch (e) {
      toast.error('Upload failed', toAppError(e).message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.title.trim()) errs.title = 'Title is required.';
    if (!v.description.trim()) errs.description = 'Add a short description.';
    if (!(v.durationMin > 0 && v.durationMin < 400)) errs.durationMin = 'Enter minutes between 1 and 399.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.releaseDate)) errs.releaseDate = 'Pick a release date.';
    if (v.score != null && (v.score < 0 || v.score > 10)) errs.score = '0–10';
    if (v.trailerUrl && !youtubeEmbedUrl(v.trailerUrl)) errs.trailerUrl = 'Use a YouTube link.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
       
      const { genresText, castText, ...rest } = v;
      await api.saveMovie(
        {
          ...rest,
          genres: genresText.split(',').map((s) => s.trim()).filter(Boolean),
          cast: castText.split(',').map((s) => s.trim()).filter(Boolean),
        },
        id,
      );
      toast.success(id ? 'Movie updated' : 'Movie added', v.title);
      onDone();
    } catch (err) {
      toast.error('Couldn’t save movie', toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const preview: Movie = { ...v, id: 'preview', slug: '', createdAt: '', genres: v.genresText.split(',').map((s) => s.trim()).filter(Boolean), cast: [] };

  return (
    <form id="movie-form" onSubmit={submit} className="grid gap-5 md:grid-cols-[180px_1fr]" noValidate>
      <div className="space-y-3">
        <Poster movie={preview} className="rounded-2xl ring-1 ring-white/10" sizes="180px" />
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" id="poster-file" onChange={(e) => upload(e.target.files?.[0])} />
        <Button variant="secondary" block size="sm" loading={uploading} onClick={() => file.current?.click()}>
          <ImagePlus className="size-4" aria-hidden /> Upload poster
        </Button>
        {v.posterUrl && (
          <Button variant="ghost" block size="sm" onClick={() => setV({ ...v, posterUrl: null })}>
            Remove poster
          </Button>
        )}
        <fieldset>
          <legend className="text-xs text-fg-subtle">Placeholder colours</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PALETTES.map((p) => (
              <button
                type="button"
                key={p[0]}
                aria-label={`Palette ${p[0]}`}
                aria-pressed={v.palette[0] === p[0]}
                onClick={() => setV({ ...v, palette: p })}
                className="size-7 rounded-lg ring-2 ring-offset-2 ring-offset-ink-850 aria-pressed:ring-saffron ring-transparent"
                style={{ background: `linear-gradient(135deg, ${p[0]}, ${p[1]})` }}
              />
            ))}
          </div>
        </fieldset>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} error={errors.title} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Tagline" optional value={v.tagline ?? ''} onChange={(e) => setV({ ...v, tagline: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Description" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} error={errors.description} />
        </div>
        <Input label="Genres" hint="Comma separated" value={v.genresText} onChange={(e) => setV({ ...v, genresText: e.target.value })} />
        <Input label="Language" value={v.language} onChange={(e) => setV({ ...v, language: e.target.value })} />
        <Input label="Duration (minutes)" type="number" min={1} max={399} value={v.durationMin} onChange={(e) => setV({ ...v, durationMin: Number(e.target.value) })} error={errors.durationMin} />
        <Select label="Certificate" value={v.certification} onChange={(e) => setV({ ...v, certification: e.target.value })}>
          {['U', 'UA 7+', 'UA 13+', 'UA 16+', 'A'].map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Rating (0–10)" optional type="number" step="0.1" min={0} max={10} value={v.score ?? ''} onChange={(e) => setV({ ...v, score: e.target.value === '' ? null : Number(e.target.value) })} error={errors.score} />
        <Input label="Release date" type="date" value={v.releaseDate} onChange={(e) => setV({ ...v, releaseDate: e.target.value })} error={errors.releaseDate} />
        <Input label="Director" value={v.director} onChange={(e) => setV({ ...v, director: e.target.value })} />
        <Select label="Status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as MovieStatus })}>
          <option value="now_showing">Now showing</option>
          <option value="upcoming">Upcoming</option>
          <option value="archived">Archived</option>
        </Select>
        <div className="sm:col-span-2">
          <Input label="Cast" hint="Comma separated" value={v.castText} onChange={(e) => setV({ ...v, castText: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Trailer (YouTube URL)" optional value={v.trailerUrl ?? ''} onChange={(e) => setV({ ...v, trailerUrl: e.target.value || null })} error={errors.trailerUrl} />
        </div>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} className="size-5 accent-[#ff9933]" />
          Feature on the home page
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="submit" loading={busy}>{id ? 'Save changes' : 'Add movie'}</Button>
        </div>
      </div>
    </form>
  );
}

export default function AdminMoviesPage() {
  usePageMeta('Manage movies');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.listMovies(), []);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ movie?: Movie } | null>(null);
  const [deleting, setDeleting] = useState<Movie | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (data ?? []).filter((m) => !q || m.title.toLowerCase().includes(q.toLowerCase())), [data, q]);

  const columns: Column<Movie>[] = [
    {
      key: 'title',
      header: 'Movie',
      cell: (m) => (
        <div className="flex items-center gap-3">
          <Poster movie={m} className="w-10 shrink-0 rounded-md text-[8px]" sizes="40px" />
          <div className="min-w-0">
            <p className="truncate font-medium">{m.title}</p>
            <p className="truncate text-xs text-fg-subtle">{m.genres.join(', ')}</p>
          </div>
        </div>
      ),
    },
    { key: 'lang', header: 'Language', cell: (m) => m.language, hideSm: true },
    { key: 'dur', header: 'Duration', cell: (m) => formatDuration(m.durationMin), hideSm: true },
    { key: 'cert', header: 'Rating', cell: (m) => `${m.certification}${m.score != null ? ` · ${m.score}` : ''}`, hideSm: true },
    { key: 'rel', header: 'Release', cell: (m) => formatDate(m.releaseDate, { weekday: false }) },
    { key: 'status', header: 'Status', cell: (m) => <Badge tone={STATUS_TONE[m.status]}>{STATUS_LABEL[m.status]}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (m) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing({ movie: m })} aria-label={`Edit ${m.title}`}>
            <Pencil className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(m)} aria-label={`Delete ${m.title}`} className="hover:text-danger">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteMovie(deleting.id);
      toast.success('Movie deleted', deleting.title);
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error('Couldn’t delete', toAppError(e).message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toInput = ({ id, createdAt, ...rest }: Movie): MovieInput => rest;

  return (
    <>
      <AdminPageHeader
        title="Movies"
        description="Add films, upload posters and control what appears as now showing or coming soon."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="size-4" aria-hidden /> Add movie
          </Button>
        }
      />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
        <label htmlFor="movie-q" className="sr-only">Search movies</label>
        <input id="movie-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies…" className="h-11 w-full rounded-xl border border-white/10 bg-ink-950/60 pl-10 pr-3 text-[16px] focus:border-saffron/60 focus:outline-none" />
      </div>
      {error ? <ErrorState error={error} onRetry={reload} /> : <DataTable caption="Movies" columns={columns} rows={rows} rowKey={(m) => m.id} loading={loading} empty="No movies yet — add your first one." />}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.movie ? `Edit ${editing.movie.title}` : 'Add movie'} size="xl">
        {editing && (
          <MovieForm
            key={editing.movie?.id ?? 'new'}
            id={editing.movie?.id}
            initial={editing.movie ? toInput(editing.movie) : EMPTY}
            onDone={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.title}?`}
        message="This removes the movie and any of its shows without bookings. Movies with booking history can’t be deleted — archive them instead."
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
        busy={busy}
      />
    </>
  );
}
