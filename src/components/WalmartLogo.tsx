import Spark from "@/components/Spark";

// Walmart-style wordmark lockup: "Walmart" + spark. Recreated for practice/demo.
export default function WalmartLogo({
  className = "",
  textClassName = "text-wm-navy",
  size = "md",
}: {
  className?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  const spark = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`${text} font-extrabold tracking-tight ${textClassName}`}>
        Walmart
      </span>
      <Spark className={spark} />
    </span>
  );
}
