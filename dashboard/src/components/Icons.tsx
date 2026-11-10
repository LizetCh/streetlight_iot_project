// Íconos de trazo, sin dependencias. Decorativos: aria-hidden.
type P = { size?: number }
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconBulb = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z" />
  </svg>
)
export const IconGrid = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)
export const IconPole = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M8 22V6a4 4 0 0 1 4-4h4" />
    <path d="M14 2h4l-1 4h-2z" />
    <path d="M5 22h6" />
  </svg>
)
export const IconAlert = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)
export const IconDoc = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h5" />
  </svg>
)
export const IconSliders = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M4 21v-7" />
    <path d="M4 10V3" />
    <path d="M12 21v-9" />
    <path d="M12 8V3" />
    <path d="M20 21v-5" />
    <path d="M20 12V3" />
    <path d="M1 14h6" />
    <path d="M9 8h6" />
    <path d="M17 16h6" />
  </svg>
)
export const IconCheck = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
export const IconRefresh = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v6h-6" />
  </svg>
)
export const IconWifiOff = ({ size = 26 }: P) => (
  <svg {...base(size)}>
    <path d="M2 2l20 20" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <path d="M5 12.9a10 10 0 0 1 5.2-2.8" />
    <path d="M16.8 10.7A10 10 0 0 1 19 12.9" />
    <path d="M12 20h.01" />
  </svg>
)
export const IconLogout = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)
