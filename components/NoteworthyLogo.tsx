interface NoteworthyLogoProps {
  size?: number;
  className?: string;
}

export function NoteworthyLogo({ size = 40, className = "" }: NoteworthyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Notebook base */}
      <rect
        x="8"
        y="6"
        width="32"
        height="36"
        rx="3"
        fill="url(#noteGradient)"
        stroke="url(#borderGradient)"
        strokeWidth="1.5"
      />
      
      {/* Notebook spiral binding */}
      <rect
        x="4"
        y="8"
        width="3"
        height="2"
        rx="1.5"
        fill="currentColor"
        className="text-slate-400 dark:text-slate-600"
      />
      <rect
        x="4"
        y="14"
        width="3"
        height="2"
        rx="1.5"
        fill="currentColor"
        className="text-slate-400 dark:text-slate-600"
      />
      <rect
        x="4"
        y="20"
        width="3"
        height="2"
        rx="1.5"
        fill="currentColor"
        className="text-slate-400 dark:text-slate-600"
      />
      <rect
        x="4"
        y="26"
        width="3"
        height="2"
        rx="1.5"
        fill="currentColor"
        className="text-slate-400 dark:text-slate-600"
      />
      <rect
        x="4"
        y="32"
        width="3"
        height="2"
        rx="1.5"
        fill="currentColor"
        className="text-slate-400 dark:text-slate-600"
      />
      <rect
        x="4"
        y="38"
        width="3"
        height="2"
        rx="1.5"
        fill="currentColor"
        className="text-slate-400 dark:text-slate-600"
      />

      {/* Stylized "N" formed by content lines */}
      <path
        d="M14 16 L14 28 L16 28 L16 22 L26 28 L26 16 L24 16 L24 22 L14 16 Z"
        fill="url(#textGradient)"
      />
      
      {/* Accent lines representing text content */}
      <rect
        x="14"
        y="32"
        width="16"
        height="1.5"
        rx="0.75"
        fill="currentColor"
        className="text-slate-400 dark:text-slate-500"
      />
      <rect
        x="14"
        y="35"
        width="12"
        height="1"
        rx="0.5"
        fill="currentColor"
        className="text-slate-300 dark:text-slate-600"
      />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="noteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.1" />
          <stop offset="50%" stopColor="rgb(168 85 247)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="rgb(236 72 153)" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="rgb(168 85 247)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(236 72 153)" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" />
          <stop offset="50%" stopColor="rgb(168 85 247)" />
          <stop offset="100%" stopColor="rgb(236 72 153)" />
        </linearGradient>
      </defs>
    </svg>
  );
}