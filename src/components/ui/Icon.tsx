import type { SVGProps } from 'react'
import type { IconName } from '../../types/content'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

const paths: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  building: <><path d="M4 21V9l8-5v17"/><path d="M12 8h8v13"/><path d="M8 12h.01M8 16h.01M16 12h.01M16 16h.01M3 21h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  document: <><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 2-5a7 7 0 0 1-2-5V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z"/>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-5"/></>,
  spray: <><path d="M7 9h6l3 3v9H8l-2-8z"/><path d="M13 9V5h5M18 5l2 2M3 7h2M2 11h3M4 3l2 2"/></>,
  temperature: <><path d="M14 14.76V5a4 4 0 0 0-8 0v9.76a6 6 0 1 0 8 0z"/><path d="M10 9v8"/></>,
  x: <><path d="m6 6 12 12M18 6 6 18"/></>,
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
