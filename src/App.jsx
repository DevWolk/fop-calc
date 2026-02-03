import { useState, useEffect } from 'react';
import CurrencyCalculator, { useTranslation } from './calculator-v3.jsx';

export default function App() {
  const { t } = useTranslation();
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Listen for SW update events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdateToast(true);
              }
            });
          }
        });
      });

      // Handle controller change (page reload after update)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateToast(false);
  };

  const dismissToast = () => {
    setShowUpdateToast(false);
  };

  return (
    <>
      <CurrencyCalculator />

      {showUpdateToast && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          zIndex: 9999,
          maxWidth: 'calc(100% - 40px)',
        }}>
          <span>{t("update.available")}</span>
          <button
            onClick={handleUpdate}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {t("update.button")}
          </button>
          <button
            onClick={dismissToast}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
