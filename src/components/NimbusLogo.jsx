export default function ChaseLogo({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="33.86,12 33.86,28 20,36 6.14,28 6.14,12 20,4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="20" y="25" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor" fontFamily="Arial, sans-serif">
        C
      </text>
    </svg>
  );
}