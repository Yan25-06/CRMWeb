import { useRef } from 'react'
import { ExportExcelButton } from './ExportExcelButton'
import { ExportPdfButton } from './ExportPdfButton'

export const ReportCard = ({ title, filters, children, excelRows, excelColumns, excelFilename, pdfFilename, hasData }) => {
  const cardRef = useRef(null)

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-navy-800 text-base">{title}</h3>
        <div className="flex items-center gap-2">
          {filters}
          <ExportExcelButton
            rows={excelRows}
            columns={excelColumns}
            filename={excelFilename}
            disabled={!hasData}
          />
          <ExportPdfButton
            targetRef={cardRef}
            filename={pdfFilename}
            disabled={!hasData}
          />
        </div>
      </div>
      <div ref={cardRef}>
        {children}
      </div>
    </div>
  )
}
