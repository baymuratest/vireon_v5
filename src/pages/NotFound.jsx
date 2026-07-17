import React from 'react';
import { Link } from 'react-router-dom';
import s from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.code}>404</div>
        <h1 className={s.title}>Страница не найдена</h1>
        <p className={s.sub}>Возможно, она была удалена или вы перешли по неверной ссылке</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: 24 }}>
          ← На главную
        </Link>
      </div>
    </div>
  );
}
