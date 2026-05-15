'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3ED]">
      <div className="bg-white rounded-2xl border border-black/5 p-8 text-center max-w-sm">
        <div className="text-lg font-semibold text-[#1A1510] mb-2">Bir hata oluştu</div>
        <div className="text-sm text-[#9D9186] mb-5">İşlem tamamlanamadı.</div>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-[#6E5E51] text-white text-sm font-medium hover:bg-[#5C4B38] transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
