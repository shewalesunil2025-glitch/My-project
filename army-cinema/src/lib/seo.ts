import { useEffect } from 'react';

const SITE = 'Veer Cinema';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/** Sets the document title, description and Open Graph tags for a page. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const full = title ? `${title} · ${SITE}` : `${SITE} — Movie tickets for Army personnel & families`;
    document.title = full;
    setMeta('property', 'og:title', full);
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
    }
    setMeta('property', 'og:url', window.location.href);
  }, [title, description]);
}
