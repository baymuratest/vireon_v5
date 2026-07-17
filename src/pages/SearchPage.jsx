import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MediaGrid from '../components/MediaGrid';
import { searchAll, deduplicate } from '../utils/kodik';
import s from './SearchPage.module.css';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const navigate = useNavigate();
  const [input, setInput] = useState(q);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setInput(q);
    if (!q.trim()) return;
    const run = async () => {
      setLoading(true); setError('');
      try {
        const res = await searchAll(q);
        const deduped = deduplicate(res.results || []);
        setResults(deduped);
        setTotal(res.total || deduped.length);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    run();
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (input.trim()) navigate(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-inner" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {/* Search bar */}
        <form className={s.searchBar} onSubmit={submit}>
          <svg className={s.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Поиск фильмов, аниме, сериалов..."
            className={s.searchInput}
            autoFocus
          />
          <button type="submit" className={s.searchBtn}>Найти</button>
        </form>

        {q && (
          <div className={s.header}>
            <h1 className={s.title}>Поиск: <span className={s.query}>«{q}»</span></h1>
            {!loading && total > 0 && <p className={s.count}>{total} результатов</p>}
          </div>
        )}

        {!q && (
          <div className="empty-box">
            <div className="empty-icon">🔍</div>
            <p>Введи название в строку поиска</p>
          </div>
        )}

        {q && <MediaGrid items={results} loading={loading} error={error} />}
      </div>
    </div>
  );
}
