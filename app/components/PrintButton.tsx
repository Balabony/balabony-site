'use client'

// 06.11.2026: автори не розуміли, що «Зберегти як PDF» відкриває вікно друку (лист авторки:
// «відкривається не папка, а вікно для друку»). Справжнього PDF-файлу сервер поки не генерує,
// тому під кнопкою — коротка інструкція, як зберегти файл через друк.
export default function PrintButton() {
  return (
    <span className="pb-wrap" style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
      <style>{'@media print{.pb-wrap{display:none!important}}'}</style>
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          fontSize: 14, fontWeight: 700, color: '#16202e', background: '#ef9f27',
          border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
          fontFamily: 'Arial, sans-serif', alignSelf: 'flex-start',
        }}
      >
        Зберегти як PDF
      </button>
      <span className="pb-hint" style={{ fontSize: 13, lineHeight: 1.45, color: '#5b6577', fontFamily: 'Arial, sans-serif' }}>
        Відкриється вікно друку. У полі «Принтер» (або «Призначення») виберіть <b>«Зберегти як PDF»</b> і натисніть «Зберегти» — файл
        з’явиться в папці «Завантаження». Його й завантажуйте для підпису КЕП у Дії.
      </span>
    </span>
  )
}
