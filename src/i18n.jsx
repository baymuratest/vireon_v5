import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const DICT = {
  ru: {
    'nav.home': 'Главная',
    'nav.catalog': 'Каталог',
    'nav.author': 'Автор',
    'nav.support': 'Поддержать',
    'nav.search': 'Поиск',
    'nav.menu': 'Меню',
    'search.placeholder': 'Поиск по названию…',
    'search.searching': 'Поиск…',
    'search.empty': 'Ничего не найдено',
    'search.all': 'Все результаты по',
    'theme.title': 'Тема',
    'theme.auto': 'Авто',
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',
    'lang.title': 'Язык',
    'home.section.continue': 'Продолжить просмотр',
    'home.section.topAll': 'Топ по рейтингу',
    'home.section.topAnime': 'Топ аниме',
    'home.section.topMovies': 'Топ фильмы',
    'home.section.topSerials': 'Топ сериалы',
    'home.section.ongoing': 'Сейчас выходят',
    'home.section.latest': 'Новые поступления',
    'home.section.seeAll': 'Смотреть все',
    'home.cta.title': 'Не нашёл что искал?',
    'home.cta.desc': 'Тысячи фильмов, сериалов, аниме и мультфильмов в каталоге.',
    'home.cta.btn': 'Открыть каталог',
    'home.hero.watch': 'Смотреть',
    'home.hero.catalog': 'Перейти в каталог →',
    'home.hero.ongoing': 'Онгоинг',
    'home.continue.remove': 'Убрать',
    'home.continue.episode': 'Серия',
    'home.continue.season': 'Сезон',
    'home.continue.resume': 'Продолжить',
    'support.title': 'Поддержать автора',
    'support.desc': 'Vireon — некоммерческий проект, сделанный ради интереса. Если он тебе пригодился — можешь отблагодарить любой суммой. Каждая монета приятна и мотивирует развивать проект дальше.',
    'support.copy': 'Копировать',
    'support.copied': '✓ Скопировано',
    'support.warn': 'Отправляй только USDT в сети TRC20 (Tron). Перевод в другой сети будет утерян.',
    'support.qr': 'QR-код для перевода',
    'support.note': 'Спасибо, что ты здесь 🤍',
    'footer.desc': 'Смотри фильмы, сериалы, аниме и мультфильмы онлайн в высоком качестве. Один сервис — весь контент.',
    'footer.sections': 'Разделы',
    'footer.nav': 'Навигация',
    'footer.rights': 'Все права защищены.',
  },
  en: {
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.author': 'Author',
    'nav.support': 'Support',
    'nav.search': 'Search',
    'nav.menu': 'Menu',
    'search.placeholder': 'Search by title…',
    'search.searching': 'Searching…',
    'search.empty': 'Nothing found',
    'search.all': 'All results for',
    'theme.title': 'Theme',
    'theme.auto': 'Auto',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'lang.title': 'Language',
    'home.section.continue': 'Continue watching',
    'home.section.topAll': 'Top rated',
    'home.section.topAnime': 'Top anime',
    'home.section.topMovies': 'Top movies',
    'home.section.topSerials': 'Top series',
    'home.section.ongoing': 'Airing now',
    'home.section.latest': 'New releases',
    'home.section.seeAll': 'See all',
    'home.cta.title': 'Didn\'t find what you wanted?',
    'home.cta.desc': 'Thousands of movies, series, anime and cartoons in the catalog.',
    'home.cta.btn': 'Open catalog',
    'home.hero.watch': 'Watch',
    'home.hero.catalog': 'Go to catalog →',
    'home.hero.ongoing': 'Ongoing',
    'home.continue.remove': 'Remove',
    'home.continue.episode': 'Episode',
    'home.continue.season': 'Season',
    'home.continue.resume': 'Resume',
    'support.title': 'Support the author',
    'support.desc': 'Vireon is a non-commercial passion project. If it helped you — feel free to tip any amount. Every coin is appreciated and motivates further development.',
    'support.copy': 'Copy',
    'support.copied': '✓ Copied',
    'support.warn': 'Send only USDT on the TRC20 (Tron) network. Transfers on other networks will be lost.',
    'support.qr': 'QR code for transfer',
    'support.note': 'Thanks for being here 🤍',
    'footer.desc': 'Watch movies, series, anime and cartoons online in high quality. One service — all content.',
    'footer.sections': 'Sections',
    'footer.nav': 'Navigation',
    'footer.rights': 'All rights reserved.',
  },
};

function detectLang() {
  try {
    const saved = localStorage.getItem('vireon_lang');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {}
  if (typeof navigator !== 'undefined') {
    const langs = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
    for (const l of langs) {
      const code = l.toLowerCase().slice(0, 2);
      if (code === 'ru' || code === 'uk' || code === 'be' || code === 'kk') return 'ru';
      if (code === 'en') return 'en';
    }
  }
  return 'en';
}

const I18nCtx = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('vireon_lang', l); } catch {}
  }, []);
  const t = useCallback(
    (key) => (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key,
    [lang]
  );
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
export const useT = () => useContext(I18nCtx).t;
