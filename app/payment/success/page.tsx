import Link from "next/link";
import PurchaseTracker from "./PurchaseTracker";

export const metadata = {
  title: "Дякуємо за підтримку — Balabony",
  description: "Оплата успішно отримана. Ваша підписка активується протягом хвилини.",
};

export default function PaymentSuccessPage() {
  return (
    <>
    <PurchaseTracker />
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem",
        backgroundColor: "#0e1626",
        color: "#f5f1e8",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(245, 165, 36, 0.25)",
          borderRadius: "16px",
          padding: "3rem 2rem",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            margin: "0 auto 1.5rem",
            borderRadius: "50%",
            backgroundColor: "rgba(245, 165, 36, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            color: "#f5a524",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            margin: "0 0 1rem",
            color: "#f5a524",
          }}
        >
          Дякуємо!
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            margin: "0 0 1.5rem",
            opacity: 0.9,
          }}
        >
          Оплата успішно отримана.
        </p>

        <p
          style={{
            fontSize: "0.95rem",
            lineHeight: 1.6,
            opacity: 0.7,
            margin: "0 0 2rem",
          }}
        >
          Підписка активується протягом хвилини після підтвердження платежу
          від LiqPay. Якщо за 5 хвилин доступ не з&apos;явиться, напишіть нам
          на{" "}
          <a
            href="mailto:nazar@balabony.com"
            style={{ color: "#f5a524", textDecoration: "underline" }}
          >
            nazar@balabony.com
          </a>
          .
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.875rem 1.75rem",
              borderRadius: "10px",
              backgroundColor: "#f5a524",
              color: "#0e1626",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "1rem",
            }}
          >
            На головну
          </Link>
          <Link
            href="/episodes"
            style={{
              display: "inline-block",
              padding: "0.875rem 1.75rem",
              borderRadius: "10px",
              border: "1px solid rgba(245, 241, 232, 0.25)",
              color: "#f5f1e8",
              textDecoration: "none",
              fontSize: "1rem",
            }}
          >
            До серій →
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}
