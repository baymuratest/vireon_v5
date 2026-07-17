import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  getByKodikId, getById, getByKinopoiskId,
  getPoster, getTitle, getRatingLabel, getAllRatings,
  getGenres, getDescription, buildEmbedUrl,
  getTypeLabel, getAgeRating, getStudios, getStudioLogo,
} from '../utils/kodik';
import { upsertHistory } from '../utils/history';
import s from './WatchPage.module.css';

/* ─── Player API hook ─────────────────────────────────────── */
function useKodikPlayer(iframeRef, onEnded) {
  const [info, setInfo] = useState({ episode: null, season: null, time: 0, duration: 0, playing: false });
  const endedRef = useRef(onEnded);
  useEffect(() => { endedRef.current = onEnded; }, [onEnded]);
  useEffect(() => {
    const handler = (e) => {
      const { key, value } = e.data || {};
      if (!key) return;
      if (key === 'kodik_player_time_update')      setInfo(p => ({ ...p, time: value }));
      if (key === 'kodik_player_duration_update')  setInfo(p => ({ ...p, duration: value }));
      if (key === 'kodik_player_play')             setInfo(p => ({ ...p, playing: true }));
      if (key === 'kodik_player_pause')            setInfo(p => ({ ...p, playing: false }));
      if (key === 'kodik_player_video_ended') {
        setInfo(p => ({ ...p, playing: false }));
        try { endedRef.current?.(); } catch {}
      }
      if (key === 'kodik_player_current_episode')  setInfo(p => ({ ...p, ...value }));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
  const send = useCallback((value) => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage({ key: 'kodik_player_api', value }, '*');
  }, [iframeRef]);
  return {
    info,
    goEp: (season, episode) => send({ method: 'change_episode', season, episode }),
  };
}


/* ─── Translation selector — shown ONLY inside player area ── */
function PlayerTranslations({ translations, selectedId, onSelect }) {
  const [tab, setTab] = useState('voice');
  const [open, setOpen] = useState(false);
  if (!translations || translations.length < 2) return null;

  const voice = translations.filter(t => t?.translation?.type === 'voice');
  const subs  = translations.filter(t => t?.translation?.type === 'subtitles');
  const list  = tab === 'voice' ? voice : subs;
  const cur   = translations.find(t => t.id === selectedId);

  return (
    <div className={s.playerTrans}>
      <button className={s.playerTransBtn} onClick={() => setOpen(v => !v)}>
        <span>{cur?.translation?.title || 'Озвучка'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && (
        <div className={s.playerTransDrop}>
          <div className={s.playerTransTabs}>
            {voice.length > 0 && (
              <button className={`${s.playerTransTab} ${tab === 'voice' ? s.playerTransTabActive : ''}`} onClick={() => setTab('voice')}>
                Озвучка ({voice.length})
              </button>
            )}
            {subs.length > 0 && (
              <button className={`${s.playerTransTab} ${tab === 'subtitles' ? s.playerTransTabActive : ''}`} onClick={() => setTab('subtitles')}>
                Субтитры ({subs.length})
              </button>
            )}
          </div>
          <div className={s.playerTransList}>
            {list.map(t => (
              <button
                key={t.id}
                className={`${s.playerTransItem} ${t.id === selectedId ? s.playerTransItemActive : ''}`}
                onClick={() => { onSelect(t); setOpen(false); }}
              >
                <span>{t.translation?.title || '—'}</span>
                {t.quality && <span className={s.playerTransQ}>{t.quality.replace('WEB-DLRip ', '').replace('WEB-DL ', '')}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Episodes ────────────────────────────────────────────── */
function EpisodesView({ seasons, seasonKeys, playerGoEp, currentEp, currentSeason }) {
  const [curS, setCurS] = useState(seasonKeys[seasonKeys.length - 1] || seasonKeys[0]);
  const episodes = seasons[curS]?.episodes || {};
  const epKeys   = Object.keys(episodes).sort((a, b) => Number(a) - Number(b));
  return (
    <div className={s.epSection}>
      {seasonKeys.length > 1 && (
        <div className={s.seasonRow}>
          {seasonKeys.map(sk => (
            <button key={sk} className={`${s.seasonBtn} ${curS === sk ? s.seasonBtnActive : ''}`} onClick={() => setCurS(sk)}>
              Сезон {sk}
            </button>
          ))}
        </div>
      )}
      <div className={s.epGrid}>
        {epKeys.map(ep => {
          const isActive = String(currentEp) === ep && String(currentSeason) === curS;
          const epTitle  = episodes[ep]?.title;
          const shots    = episodes[ep]?.screenshots;
          return (
            <button
              key={ep}
              className={`${s.epCard} ${isActive ? s.epCardActive : ''}`}
              onClick={() => playerGoEp(Number(curS), Number(ep))}
              title={epTitle || `Серия ${ep}`}
            >
              {shots?.[0] && <div className={s.epThumb}><img src={shots[0]} alt="" loading="lazy" /></div>}
              <div className={s.epInfo}>
                <span className={s.epNum}>{ep}</span>
                {epTitle && <span className={s.epTitle}>{epTitle}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function WatchPage() {
  const { id }   = useParams();
  const [sp]     = useSearchParams();
  const ext      = sp.get('ext') || '';
  const [allResults, setAllResults] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [playerOn,   setPlayerOn]   = useState(false);
  const [tab,        setTab]        = useState('episodes');
  const [liked,      setLiked]      = useState(false);
  const [inList,     setInList]     = useState(false);

  const iframeRef = useRef(null);
  const goEpRef = useRef(null);
  const selectedRef = useRef(null);
  const infoRef = useRef(null);
  const historyMetaRef = useRef(null);

  const onEnded = useCallback(() => {
    const sel = selectedRef.current;
    const cur = infoRef.current;
    const go = goEpRef.current;
    if (!sel || !cur || !go) return;
    const seasons = sel?.seasons || {};
    const seasonKeys = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));
    if (!seasonKeys.length) return;

    const curSeason = String(cur.season ?? seasonKeys[0]);
    const seasonObj = seasons[curSeason] || seasons[seasonKeys[0]];
    if (!seasonObj) return;
    const epKeys = Object.keys(seasonObj.episodes || {}).sort((a, b) => Number(a) - Number(b));
    const curIdx = epKeys.indexOf(String(cur.episode));

    if (curIdx !== -1 && curIdx < epKeys.length - 1) {
      go(Number(curSeason), Number(epKeys[curIdx + 1]));
      return;
    }
    // Move to first ep of next season
    const sIdx = seasonKeys.indexOf(curSeason);
    if (sIdx !== -1 && sIdx < seasonKeys.length - 1) {
      const nextSeason = seasonKeys[sIdx + 1];
      const nextEpKeys = Object.keys(seasons[nextSeason]?.episodes || {}).sort((a, b) => Number(a) - Number(b));
      if (nextEpKeys[0]) go(Number(nextSeason), Number(nextEpKeys[0]));
    }
  }, []);

  const { info, goEp } = useKodikPlayer(iframeRef, onEnded);
  const rawId = decodeURIComponent(id);

  useEffect(() => { goEpRef.current = goEp; }, [goEp]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { infoRef.current = info; }, [info]);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(''); setPlayerOn(false);
      try {
        let res;
        try { res = await getByKodikId(rawId); } catch {}
        if (!res?.results?.length && ext && /^\d+$/.test(ext)) {
          try { res = await getById(ext); } catch {}
        }
        if (!res?.results?.length && ext && /^\d+$/.test(ext)) {
          try { res = await getByKinopoiskId(ext); } catch {}
        }
        if (!res?.results?.length) throw new Error('Материал не найден');
        setAllResults(res.results);
        setSelected(res.results[0]);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    load();
  }, [rawId, ext]);

  // Save meta as soon as an item is loaded, and again whenever episode/time changes.
  useEffect(() => {
    if (!selected) return;
    const meta = {
      id: rawId,
      ext,
      title: getTitle(selected),
      poster: getPoster(selected),
      type: selected?.type,
      year: selected?.year || selected?.material_data?.year,
    };
    historyMetaRef.current = meta;
    upsertHistory({ ...meta });
  }, [selected, rawId, ext]);

  useEffect(() => {
    if (!historyMetaRef.current) return;
    if (info.episode == null && info.time < 5) return;
    upsertHistory({
      ...historyMetaRef.current,
      episode: info.episode ?? null,
      season: info.season ?? null,
      time: Math.floor(info.time || 0),
      duration: Math.floor(info.duration || 0),
    });
    // Throttle by only writing on episode boundary or every ~15s (React state change frequency is limited by player messages).
  }, [info.episode, info.season, Math.floor(info.time / 15)]);

  const handleSelectTranslation = (t) => {
    setSelected(t);
    setPlayerOn(false);
    setTimeout(() => setPlayerOn(true), 80);
  };


  if (loading) return (
    <div className="page-wrapper"><div className="spinner-wrap" style={{ minHeight: '80vh' }}><div className="spinner"/></div></div>
  );
  if (error) return (
    <div className="page-wrapper">
      <div className="page-inner" style={{ paddingTop: 80 }}>
        <div className="error-box">
          <h3>Не удалось загрузить</h3>
          <p>{error}</p>
          <Link to="/" className="btn-ghost" style={{ marginTop: 20, display: 'inline-flex' }}>← На главную</Link>
        </div>
      </div>
    </div>
  );
  if (!selected) return null;

  const mat        = selected?.material_data || {};
  const poster     = getPoster(selected);
  const title      = getTitle(selected);
  const titleOrig  = selected?.title_orig || mat.title_en;
  const desc       = getDescription(selected);
  const rating     = getRatingLabel(selected);
  const allRatings = getAllRatings(selected);
  const genres     = getGenres(selected);
  const year       = selected?.year || mat.year;
  const eps        = selected?.episodes_count;
  const type       = selected?.type;
  const status     = mat.anime_status;
  const ageRating  = getAgeRating(selected);
  const tagline    = mat.tagline;
  const studios    = getStudios(selected);
  const countries  = mat.countries || [];
  const duration   = mat.duration;
  const directors  = mat.directors?.slice(0, 3) || [];
  const actors     = mat.actors?.slice(0, 12) || [];
  const writers    = mat.writers?.slice(0, 3) || [];
  const composers  = mat.composers?.slice(0, 2) || [];
  const nextEp     = mat.next_episode_at;
  const epsAired   = mat.episodes_aired;
  const epsTotal   = mat.episodes_total || eps;
  const lastSeason = selected?.last_season;
  const seasons    = selected?.seasons || {};
  const seasonKeys = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));
  const screenshots = selected?.screenshots || mat.screenshots || [];

  const resumeSeason = sp.get('s');
  const resumeEp = sp.get('e');
  const baseLink = selected?.link;
  let embedUrl = buildEmbedUrl(baseLink);
  if (embedUrl && poster) embedUrl += (embedUrl.includes('?') ? '&' : '?') + `poster=${encodeURIComponent(poster)}`;
  if (embedUrl) embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'auto_translation=false';
  if (embedUrl && resumeSeason) embedUrl += `&season=${encodeURIComponent(resumeSeason)}`;
  if (embedUrl && resumeEp) embedUrl += `&episode=${encodeURIComponent(resumeEp)}`;


  const statusMap = {
    ongoing:  { label: 'Онгоинг',  color: 'var(--green)', dot: true },
    released: { label: 'Завершён', color: 'var(--info)',  dot: false },
    anons:    { label: 'Анонс',    color: 'var(--gold)',  dot: false },
  };
  const si = statusMap[status];
  const progressPct = epsAired && epsTotal ? Math.round((epsAired / epsTotal) * 100) : null;

  // External links
  const externalLinks = [
    mat.shikimori_id && { name: 'Shikimori', url: `https://shikimori.one/animes/${mat.shikimori_id}` },
    mat.kinopoisk_id && { name: 'КиноПоиск', url: `https://www.kinopoisk.ru/film/${mat.kinopoisk_id}/` },
    mat.imdb_id && { name: 'IMDb', url: `https://www.imdb.com/title/${mat.imdb_id}/` },
    mat.mydramalist_id && { name: 'MyDramaList', url: `https://mydramalist.com/${mat.mydramalist_id}` },
  ].filter(Boolean);

  return (
    <div className={s.page}>
      {poster && <div className={s.backdrop} style={{ backgroundImage: `url(${poster})` }}/>}
      <div className={s.backdropFade}/>

      <div className={s.wrap}>
        <nav className={s.crumb}>
          <Link to="/">Главная</Link><span>›</span>
          <Link to="/catalog">Каталог</Link><span>›</span>
          <span className={s.crumbCurrent}>{title}</span>
        </nav>

        <div className={s.main}>
          {/* Poster column */}
          <aside className={s.aside}>
            <div className={s.posterWrap}>
              {poster
                ? <img src={poster} alt={title} className={s.poster}/>
                : <div className={s.posterFb}>▶</div>
              }
              {rating && (
                <div className={s.ratingBadge}>
                  ⭐ {Number(rating.val).toFixed(1)}
                  <span>{rating.src}</span>
                </div>
              )}
              {si && (
                <div className={s.statusBadge} style={{ background: 'rgba(0,0,0,.6)', color: si.color }}>
                  {si.dot && <span className={s.statusDot} style={{ background: si.color }}/>}
                  {si.label}
                </div>
              )}
              {ageRating && <div className={s.ageBadge}>{ageRating}</div>}
            </div>

            <div className={s.actionRow}>
              <button className={`${s.actionBtn} ${liked ? s.actionBtnOn : ''}`} onClick={() => setLiked(v => !v)}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {liked ? 'В избранном' : 'Избранное'}
              </button>
              <button className={`${s.actionBtn} ${inList ? s.actionBtnOn : ''}`} onClick={() => setInList(v => !v)}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                {inList ? 'Смотрю' : 'В список'}
              </button>
            </div>

            <div className={s.quickStats}>
              {year      && <div className={s.qs}><span>Год</span><b>{year}</b></div>}
              {type      && <div className={s.qs}><span>Тип</span><b>{getTypeLabel(type)}</b></div>}
              {duration  && <div className={s.qs}><span>Длина</span><b>{duration} мин</b></div>}
              {epsTotal  && <div className={s.qs}><span>Эпизоды</span><b>{epsAired !== undefined ? `${epsAired}/${epsTotal}` : epsTotal}</b></div>}
              {lastSeason > 1 && <div className={s.qs}><span>Сезоны</span><b>{lastSeason}</b></div>}
              {ageRating && <div className={s.qs}><span>Возраст</span><b>{ageRating}</b></div>}
              {countries[0] && <div className={s.qs}><span>Страна</span><b>{countries[0]}</b></div>}
            </div>

            {progressPct !== null && (
              <div className={s.progressWrap}>
                <div className={s.progressLabel}><span>Выпущено</span><span>{epsAired}/{epsTotal}</span></div>
                <div className={s.progressBar}><div className={s.progressFill} style={{ width: progressPct + '%' }}/></div>
              </div>
            )}

            {/* Ratings on multiple platforms */}
            {allRatings.length > 0 && (
              <div className={s.ratingsBox}>
                <p className={s.boxTitle}>Оценки</p>
                {allRatings.map(r => (
                  <div key={r.src} className={s.ratingsRow}>
                    <span className={s.ratingsSrc}>{r.src}</span>
                    <span className={s.ratingsVal}>
                      <b>{Number(r.val).toFixed(2)}</b>
                      {r.votes ? <i>{Number(r.votes).toLocaleString()} голосов</i> : null}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* External links */}
            {externalLinks.length > 0 && (
              <div className={s.linksBox}>
                <p className={s.boxTitle}>Ссылки</p>
                <div className={s.linksGrid}>
                  {externalLinks.map(l => (
                    <a key={l.name} href={l.url} target="_blank" rel="noreferrer" className={s.extLink}>
                      {l.name} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Info column */}
          <div className={s.info}>
            <div className={s.typeLine}>
              <span className={s.typeChip}>{getTypeLabel(type)}</span>
              {ageRating && <span className={s.ageChip}>{ageRating}</span>}
              {si && (
                <span className={s.statusChip} style={{ color: si.color }}>
                  {si.dot && '● '}{si.label}
                </span>
              )}
              {studios[0] && (
                <span className={s.studioChip}>
                  <img src={getStudioLogo(studios[0])} alt="" onError={(e)=>{e.currentTarget.style.display='none'}}/>
                  {studios[0]}
                </span>
              )}
            </div>

            <h1 className={s.title}>{title}</h1>
            {titleOrig && titleOrig !== title && <p className={s.titleOrig}>{titleOrig}</p>}
            {tagline && <p className={s.tagline}>«{tagline}»</p>}

            {genres.length > 0 && (
              <div className={s.genreRow}>
                {genres.map(g => (
                  <Link key={g} to={`/catalog?genre=${encodeURIComponent(g)}`} className={s.genreTag}>{g}</Link>
                ))}
              </div>
            )}

            <div className={s.metaGrid}>
              {countries.length > 0 && <MetaItem label="Страна"    value={countries.join(', ')} />}
              {studios.length > 0   && <MetaItem label="Студия"    value={studios.join(', ')} />}
              {directors.length > 0 && <MetaItem label="Режиссёр"  value={directors.join(', ')} />}
              {writers.length > 0   && <MetaItem label="Сценарий"  value={writers.join(', ')} />}
              {composers.length > 0 && <MetaItem label="Музыка"    value={composers.join(', ')} />}
              {nextEp               && <MetaItem label="Следующий эп." value={new Date(nextEp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} accent />}
              {mat.aired_at         && <MetaItem label="Начало"    value={new Date(mat.aired_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })} />}
              {mat.released_at      && <MetaItem label="Конец"     value={new Date(mat.released_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })} />}
              {mat.anime_kind       && <MetaItem label="Вид"       value={mat.anime_kind.toUpperCase()} />}
              {mat.anime_licensed_by?.length && <MetaItem label="Лицензия RU" value={mat.anime_licensed_by.join(', ')} />}
            </div>

            {desc && <ExpandableText text={desc} />}

            {nextEp && si?.dot && (
              <div className={s.nextEpBanner}>
                <span className={s.nextEpDot}/>
                <span>Следующий эпизод: <b>{new Date(nextEp).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</b></span>
              </div>
            )}
          </div>
        </div>

        {/* ── PLAYER ── (only place where translation/sub is selectable) */}
        <section id="player-section" className={s.playerSection}>
          <div className={s.playerHeader}>
            <div className={s.playerHeaderLeft}>
              <span className={s.playerTitle}>
                {info.episode ? `Сезон ${info.season || 1} · Серия ${info.episode}` : 'Плеер'}
              </span>
              {info.duration > 0 && (
                <span className={s.playerTime}>
                  {Math.floor(info.time / 60)}:{String(Math.floor(info.time % 60)).padStart(2, '0')} / {Math.floor(info.duration / 60)}:{String(Math.floor(info.duration % 60)).padStart(2, '0')}
                </span>
              )}
            </div>
            <PlayerTranslations
              translations={allResults}
              selectedId={selected?.id}
              onSelect={handleSelectTranslation}
            />
          </div>

          {playerOn && embedUrl ? (
            <div className={s.playerWrap}>
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className={s.playerIframe}
                allowFullScreen
                allow="autoplay; fullscreen"
                title={title}
                frameBorder="0"
                scrolling="no"
              />
            </div>
          ) : (
            <button className={s.playerPlaceholder} onClick={() => setPlayerOn(true)}
              style={poster ? { backgroundImage: `url(${poster})` } : {}}
            >
              <div className={s.placeholderOverlay}/>
              <div className={s.placeholderContent}>
                <div className={s.bigPlayBtn}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <p className={s.placeholderText}>Нажми для просмотра</p>
              </div>
            </button>
          )}
        </section>

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Кадры</h2>
            <div className={s.shotsGrid}>
              {screenshots.slice(0, 12).map((sh, i) => (
                <a key={i} href={sh} target="_blank" rel="noreferrer" className={s.shot}>
                  <img src={sh} alt={`Кадр ${i+1}`} loading="lazy" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className={s.tabs}>
          <div className={s.tabBar}>
            {seasonKeys.length > 0 && (
              <button className={`${s.tabBtn} ${tab === 'episodes' ? s.tabBtnActive : ''}`} onClick={() => setTab('episodes')}>
                Эпизоды {eps ? `(${eps})` : ''}
              </button>
            )}
            {actors.length > 0 && (
              <button className={`${s.tabBtn} ${tab === 'cast' ? s.tabBtnActive : ''}`} onClick={() => setTab('cast')}>
                В ролях
              </button>
            )}
            <button className={`${s.tabBtn} ${tab === 'details' ? s.tabBtnActive : ''}`} onClick={() => setTab('details')}>
              Подробности
            </button>
          </div>

          {tab === 'episodes' && seasonKeys.length > 0 && (
            <EpisodesView
              seasons={seasons}
              seasonKeys={seasonKeys}
              playerGoEp={goEp}
              currentEp={info.episode}
              currentSeason={info.season}
            />
          )}

          {tab === 'cast' && actors.length > 0 && (
            <div className={s.castGrid}>
              {actors.map(a => (
                <div key={a} className={s.castCard}>
                  <div className={s.castAvatar}>{a[0]}</div>
                  <span className={s.castName}>{a}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'details' && (
            <div className={s.detailsGrid}>
              {year                  && <DetailRow k="Год выпуска" v={year} />}
              {countries.join(', ')   && <DetailRow k="Страна" v={countries.join(', ')} />}
              {duration               && <DetailRow k="Продолжительность" v={`${duration} мин.`} />}
              {studios.join(', ')     && <DetailRow k="Студия" v={studios.join(', ')} />}
              {directors.join(', ')   && <DetailRow k="Режиссёр" v={directors.join(', ')} />}
              {writers.join(', ')     && <DetailRow k="Сценарий" v={writers.join(', ')} />}
              {composers.join(', ')   && <DetailRow k="Музыка" v={composers.join(', ')} />}
              {ageRating              && <DetailRow k="Возрастной рейтинг" v={ageRating} />}
              {mat?.premiere_ru       && <DetailRow k="Премьера (RU)" v={new Date(mat.premiere_ru).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />}
              {mat?.premiere_world    && <DetailRow k="Мировая премьера" v={new Date(mat.premiere_world).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />}
              {mat?.kinopoisk_rating  && <DetailRow k="КиноПоиск" v={`${Number(mat.kinopoisk_rating).toFixed(1)} (${Number(mat.kinopoisk_votes||0).toLocaleString()} голосов)`} />}
              {mat?.imdb_rating       && <DetailRow k="IMDb" v={`${Number(mat.imdb_rating).toFixed(1)} (${Number(mat.imdb_votes||0).toLocaleString()} голосов)`} />}
              {mat?.shikimori_rating  && <DetailRow k="Shikimori" v={`${Number(mat.shikimori_rating).toFixed(2)} (${Number(mat.shikimori_votes||0).toLocaleString()} голосов)`} />}
              {mat?.anime_kind        && <DetailRow k="Вид аниме" v={mat.anime_kind.toUpperCase()} />}
              {mat?.anime_licensed_by?.length && <DetailRow k="Лицензия RU" v={mat.anime_licensed_by.join(', ')} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, accent }) {
  return (
    <div className={s.metaItem}>
      <span className={s.metaItemLabel}>{label}</span>
      <span className={s.metaItemValue} style={accent ? { color: 'var(--green)' } : {}}>{value}</span>
    </div>
  );
}
function DetailRow({ k, v }) {
  return (
    <div className={s.detailRow}>
      <span className={s.detailKey}>{k}</span>
      <span className={s.detailVal}>{v}</span>
    </div>
  );
}
function ExpandableText({ text }) {
  const [exp, setExp] = useState(false);
  const short = text.length > 320;
  const shown = !short || exp ? text : text.slice(0, 320) + '…';
  return (
    <div className={s.descWrap}>
      <p className={s.desc}>{shown}</p>
      {short && (
        <button className={s.descToggle} onClick={() => setExp(v => !v)}>
          {exp ? 'Свернуть ↑' : 'Читать полностью ↓'}
        </button>
      )}
    </div>
  );
}
