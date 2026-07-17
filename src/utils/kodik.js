// ============================================================
//  VIREON — API wrapper
//  Токен зашит в коде. Пользователь его не видит и не настраивает.
// ============================================================

const TOKEN = 'ecc052e27cd7c4fe1c781701a2f574a6';
const BASE  = 'https://kodik-api.com';

async function api(endpoint, params = {}) {
  const body = new URLSearchParams({ token: TOKEN, ...params });
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ─── /list ──────────────────────────────────────────────────
export function getList(params = {}) {
  return api('/list', { with_material_data: 'true', limit: 40, ...params });
}
export function getLatest(limit = 40) {
  return getList({ sort: 'updated_at', order: 'desc', limit });
}
export function getAnimeList(params = {}) {
  return getList({ types: 'anime,anime-serial', ...params });
}
export function getMovies(params = {}) {
  return getList({ types: 'foreign-movie,russian-movie', sort: 'updated_at', order: 'desc', ...params });
}
export function getSerials(params = {}) {
  return getList({ types: 'foreign-serial,russian-serial,cartoon-serial,anime-serial', sort: 'updated_at', order: 'desc', ...params });
}
export function getCartoons(params = {}) {
  return getList({ types: 'foreign-cartoon,russian-cartoon,soviet-cartoon,cartoon-serial', sort: 'updated_at', order: 'desc', ...params });
}
export function getOngoing(limit = 40) {
  return getList({ types: 'anime-serial', anime_status: 'ongoing', sort: 'updated_at', order: 'desc', limit });
}
export function getTopAnime(limit = 40) {
  return getList({ types: 'anime,anime-serial', sort: 'shikimori_rating', order: 'desc', limit, has_field: 'shikimori_id' });
}
export function getTopMovies(limit = 40) {
  return getList({ types: 'foreign-movie,russian-movie', sort: 'imdb_rating', order: 'desc', limit, has_field: 'imdb_id' });
}
export function getTopSerials(limit = 40) {
  return getList({ types: 'foreign-serial,russian-serial', sort: 'kinopoisk_rating', order: 'desc', limit, has_field: 'kinopoisk_id' });
}
export function getTopAll(limit = 20) {
  return getList({ sort: 'kinopoisk_rating', order: 'desc', limit, has_field: 'kinopoisk_id' });
}

// ─── /search ────────────────────────────────────────────────
export function searchAll(title, params = {}) {
  return api('/search', { with_material_data: 'true', title, limit: 50, ...params });
}
export function searchQuick(title, limit = 8) {
  return api('/search', { with_material_data: 'true', title, limit });
}
export function getById(shikimori_id) {
  return api('/search', { with_material_data: 'true', with_episodes: 'true', shikimori_id });
}
export function getByKinopoiskId(kinopoisk_id) {
  return api('/search', { with_material_data: 'true', with_episodes: 'true', kinopoisk_id });
}
export function getByKodikId(id) {
  return api('/search', { with_material_data: 'true', with_episodes: 'true', id });
}

// ─── /genres / /translations ────────────────────────────────
export function getGenresList(types = 'anime,anime-serial') {
  return api('/genres', { types, genres_type: 'shikimori' });
}
export function getTranslations(types = 'anime,anime-serial') {
  return api('/translations/v2', { types });
}

// ─── Pagination ─────────────────────────────────────────────
export async function fetchNextPage(nextPageUrl) {
  const url = new URL(nextPageUrl);
  const params = Object.fromEntries(url.searchParams.entries());
  const res = await fetch(`${BASE}${url.pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ─── Helpers ────────────────────────────────────────────────
export function getPoster(item) {
  return (
    item?.material_data?.anime_poster_url ||
    item?.material_data?.poster_url ||
    item?.material_data?.drama_poster_url ||
    item?.screenshots?.[0] ||
    null
  );
}
export function getTitle(item) {
  return (
    item?.material_data?.title ||
    item?.material_data?.anime_title ||
    item?.title ||
    'Без названия'
  );
}
export function getRating(item) {
  return (
    item?.material_data?.shikimori_rating ||
    item?.material_data?.imdb_rating ||
    item?.material_data?.kinopoisk_rating ||
    null
  );
}
export function getRatingLabel(item) {
  if (item?.material_data?.shikimori_rating) return { val: item.material_data.shikimori_rating, src: 'Shikimori' };
  if (item?.material_data?.imdb_rating)      return { val: item.material_data.imdb_rating, src: 'IMDb' };
  if (item?.material_data?.kinopoisk_rating) return { val: item.material_data.kinopoisk_rating, src: 'КиноПоиск' };
  return null;
}
export function getAllRatings(item) {
  const m = item?.material_data || {};
  const arr = [];
  if (m.shikimori_rating) arr.push({ src: 'Shikimori',  val: m.shikimori_rating, votes: m.shikimori_votes });
  if (m.imdb_rating)      arr.push({ src: 'IMDb',       val: m.imdb_rating,      votes: m.imdb_votes });
  if (m.kinopoisk_rating) arr.push({ src: 'КиноПоиск',  val: m.kinopoisk_rating, votes: m.kinopoisk_votes });
  if (m.mydramalist_rating) arr.push({ src: 'MyDramaList', val: m.mydramalist_rating, votes: m.mydramalist_votes });
  return arr;
}
export function getGenres(item) {
  return (
    item?.material_data?.anime_genres ||
    item?.material_data?.genres ||
    item?.material_data?.all_genres ||
    []
  );
}
export function getDescription(item) {
  return (
    item?.material_data?.anime_description ||
    item?.material_data?.description ||
    null
  );
}
export function buildEmbedUrl(link) {
  if (!link) return null;
  return link.startsWith('//') ? `https:${link}` : link;
}
export function getTypeLabel(type) {
  const map = {
    'anime': 'Аниме',
    'anime-serial': 'Аниме сериал',
    'foreign-movie': 'Фильм',
    'russian-movie': 'Фильм (RU)',
    'foreign-serial': 'Сериал',
    'russian-serial': 'Сериал (RU)',
    'foreign-cartoon': 'Мультфильм',
    'russian-cartoon': 'Мультфильм',
    'soviet-cartoon': 'Советский м/ф',
    'cartoon-serial': 'Мульт-сериал',
    'documentary-serial': 'Документальный',
    'multi-part-film': 'Многосерийный',
  };
  return map[type] || type;
}
// Neutral monochrome — no colored badges
export function getTypeColor() { return 'var(--text)'; }

export function getAgeRating(item) {
  const m = item?.material_data || {};
  if (m.rating_mpaa) {
    const map = { g:'0+', pg:'6+', 'pg-13':'13+', r:'17+', 'nc-17':'18+' };
    const k = String(m.rating_mpaa).toLowerCase();
    return map[k] || m.rating_mpaa.toUpperCase();
  }
  if (m.minimal_age) return `${m.minimal_age}+`;
  return null;
}

export function getStudios(item) {
  const m = item?.material_data || {};
  return m.anime_studios || m.studios || [];
}

export function getStudioLogo(name) {
  if (!name) return null;
  // Use Shikimori's open studio logo proxy via duckduckgo favicon as a no-key fallback
  const slug = String(name).toLowerCase().replace(/[^\w]+/g, '');
  return `https://icons.duckduckgo.com/ip3/${slug}.com.ico`;
}

export function deduplicate(results) {
  const seen = new Map();
  for (const item of results) {
    const key = item.shikimori_id || item.kinopoisk_id || item.imdb_id || item.id;
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

export const CATEGORIES = [
  { id: 'all',      label: 'Всё',         types: '' },
  { id: 'movies',   label: 'Фильмы',      types: 'foreign-movie,russian-movie' },
  { id: 'serials',  label: 'Сериалы',     types: 'foreign-serial,russian-serial' },
  { id: 'anime',    label: 'Аниме',       types: 'anime,anime-serial' },
  { id: 'cartoons', label: 'Мультфильмы', types: 'foreign-cartoon,russian-cartoon,soviet-cartoon,cartoon-serial' },
];

export const ANIME_GENRES = [
  'Экшен','Приключения','Комедия','Драма','Фэнтези','Романтика',
  'Научная фантастика','Спорт','Триллер','Ужасы','Сёнэн','Сёдзё','Меха',
  'Повседневность','Магия','Школа','Музыка','Мистика','Психологическое','История',
];

export const SORT_OPTIONS = [
  { value: 'updated_at',       label: 'По обновлению' },
  { value: 'created_at',       label: 'По добавлению' },
  { value: 'year',             label: 'По году' },
  { value: 'shikimori_rating', label: 'Рейтинг Shikimori' },
  { value: 'imdb_rating',      label: 'Рейтинг IMDb' },
  { value: 'kinopoisk_rating', label: 'Рейтинг КиноПоиск' },
];

export const STATUS_OPTIONS = [
  { value: '',         label: 'Любой' },
  { value: 'ongoing',  label: 'Онгоинг' },
  { value: 'released', label: 'Завершён' },
  { value: 'anons',    label: 'Анонс' },
];

export const AGE_OPTIONS = [
  { value: '',   label: 'Любой' },
  { value: '0',  label: '0+' },
  { value: '6',  label: '6+' },
  { value: '12', label: '12+' },
  { value: '16', label: '16+' },
  { value: '18', label: '18+' },
];
