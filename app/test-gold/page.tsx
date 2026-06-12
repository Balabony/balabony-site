import StoryCardGold from '../../components/StoryCardGold'

export default function TestGoldPage() {
  return (
    <div style={{ padding: '40px 5%', minHeight: '100vh' }}>
      <StoryCardGold
        kicker="Історія дня"
        title="Як лис знайшов дорогу додому"
        note="Кремовий блок — для виділень і підказок."
      >
        Сонце вже хилилося за гору, коли малий лис зрозумів, що заблукав.
      </StoryCardGold>
    </div>
  )
}