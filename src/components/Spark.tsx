// Walmart "Spark" mark — six tapered yellow rays radiating from a center gap.
// Recreated from simple geometry for this practice/demo app.
export default function Spark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Spark"
      fill="#ffc220"
    >
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <ellipse
          key={deg}
          cx="50"
          cy="25"
          rx="5.5"
          ry="15"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
    </svg>
  );
}
