export function FutureLuckLogo({ size = 'md', showSlogan = false, slogan = 'Votre chance, notre priorité.' }) {
  const sizes = {
    sm: { star: 'w-7 h-7', text: 'text-xl' },
    md: { star: 'w-9 h-9', text: 'text-2xl' },
    lg: { star: 'w-14 h-14', text: 'text-4xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="inline-flex flex-col items-center">
      <div className="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 64 64" className={s.star} fill="none" aria-hidden="true">
          <path
            d="M12 48C4 34 10 14 30 12C40 11 49 15 55 22C47 16 36 14 27 17C14 22 10 36 18 49C22 54 28 57 35 58C24 58 16 54 12 48Z"
            fill="url(#fl-gold-swoosh)"
          />
          <path
            d="M28 6L32.2 15.6L42.6 16.5L34.7 23.3L37.1 33.5L28 28L18.9 33.5L21.3 23.3L13.4 16.5L23.8 15.6L28 6Z"
            fill="url(#fl-gold-star)"
          />
          <defs>
            <linearGradient id="fl-gold-swoosh" x1="8" y1="12" x2="52" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFE866" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="fl-gold-star" x1="14" y1="6" x2="40" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF08A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
        <span className={`${s.text} font-extrabold italic tracking-tight leading-none`}>
          <span className="text-white">Future</span>
          <span className="text-[#FFD200]">Luck</span>
        </span>
      </div>
      {showSlogan && (
        <span className="text-[11px] italic text-blue-100/90 mt-0.5 tracking-wide">{slogan}</span>
      )}
    </div>
  );
}
