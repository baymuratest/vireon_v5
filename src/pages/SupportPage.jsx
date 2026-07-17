import React, { useState } from 'react';
import s from './SupportPage.module.css';
import { useT } from '../i18n';

const USDT_ADDRESS = 'TH6VDXnBiiQszZTzfgHdpxQtSWu9x4ZuPG';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(USDT_ADDRESS)}`;

export default function SupportPage() {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(USDT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="page-wrapper">
      <div className={`page-inner ${s.wrap}`}>
        <div className={s.hero}>
          <div className={s.heart}>❤</div>
          <h1>{t('support.title')}</h1>
          <p>{t('support.desc')}</p>
        </div>

        <div className={s.list}>
          <div className={s.card}>
            <div className={s.head}>
              <div className={s.icon} style={{ background: '#26A17B' }}>₮</div>
              <div className={s.headText}>
                <h3>USDT</h3>
                <span>TRC20 (Tron)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{
                background: '#fff',
                padding: 14,
                borderRadius: 16,
                boxShadow: '0 12px 40px -12px rgba(0,0,0,.35)',
                display: 'inline-block',
              }}>
                <img
                  src={QR_URL}
                  alt={t('support.qr')}
                  width={220}
                  height={220}
                  style={{ display: 'block', borderRadius: 8 }}
                />
              </div>
            </div>

            <div className={s.addressBox}>
              <code>{USDT_ADDRESS}</code>
              <button onClick={copy} className={s.copyBtn}>
                {copied ? t('support.copied') : t('support.copy')}
              </button>
            </div>

            <p className={s.warn}>⚠ {t('support.warn')}</p>
          </div>
        </div>

        <p className={s.note}>{t('support.note')}</p>
      </div>
    </div>
  );
}
