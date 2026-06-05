import { Component } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'

// React error boundaries chỉ hỗ trợ qua class component (componentDidCatch /
// getDerivedStateFromError) — đây là ngoại lệ hợp lệ với quy tắc "chỉ functional component".
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Vẫn log stack để debug (kể cả khi đã chặn màn hình trắng).
    console.error('[ErrorBoundary] Lỗi render bị bắt:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-navy-sm border border-navy-100 p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-navy-900">Đã xảy ra lỗi</h1>
          <p className="text-sm text-navy-500">
            Ứng dụng gặp sự cố ngoài ý muốn. Vui lòng tải lại trang. Nếu lỗi vẫn tiếp diễn, hãy liên hệ quản trị viên.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-2 flex items-center gap-2 bg-navy-900 text-white rounded-xl py-2.5 px-5 text-sm font-semibold hover:bg-navy-800 transition"
          >
            <RotateCw size={16} /> Tải lại trang
          </button>
        </div>
      </div>
    )
  }
}
