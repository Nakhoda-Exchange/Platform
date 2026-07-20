import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "viewBox"> {
  size?: number;
}

/**
 * Base icon wrapper. Paths use `currentColor`, so an icon takes the text color
 * of its container — recolor with `text-*` utilities.
 */
function Icon({
  size = 24,
  viewBox = "0 0 24 24",
  children,
  ...props
}: IconProps & { viewBox?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Icon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
    </Icon>
  );
}

export function SmartphoneIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <path d="M10 15.0004H10.0083M5.83286 1.666H14.1671C15.0877 1.666 15.834 2.41225 15.834 3.3328V16.6672C15.834 17.5877 15.0877 18.334 14.1671 18.334H5.83286C4.91228 18.334 4.166 17.5877 4.166 16.6672V3.3328C4.166 2.41225 4.91228 1.666 5.83286 1.666Z" />
    </Icon>
  );
}

export function ZapOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.5126 4.85559L13.1198 2.16942C13.1941 2.08369 13.2953 2.02576 13.4068 2.00514C13.5183 1.98451 13.6336 2.00242 13.7336 2.05591C13.8336 2.10941 13.9124 2.19531 13.9572 2.29953C14.0019 2.40375 14.0099 2.52009 13.9799 2.62945L12.6027 6.94673M15.6565 10.0003H20.0009C20.1901 9.99961 20.3757 10.0527 20.536 10.1533C20.6963 10.2539 20.8247 10.3979 20.9064 10.5686C20.9881 10.7393 21.0197 10.9297 20.9975 11.1177C20.9753 11.3056 20.9002 11.4834 20.781 11.6304L19.0608 13.4035M16.2738 16.2732L10.8804 21.8306C10.8061 21.9163 10.7049 21.9742 10.5934 21.9949C10.4819 22.0155 10.3666 21.9976 10.2666 21.9441C10.1666 21.8906 10.0877 21.8047 10.043 21.7005C9.99823 21.5962 9.99024 21.4799 10.0203 21.3706L11.9405 15.3502C11.9971 15.1986 12.0161 15.0356 11.9959 14.8751C11.9757 14.7146 11.9168 14.5614 11.8244 14.4287C11.7319 14.2959 11.6087 14.1876 11.4652 14.1129C11.3216 14.0383 11.1622 13.9995 11.0004 14.0001H3.99984C3.81059 14.0007 3.62504 13.9477 3.46475 13.847C3.30446 13.7464 3.17601 13.6024 3.09432 13.4317C3.01263 13.261 2.98105 13.0706 3.00326 12.8827C3.02547 12.6947 3.10055 12.5169 3.21978 12.37L7.72714 7.72667M1.9992 1.99973L22.0008 22.001" />
    </Icon>
  );
}

export function CoinsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.7447 17.7351C13.4445 18.7277 12.8922 19.6255 12.1416 20.341C11.391 21.0566 10.4677 21.5653 9.46192 21.8177C8.4561 22.0701 7.40203 22.0575 6.40253 21.7811C5.40304 21.5048 4.49223 20.9741 3.75896 20.2408C3.02569 19.5075 2.49498 18.5967 2.21861 17.5972C1.94224 16.5977 1.92963 15.5437 2.18202 14.5378C2.43442 13.532 2.94319 12.6088 3.65872 11.8582C4.37424 11.1076 5.2721 10.5553 6.2647 10.2551M15.0006 5.9992H16.0006V9.9992M6.13441 14.7668L7.00041 14.2668L9.00041 17.7308M22.0006 7.9992C22.0006 11.3129 19.3143 13.9992 16.0006 13.9992C12.6869 13.9992 10.0006 11.3129 10.0006 7.9992C10.0006 4.68549 12.6869 1.9992 16.0006 1.9992C19.3143 1.9992 22.0006 4.68549 22.0006 7.9992Z" />
    </Icon>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" {...props}>
      <path d="M8.66679 13.9992H14.0006M14.1166 4.541C14.4691 4.18862 14.6671 3.71066 14.6672 3.21226C14.6673 2.71386 14.4693 2.23584 14.1169 1.88338C13.7645 1.53091 13.2865 1.33286 12.788 1.3328C12.2896 1.33274 11.8115 1.53067 11.459 1.88304L2.56087 10.7822C2.40607 10.9366 2.29158 11.1266 2.2275 11.3355L1.34676 14.2368C1.32953 14.2945 1.32822 14.3557 1.34299 14.4141C1.35776 14.4724 1.38804 14.5256 1.43063 14.5682C1.47322 14.6107 1.52652 14.6409 1.58488 14.6555C1.64325 14.6702 1.7045 14.6688 1.76213 14.6515L4.66439 13.7715C4.87319 13.708 5.0632 13.5942 5.21777 13.4402L14.1166 4.541Z" />
    </Icon>
  );
}

export function RocketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12.0008 14.9992V19.9992C12.0008 19.9992 15.0308 19.4492 16.0008 17.9992C17.0808 16.3792 16.0008 12.9992 16.0008 12.9992M12.0008 14.9992C13.3975 14.4676 14.7375 13.7976 16.0008 12.9992M12.0008 14.9992L9.0008 11.9994M9.0008 11.9994C9.53294 10.6189 10.203 9.29551 11.0008 8.04945C12.166 6.18643 13.7884 4.6525 15.7138 3.59354C17.6392 2.53458 19.8035 1.98582 22.0008 1.99945C22.0008 4.71945 21.2208 9.4992 16.0008 12.9992M9.0008 11.9994L4.0008 11.9988C4.0008 11.9988 4.5508 8.9688 6.0008 7.9988C7.6208 6.9188 11.0008 8.04945 11.0008 8.04945M4.5008 16.4995C3.0008 17.7595 2.5008 21.4995 2.5008 21.4995C2.5008 21.4995 6.2408 20.9995 7.5008 19.4995C8.2108 18.6595 8.2008 17.3695 7.4108 16.5895C7.02211 16.2185 6.51009 16.0042 5.97303 15.9875C5.43596 15.9709 4.91168 16.1533 4.5008 16.4995Z" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="9 18 15 12 9 6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="15 18 9 12 15 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}

/** Question mark in a circle — the «سوالات متداول» (FAQ) icon. */
export function HelpCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

/** Full arrow pointing right — the header «بازگشت» (back) icon in this RTL app. */
export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </Icon>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="23 6 13.5 16.5 8.5 11.5 1 19" />
      <polyline points="17 6 23 6 23 12" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

/** Monitor — stands for the «سیستم» (follow-OS) theme option. */
export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </Icon>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </Icon>
  );
}

export function LineChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 14 4-4 4 3 5-6" />
    </Icon>
  );
}

export function CandlestickIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4v3" />
      <rect x="5" y="7" width="4" height="8" rx="1" />
      <path d="M7 15v3" />
      <path d="M17 6v3" />
      <rect x="15" y="9" width="4" height="8" rx="1" />
      <path d="M17 17v2" />
    </Icon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
    </Icon>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </Icon>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </Icon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </Icon>
  );
}

export function HeadphonesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

export function CreditCardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Icon>
  );
}

export function TradingViewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4v4M7 16v4M7 8a2 2 0 0 1 2 2v4a2 2 0 0 1-4 0v-4a2 2 0 0 1 2-2Z" />
      <path d="M17 3v3M17 18v3M17 6a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0V8a2 2 0 0 1 2-2Z" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}
