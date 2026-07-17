import React from 'react';
import { Link } from 'react-router-dom';
import s from './AuthorPage.module.css';

const GITHUB = 'https://github.com/asas-poq';
const TELEGRAM = 'https://t.me/asmo-poq';

export default function AuthorPage() {
  return (
    <div className="page-wrapper">
      <div className={`page-inner ${s.wrap}`}>
        <div className={s.hero}>
          <div className={s.avatar}>
            <img src="/logo.png" alt="Author" />
          </div>
          <div>
            <p className={s.kicker}>Об авторе</p>
            <h1 className={s.name}>asas-poq</h1>
            <p className={s.tag}>Разработчик · Дизайнер · Создатель Vireon</p>
          </div>
        </div>

        <section className={s.card}>
          <h2>Привет 👋</h2>
          <p>
            Этот проект — <b>Vireon</b> — сделан чисто ради интереса и для того,
            чтобы добавить его в моё портфолио. Я хотел собрать кинотеатр,
            которым было бы приятно пользоваться: минимум визуального шума,
            быстрый поиск, чистая чёрно-белая эстетика и максимум информации
            о каждом тайтле.
          </p>
          <p>
            Здесь нет рекламы, нет трекеров и нет «настроек, которые сами знают
            лучше тебя». Только ты, каталог и плеер. Если тебе нравится — это
            уже большая поддержка.
          </p>
        </section>

        <section className={s.card}>
          <h2>Стек</h2>
          <div className={s.chips}>
            {['React', 'Vite', 'React Router', 'CSS Modules', 'Kodik API', 'Shikimori'].map(t => (
              <span key={t} className={s.chip}>{t}</span>
            ))}
          </div>
        </section>

        <section className={s.links}>
          <a className={s.linkBtn} href={GITHUB} target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/>
            </svg>
            <span>
              <b>GitHub</b>
              <small>github.com/asas-poq</small>
            </span>
          </a>

          <a className={s.linkBtn} href={TELEGRAM} target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.24 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
            </svg>
            <span>
              <b>Telegram</b>
              <small>@asmo-poq</small>
            </span>
          </a>
        </section>

        <div className={s.support}>
          <Link to="/support" className={s.supportBtn}>
            ❤ Поддержать автора
          </Link>
        </div>
      </div>
    </div>
  );
}
