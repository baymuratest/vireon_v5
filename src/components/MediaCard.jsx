import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPoster, getTitle, getRating, getGenres, getTypeLabel,
  getAgeRating, getStudios, getStudioLogo,
} from '../utils/kodik';
import s from './MediaCard.module.css';

export default function MediaCard({ item, index = 0 }) {
  const [imgErr, setImgErr] = useState(false);
  const poster   = imgErr ? null : getPoster(item);
  const title    = getTitle(item);
  const rating   = getRating(item);
  const genres   = getGenres(item).slice(0, 2);
  const year     = item?.year || item?.material_data?.year;
  const eps      = item?.episodes_count;
  const typeLbl  = getTypeLabel(item?.type);
  const status   = item?.material_data?.anime_status;
  const ext      = item?.shikimori_id || item?.kinopoisk_id || item?.id;
  const age      = getAgeRating(item);
  const studios  = getStudios(item);
  const studio   = studios[0];
  const country  = item?.material_data?.countries?.[0];
  const duration = item?.material_data?.duration;
  const qLabel   = item?.quality;

  const statusDot = status === 'ongoing';

  return (
    <Link
      to={`/watch/${encodeURIComponent(item?.id)}?ext=${ext}`}
      className={s.card}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.4)}s` }}
    >
      <div className={s.poster}>
        {poster && !imgErr
          ? <img src={poster} alt={title} onError={() => setImgErr(true)} loading="lazy" />
          : <div className={s.fallback}><span>▶</span></div>
        }

        <div className={s.overlay}>
          <div className={s.playBtn}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Top-left badges */}
        <div className={s.topLeft}>
          {age && <span className={s.ageBadge}>{age}</span>}
          {qLabel && <span className={s.qBadge}>{String(qLabel).replace('WEB-DLRip ', '').replace('WEB-DL ', '')}</span>}
        </div>

        {/* Top-right rating */}
        {rating && (
          <div className={s.rating}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {Number(rating).toFixed(1)}
          </div>
        )}

        {/* Bottom strip */}
        <div className={s.bottomStrip}>
          <span className={s.typeBadge}>{typeLbl}</span>
          {statusDot && <span className={s.live}><span className={s.liveDot}/>Онгоинг</span>}
        </div>
      </div>

      <div className={s.info}>
        <h3 className={s.title}>{title}</h3>

        <div className={s.meta}>
          {year && <span>{year}</span>}
          {country && <><span className={s.dot}/>{country}</>}
          {eps && <><span className={s.dot}/>{eps} эп.</>}
          {duration && <><span className={s.dot}/>{duration} мин</>}

        </div>

        {studio && (
          <div className={s.studio}>
            <img
              src={getStudioLogo(studio)}
              alt=""
              className={s.studioLogo}
              onError={(e) => { e.currentTarget.style.display='none'; }}
            />
            <span>{studio}</span>
          </div>
        )}

        {genres.length > 0 && (
          <div className={s.genres}>
            {genres.map(g => <span key={g} className={s.genre}>{g}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}
