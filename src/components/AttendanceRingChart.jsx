export const AttendanceRingChart = ({ present, total, size = 48 }) => {
  const percent = total > 0 ? Math.round((present / total) * 100) : 0
  const radius = size * 0.4
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      title={`${present}/${total} buổi có mặt`}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={size * 0.15}
          className="text-navy-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={size * 0.15}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="text-navy-600 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-navy-800" style={{ fontSize: size * 0.25 }}>
          {percent}%
        </span>
      </div>
    </div>
  )
}
