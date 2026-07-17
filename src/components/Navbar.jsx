import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { CATEGORIES, searchQuick, getPoster, getTitle, getTypeLabel } from '../utils/kodik';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import s from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const [langMenu, setLangMenu] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const inputRef = useRef();
  const boxRef = useRef();
  const themeRef = useRef();
  const langRef = useRef();
  const { mode, resolved, setMode } = useTheme();
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setOpen(false); }, [pathname]);

  useEffect(() => {
    const fn = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeMenu(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangMenu(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchQuick(term, 8);
        setResults(res.results || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false); inputRef.current?.blur();
    }
  };

  const ThemeIcon = resolved === 'light'
    ? (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>)
    : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);

  return (
    <header className={`${s.header} ${scrolled ? s.scrolled : ''}`}>
      <div className={s.inner}>

        <Link to="/" className={s.logo}>
          <img src="/logo.png" alt="Vireon" className={s.logoImg} />
          <span className={s.logoText}>VIREON</span>
        </Link>

        <nav className={s.nav}>
          <NavLink to="/" end className={({isActive}) => `${s.navLink} ${isActive ? s.active : ''}`}>{t('nav.home')}</NavLink>
          <NavLink to="/catalog" end className={({isActive}) => `${s.navLink} ${isActive ? s.active : ''}`}>{t('nav.catalog')}</NavLink>
          {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
            <NavLink
              key={cat.id}
              to={`/catalog?cat=${cat.id}`}
              className={({isActive}) => `${s.navLink} ${isActive ? s.active : ''}`}
            >
              {cat.label}
            </NavLink>
          ))}
          <NavLink to="/author" className={({isActive}) => `${s.navLink} ${isActive ? s.active : ''}`}>{t('nav.author')}</NavLink>
        </nav>

        <div className={s.searchBox} ref={boxRef}>
          <form className={`${s.search} ${open ? s.searchOpen : ''}`} onSubmit={submit}>
            <svg className={s.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder={t('search.placeholder')}
              value={q}
              onChange={e => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              className={s.searchInput}
            />
            {q && <button type="button" className={s.searchClear} onClick={() => { setQ(''); setResults([]); inputRef.current?.focus(); }}>×</button>}
          </form>

          {open && q.trim().length >= 2 && (
            <div className={s.searchDropdown}>
              {loading && <div className={s.searchHint}>{t('search.searching')}</div>}
              {!loading && results.length === 0 && <div className={s.searchHint}>{t('search.empty')}</div>}
              {!loading && results.slice(0, 8).map(item => {
                const poster = getPoster(item);
                const title  = getTitle(item);
                const ext    = item.shikimori_id || item.kinopoisk_id || item.id;
                return (
                  <Link
                    key={item.id}
                    to={`/watch/${encodeURIComponent(item.id)}?ext=${ext}`}
                    className={s.searchItem}
                    onClick={() => setOpen(false)}
                  >
                    <div className={s.searchThumb}>
                      {poster ? <img src={poster} alt="" loading="lazy" /> : <div className={s.searchThumbFb}>▶</div>}
                    </div>
                    <div className={s.searchItemMeta}>
                      <div className={s.searchItemTitle}>{title}</div>
                      <div className={s.searchItemSub}>
                        {item.year && <span>{item.year}</span>}
                        <span>·</span>
                        <span>{getTypeLabel(item.type)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {!loading && results.length > 0 && (
                <button type="button" className={s.searchAll} onClick={submit}>
                  {t('search.all')} «{q.trim()}» →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Language toggle */}
        <div className={s.themeBox} ref={langRef}>
          <button
            className={s.themeBtn}
            onClick={() => setLangMenu(v => !v)}
            aria-label={t('lang.title')}
            style={{ minWidth: 42, fontWeight: 700, fontSize: 12, letterSpacing: '.06em' }}
          >
            {lang.toUpperCase()}
          </button>
          {langMenu && (
            <div className={s.themeMenu}>
              {[
                { id: 'en', label: 'English' },
                { id: 'ru', label: 'Русский' },
              ].map(o => (
                <button
                  key={o.id}
                  className={`${s.themeOpt} ${lang === o.id ? s.themeOptActive : ''}`}
                  onClick={() => { setLang(o.id); setLangMenu(false); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={s.themeBox} ref={themeRef}>
          <button className={s.themeBtn} onClick={() => setThemeMenu(v => !v)} aria-label={t('theme.title')}>
            {ThemeIcon}
          </button>
          {themeMenu && (
            <div className={s.themeMenu}>
              {[
                { id: 'auto',  label: t('theme.auto') },
                { id: 'light', label: t('theme.light') },
                { id: 'dark',  label: t('theme.dark') },
              ].map(o => (
                <button key={o.id} className={`${s.themeOpt} ${mode === o.id ? s.themeOptActive : ''}`} onClick={() => { setMode(o.id); setThemeMenu(false); }}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className={`${s.burger} ${mobileOpen ? s.burgerOpen : ''}`} onClick={() => setMobileOpen(v => !v)} aria-label={t('nav.menu')}>
          <span/><span/><span/>
        </button>
      </div>

      {mobileOpen && (
        <div className={s.mobile}>
          <form className={s.mobileSearch} onSubmit={submit}>
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={q}
              onChange={e => setQ(e.target.value)}
              className={s.searchInput}
              autoFocus
            />
          </form>
          <NavLink to="/" end className={s.mobileLink}>{t('nav.home')}</NavLink>
          <NavLink to="/catalog" className={s.mobileLink}>{t('nav.catalog')}</NavLink>
          {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
            <NavLink key={cat.id} to={`/catalog?cat=${cat.id}`} className={s.mobileLink}>
              {cat.label}
            </NavLink>
          ))}
          <NavLink to="/author" className={s.mobileLink}>{t('nav.author')}</NavLink>
          <NavLink to="/support" className={s.mobileLink}>{t('nav.support')} ❤</NavLink>
        </div>
      )}
    </header>
  );
}
