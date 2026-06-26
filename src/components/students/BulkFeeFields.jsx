import { clsx } from 'clsx'
import { CurrencyInput } from '@/components/ui'

// Fee form dùng chung cho luồng ghi danh hàng loạt.
// Parent giữ state: feeType + monthlyFee + courseFee.
export const BulkFeeFields = ({
  feeType,
  setFeeType,
  monthlyFee,
  setMonthlyFee,
  courseFee,
  setCourseFee,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-navy-700">Học phí chung cho tất cả</label>
    <div className="flex gap-1 p-1 bg-navy-50 rounded-xl">
      <button
        type="button"
        onClick={() => setFeeType('monthly')}
        className={clsx(
          'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
          feeType === 'monthly' ? 'bg-white shadow-sm text-navy-800' : 'text-navy-500 hover:text-navy-700'
        )}
      >
        Theo tháng
      </button>
      <button
        type="button"
        onClick={() => setFeeType('course')}
        className={clsx(
          'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
          feeType === 'course' ? 'bg-white shadow-sm text-navy-800' : 'text-navy-500 hover:text-navy-700'
        )}
      >
        Theo khóa
      </button>
    </div>
    {feeType === 'monthly' ? (
      <CurrencyInput
        label="Học phí tháng (VNĐ)"
        value={monthlyFee}
        onChange={setMonthlyFee}
        className="text-sm"
      />
    ) : (
      <CurrencyInput
        label="Học phí cả khóa (VNĐ)"
        value={courseFee}
        onChange={setCourseFee}
        className="text-sm"
      />
    )}
  </div>
)
