export const HomeworkSummaryFooter = ({ records = [] }) => {
  const total = records.length
  
  if (total === 0) return null

  let done = 0
  let inProgress = 0
  let notDone = 0

  records.forEach(r => {
    if (r.progress === 100) done++
    else if (r.progress === 50) inProgress++
    else notDone++
  })

  // Score max = total * 100
  // Current score = done * 100 + inProgress * 50
  const score = total > 0 ? ((done * 100 + inProgress * 50) / (total * 100)) * 100 : 0
  const roundedScore = Math.round(score)

  return (
    <div className="bg-navy-50 border-t border-navy-100 p-4 sticky bottom-0 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 text-sm font-medium">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-200 text-xs">✓</span>
          Hoàn tất: {done}
        </div>
        <div className="flex items-center gap-1.5 text-amber-700">
          <span className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-200 text-xs">⏳</span>
          Chưa hoàn tất: {inProgress}
        </div>
        <div className="flex items-center gap-1.5 text-red-700">
          <span className="w-4 h-4 flex items-center justify-center rounded-full bg-red-200 text-xs">✗</span>
          Không nộp: {notDone}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-64 shrink-0">
        <span className="text-sm font-semibold text-navy-800 w-10 text-right">{roundedScore}%</span>
        <div className="h-2 flex-1 bg-navy-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-navy-600 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${score}%` }} 
          />
        </div>
      </div>
    </div>
  )
}
