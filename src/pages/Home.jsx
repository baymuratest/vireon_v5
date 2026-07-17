import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MediaGrid from '../components/MediaGrid';
import {
  getLatest, getOngoing, getTopAnime, getTopMovies, getTopSerials, getTopAll,
  getPoster, getTitle, getRating, getDescription, getGenres,
  deduplicate, CATEGORIES
} from '../utils/kodik';
import { getHistory, removeHistory } from '../utils/history';
import { useT } from '../i18n';
import s from './Home.module.css';

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function HeroBanner({ items }) {
  const t = useT();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % items.length), 7000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;
  const item   = items[idx];
  const poster = getPoster(item);
  const title  = getTitle(item);
  const desc   = getDescription(item);
  const rating = getRating(item);
  const genres = getGenres(item).slice(0, 4);
  const id     = item?.id;
  const ext    = item?.shikimori_id || item?.kinopoisk_id || id;

  return (
    <div className={s.hero}>
      {poster && <div className={s.heroBg} style={{ backgroundImage: `url(${poster})` }} />}
      <div className={s.heroOverlay} />

      <div className={s.heroContent}>
        <div className={s.heroMeta}>
          {item?.year && <span className={s.heroChip}>{item.year}</span>}
          {rating && <span className={s.heroChip}>⭐ {Number(rating).toFixed(1)}</span>}
          {item?.material_data?.anime_status === 'ongoing' && (
            <span className={s.heroChipLive}>● {t('home.hero.ongoing')}</span>
          )}
        </div>

        <h1 className={s.heroTitle}>{title}</h1>
        {genres.length > 0 && (
          <div className={s.heroGenres}>
            {genres.map(g => <span key={g}>{g}</span>)}
          </div>
        )}
        {desc && <p className={s.heroDesc}>{desc.slice(0, 220)}{desc.length > 220 ? '…' : ''}</p>}

        <div className={s.heroActions}>
          <Link to={`/watch/${encodeURIComponent(id)}?ext=${ext}`} className={s.heroPlay}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
            {t('home.hero.watch')}
          </Link>
          <Link to="/catalog" className={s.heroGhost}>
            {t('home.hero.catalog')}
          </Link>
        </div>
      </div>

      <div className={s.heroDots}>
        {items.map((_, i) => (
          <button
            key={i}
            className={`${s.heroDot} ${i === idx ? s.heroDotActive : ''}`}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryNav() {
  return (
    <div className={s.catNav}>
      {CATEGORIES.map(c => (
        <Link
          key={c.id}
          to={c.id === 'all' ? '/catalog' : `/catalog?cat=${c.id}`}
          className={s.catChip}
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}

function Section({ title, items, loading, seeAllHref }) {
  const t = useT();
  return (
    <section className={s.section}>
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-dot" />
          {title}
        </h2>
        {seeAllHref && <Link to={seeAllHref} className="see-all">{t('home.section.seeAll')}</Link>}
      </div>
      <MediaGrid items={items} loading={loading} skeletonCount={10} />
    </section>
  );
}

function ContinueWatching({ entries, onRemove }) {
  const t = useT();
  if (!entries.length) return null;
  return (
    <section className={s.section}>
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-dot" style={{ background: 'var(--accent, #26A17B)' }} />
          {t('home.section.continue')}
        </h2>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {entries.map(e => {
          const pct = e.duration > 0 ? Math.min(100, Math.round((e.time / e.duration) * 100)) : 0;
          const params = new URLSearchParams();
          if (e.ext) params.set('ext', e.ext);
          if (e.season != null) params.set('s', String(e.season));
          if (e.episode != null) params.set('e', String(e.episode));
          if (e.time) params.set('t', String(Math.floor(e.time)));
          const to = `/watch/${encodeURIComponent(e.id)}?${params.toString()}`;
          return (
            <div
              key={e.id}
              style={{
                position: 'relative',
                borderRadius: 14,
                overflow: 'hidden',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                transition: 'transform .3s var(--ease), border-color .3s var(--ease)',
              }}
            >
              <Link to={to} style={{ display: 'block' }}>
                <div style={{
                  aspectRatio: '16 / 9',
                  background: `#111 center/cover no-repeat ${e.poster ? `url(${e.poster})` : ''}`,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,.05) 40%, rgba(0,0,0,.85) 100%)',
                  }} />
                  <div style={{
                    position: 'absolute', left: 12, right: 12, bottom: 10,
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    textShadow: '0 2px 8px rgba(0,0,0,.6)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>{e.title}</div>
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(0,0,0,.6)', color: '#fff',
                    padding: '4px 10px', borderRadius: 999,
                    fontSize: 11, fontWeight: 600, letterSpacing: '.02em',
                  }}>
                    {e.season != null ? `S${e.season} · ` : ''}
                    {e.episode != null ? `E${e.episode}` : t('home.continue.resume')}
                  </div>
                </div>
                <div style={{
                  height: 3, background: 'rgba(255,255,255,.08)',
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'var(--accent, #26A17B)',
                    transition: 'width .3s var(--ease)',
                  }} />
                </div>
              </Link>
              <button
                onClick={() => onRemove(e.id)}
                aria-label={t('home.continue.remove')}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(0,0,0,.6)', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1,
                }}
              >×</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const t = useT();
  const [heroItems,  setHeroItems]  = useState([]);
  const [latest,     setLatest]     = useState([]);
  const [topAll,     setTopAll]     = useState([]);
  const [ongoing,    setOngoing]    = useState([]);
  const [topAnime,   setTopAnime]   = useState([]);
  const [topMovies,  setTopMovies]  = useState([]);
  const [topSerials, setTopSerials] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [history,    setHistory]    = useState(() => getHistory());

  useEffect(() => {
    const sync = () => setHistory(getHistory());
    window.addEventListener('vireon:history', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vireon:history', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [topAllR, latestR, ongoingR, topAnimeR, topMovR, topSerR] = await Promise.all([
          getTopAll(30),
          getLatest(40),
          getOngoing(30),
          getTopAnime(30),
          getTopMovies(30),
          getTopSerials(30),
        ]);
        // Shuffle each pool so home shows different items each visit.
        const top = shuffle(deduplicate(topAllR.results || []));
        setTopAll(top);
        setHeroItems(top.slice(0, 5));
        setLatest(shuffle(deduplicate(latestR.results || [])));
        setOngoing(shuffle(deduplicate(ongoingR.results || [])));
        setTopAnime(shuffle(deduplicate(topAnimeR.results || [])));
        setTopMovies(shuffle(deduplicate(topMovR.results || [])));
        setTopSerials(shuffle(deduplicate(topSerR.results || [])));
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Randomize the order of sections on each mount.
  const sections = useMemo(() => {
    const base = [
      { key: 'topAll',     title: t('home.section.topAll'),     items: topAll,     href: '/catalog?sort=kinopoisk_rating' },
      { key: 'topAnime',   title: t('home.section.topAnime'),   items: topAnime,   href: '/catalog?cat=anime&sort=shikimori_rating' },
      { key: 'topMovies',  title: t('home.section.topMovies'),  items: topMovies,  href: '/catalog?cat=movies&sort=imdb_rating' },
      { key: 'topSerials', title: t('home.section.topSerials'), items: topSerials, href: '/catalog?cat=serials&sort=kinopoisk_rating' },
      { key: 'ongoing',    title: t('home.section.ongoing'),    items: ongoing,    href: '/catalog?cat=anime&status=ongoing', skipWhenEmpty: true },
      { key: 'latest',     title: t('home.section.latest'),     items: latest,     href: '/catalog' },
    ];
    return shuffle(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topAll, topAnime, topMovies, topSerials, ongoing, latest]);

  const handleRemove = (id) => { removeHistory(id); setHistory(getHistory()); };

  return (
    <div className={s.page}>
      {heroItems.length > 0
        ? <HeroBanner items={heroItems} />
        : <div className={s.heroSkeleton}><div className="skeleton" style={{ width: '100%', height: '100%' }}/></div>
      }

      <div className={s.content}>
        <CategoryNav />

        <ContinueWatching entries={history.slice(0, 8)} onRemove={handleRemove} />

        {sections.map(sec => {
          if (sec.skipWhenEmpty && sec.items.length === 0) return null;
          return (
            <Section
              key={sec.key}
              title={sec.title}
              items={sec.items}
              loading={loading && sec.items.length === 0}
              seeAllHref={sec.href}
            />
          );
        })}

        <div className={s.bigCta}>
          <div>
            <h3>{t('home.cta.title')}</h3>
            <p>{t('home.cta.desc')}</p>
          </div>
          <Link to="/catalog" className="btn-primary">{t('home.cta.btn')}</Link>
        </div>

        {error && <div className="error-box"><p>{error}</p></div>}
      </div>
    </div>
  );
}
