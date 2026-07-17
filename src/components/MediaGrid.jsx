import React from 'react';
import MediaCard from './MediaCard';
import s from './MediaGrid.module.css';

function SkeletonCard() {
  return (
    <div className={s.skeletonCard}>
      <div className="skeleton" style={{ aspectRatio:'2/3' }} />
      <div style={{ padding:'11px 12px', display:'flex', flexDirection:'column', gap:'7px' }}>
        <div className="skeleton" style={{ height:'13px', borderRadius:'5px' }} />
        <div className="skeleton" style={{ height:'11px', width:'55%', borderRadius:'5px' }} />
      </div>
    </div>
  );
}

export default function MediaGrid({ items, loading, error, skeletonCount = 20 }) {
  if (error) return (
    <div className="error-box">
      <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
      <h3>Ошибка загрузки</h3>
      <p style={{ marginTop:6, fontSize:14 }}>{error}</p>
    </div>
  );

  if (loading) return (
    <div className={s.grid}>
      {Array.from({ length: skeletonCount }).map((_,i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (!items?.length) return (
    <div className="empty-box">
      <div className="empty-icon">🌸</div>
      <p>Ничего не найдено</p>
    </div>
  );

  return (
    <div className={s.grid}>
      {items.map((item, i) => <MediaCard key={item.id || i} item={item} index={i} />)}
    </div>
  );
}
