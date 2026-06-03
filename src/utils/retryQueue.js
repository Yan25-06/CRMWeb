const queue = []

if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const pending = queue.splice(0)
    for (const fn of pending) {
      try { await fn() } catch { /* ignore individual retry failures */ }
    }
  })
}

export const enqueueRetry = (fn) => { queue.push(fn) }
export const getPendingCount = () => queue.length
