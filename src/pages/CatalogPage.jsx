import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MediaGrid from '../components/MediaGrid';
import {
  getList, fetchNextPage, deduplicate,
  CATEGORIES, SORT_OPTIONS, STATUS_OPTIONS, ANIME_GENRES, AGE_OPTIONS,
} from '../utils/kodik';
import s from './CatalogPage.module.css';

export default function CatalogPage() {
  const [sp, setSp] = useSearchParams();
  const cat    = sp.get('cat')    || 'all';
  const sort   = sp.get('sort')   || 'updated_at';
  const status = sp.get('status') || '';
  const genre  = sp.get('genre')  || '';
  const year   = sp.get('year')   || '';
  const age    = sp.get('age')    || '';

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,    setError]    = useState('');
  const [nextPage, setNextPage] = useState(null);
  const [total,    setTotal]    = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const types = CATEGORIES.find(c => c.id === cat)?.types || '';

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(''); setItems([]); setNextPage(null);
      try {
        const params = { sort, order: 'desc', limit: 40 };
        if (types)  params.types = types;
        if (status) params.anime_status = status;
        if (genre)  params.anime_genres = genre;
        if (year)   params.year = year;
        if (age)    params.minimal_age = age;
        if (['shikimori_rating'].includes(sort)) params.has_field = 'shikimori_id';
        if (['imdb_rating'].includes(sort))      params.has_field = 'imdb_id';
        if (['kinopoisk_rating'].includes(sort)) params.has_field = 'kinopoisk_id';
        const res = await getList(params);
        setItems(deduplicate(res.results || []));
        setNextPage(res.next_page || null);
        setTotal(res.total || 0);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    load();
  }, [cat, sort, status, genre, year, age, types]);

  const loadMore = async () => {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchNextPage(nextPage);
      setItems(prev => deduplicate([...prev, ...(res.results || [])]));
      setNextPage(res.next_page || null);
    } catch (e) { setError(e.message); }
    finally { setLoadingMore(false); }
  };

  const set = useCallback((key, val) => {
    const p = new URLSearchParams(sp);
    if (val) p.set(key, val); else p.delete(key);
    setSp(p);
  }, [sp, setSp]);

  const currentCat = CATEGORIES.find(c => c.id === cat);

  // Year list
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1975 + 1 }, (_, i) => String(currentYear - i));

  return (
    <div className="page-wrapper">
      <div className="page-inner" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {/* Page header */}
        <div className={s.header}>
          <h1 className={s.title}>
            {currentCat?.icon} {currentCat?.label || 'Каталог'}
          </h1>
          {total > 0 && !loading && <p className={s.total}>{total.toLocaleString()} материалов</p>}
          <button className={s.filterToggle} onClick={() => setFiltersOpen(v => !v)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18M7 12h10M11 18h2"/>
            </svg>
            Фильтры {filtersOpen ? '▲' : '▼'}
          </button>
        </div>

        {/* Filters */}
        {filtersOpen && (
          <div className={s.filters}>
            {/* Category */}
            <FilterRow label="Раздел">
              {CATEGORIES.map(c => (
                <Pill key={c.id} active={cat === c.id} onClick={() => set('cat', c.id === 'all' ? '' : c.id)}>
                  {c.icon} {c.label}
                </Pill>
              ))}
            </FilterRow>

            {/* Sort */}
            <FilterRow label="Сортировка">
              {SORT_OPTIONS.map(o => (
                <Pill key={o.value} active={sort === o.value} onClick={() => set('sort', o.value)}>
                  {o.label}
                </Pill>
              ))}
            </FilterRow>

            {/* Status */}
            <FilterRow label="Статус">
              {STATUS_OPTIONS.map(o => (
                <Pill key={o.value} active={status === o.value} onClick={() => set('status', o.value)}>
                  {o.label}
                </Pill>
              ))}
            </FilterRow>

            {/* Genre */}
            <FilterRow label="Жанр">
              <Pill active={!genre} onClick={() => set('genre', '')}>Все</Pill>
              {ANIME_GENRES.map(g => (
                <Pill key={g} active={genre === g} onClick={() => set('genre', g)}>{g}</Pill>
              ))}
            </FilterRow>

            {/* Year */}
            <FilterRow label="Год">
              <Pill active={!year} onClick={() => set('year', '')}>Все</Pill>
              {years.map(y => (
                <Pill key={y} active={year === y} onClick={() => set('year', y)}>{y}</Pill>
              ))}
            </FilterRow>

            {/* Age rating */}
            <FilterRow label="Возрастной рейтинг">
              {AGE_OPTIONS.map(o => (
                <Pill key={o.value || 'any'} active={age === o.value} onClick={() => set('age', o.value)}>{o.label}</Pill>
              ))}
            </FilterRow>

            {/* Reset */}
            {(cat !== 'all' || sort !== 'updated_at' || status || genre || year || age) && (
              <button className={s.resetBtn} onClick={() => setSp({})}>
                ✕ Сбросить фильтры
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        <MediaGrid items={items} loading={loading} error={error} />

        {/* Load more */}
        {nextPage && !loading && (
          <div className={s.loadMoreWrap}>
            <button className={s.loadMoreBtn} onClick={loadMore} disabled={loadingMore}>
              {loadingMore
                ? <><span className={s.btnSpinner} /> Загрузка...</>
                : 'Загрузить ещё'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px', borderRadius: 20,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        background: active ? 'rgba(255,255,255,.2)' : 'var(--bg3)',
        color: active ? 'var(--primary-light)' : 'var(--text2)',
        transition: 'all .15s',
        fontFamily: 'var(--font-body)',
      }}
    >
      {children}
    </button>
  );
}
