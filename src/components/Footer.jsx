import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../utils/kodik';
import { useT } from '../i18n';
import s from './Footer.module.css';

export default function Footer() {
  const t = useT();
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brand}>
          <Link to="/" className={s.logo}>
            <img src="/logo.png" alt="Vireon" />
            <span>VIREON</span>
          </Link>
          <p>{t('footer.desc')}</p>
        </div>

        <div className={s.col}>
          <h4>{t('footer.sections')}</h4>
          {CATEGORIES.map(c => (
            <Link key={c.id} to={c.id === 'all' ? '/catalog' : `/catalog?cat=${c.id}`}>
              {c.label}
            </Link>
          ))}
        </div>

        <div className={s.col}>
          <h4>{t('footer.nav')}</h4>
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/catalog">{t('nav.catalog')}</Link>
          <Link to="/search">{t('nav.search')}</Link>
          <Link to="/author">{t('nav.author')}</Link>
          <Link to="/support">{t('nav.support')}</Link>
        </div>
      </div>
      <div className={s.bottom}>
        <p>© {new Date().getFullYear()} Vireon. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
