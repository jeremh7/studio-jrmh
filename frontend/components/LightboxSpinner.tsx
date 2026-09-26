export default function LightboxSpinner() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 5 }}
    >
      <span className="lb-spinner" />
      <style>{`
        .lb-spinner {
          display: block; width: 30px; height: 30px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          border-top-color: rgba(212,168,67,0.9);
          animation: lb-spin 0.8s linear infinite, lb-fade 0.2s ease-out both;
        }
        @keyframes lb-spin { to { transform: rotate(360deg); } }
        @keyframes lb-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
