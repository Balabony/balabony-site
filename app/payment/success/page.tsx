import Link from "next/link";

export const metadata = {
  title: "Дякуємо за підтримку — Balabony",
  description: "Оплата успішно отримана. Ваша підписка активується протягом хвилини.",
};

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">✓</div>

        <h1 className="text-3xl font-bold">Дякуємо!</h1>

        <p className="text-lg opacity-80">
          Оплата успішно отримана.
        </p>

        <p className="opacity-70 text-sm">
          Підписка активується протягом хвилини після підтвердження
          платежу від LiqPay. Якщо за 5 хвилин доступ не з&apos;явиться,
          напишіть нам на{" "}
          <a
            href="mailto:nazar@balabony.com"
            className="underline hover:opacity-100"
          >
            nazar@balabony.com
          </a>
          .
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition"
          >
            На головну
          </Link>
          <Link
            href="/episodes"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition"
          >
            До серій →
          </Link>
        </div>
      </div>
    </main>
  );
}
