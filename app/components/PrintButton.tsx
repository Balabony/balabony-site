'use client'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        fontSize: 14, fontWeight: 700, color: '#16202e', background: '#ef9f27',
        border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      Зберегти як PDF
    </button>
  )
}
