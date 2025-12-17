export const HeroIconsUpload = ({ size = 16, className }: { size?: number; className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
    >
      <path d="M12 3v12m0 0l-3.5-3.5M12 15l3.5-3.5M2 21h20" />
    </svg>
  );
};
