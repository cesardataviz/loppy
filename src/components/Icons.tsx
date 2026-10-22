type P = { size?: number }
const base = (size = 20) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })

export const Flame = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none"><path d="M12 2c1 3.5 5 5.5 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.2-5 .2 1.6 1 2.6 2 3-.5-3.3.3-6.3.8-9z" /></svg>
)
export const Bolt = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
)
export const Play = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>
)
export const Close = ({ size }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const Bulb = ({ size }: P) => (
  <svg {...base(size)}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>
)
export const Path = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 12c-2-2.7-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.3 6-4zm0 0c2 2.7 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.3-6 4z" /></svg>
)
export const Code = ({ size }: P) => (
  <svg {...base(size)}><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></svg>
)
export const User = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
)
export const Star = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" /></svg>
)
export const Lock = ({ size }: P) => (
  <svg {...base(size)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
export const Check = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={3}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)
export const Eye = ({ size }: P) => (
  <svg {...base(size)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
)
export const Trophy = ({ size }: P) => (
  <svg {...base(size)}><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" /></svg>
)
