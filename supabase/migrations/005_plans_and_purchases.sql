-- ============================================================
-- Міграція 005: тарифи, нові поля підписок і stories,
--               поштучні покупки, індекси, RLS
-- Платформа Balabony — українські аудіоісторії
-- ============================================================

-- ------------------------------------------------------------
-- 1. Таблиця plans — довідник тарифних планів
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  price_kopecks INT         NOT NULL,
  period_days   INT,                                -- NULL = разова, 30 = місяць, 365 = рік
  is_recurring  BOOLEAN     NOT NULL DEFAULT false, -- true тільки для monthly_regular
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plans IS 'Довідник тарифних планів Balabony';

INSERT INTO public.plans (id, name, price_kopecks, period_days, is_recurring) VALUES
  ('one_time',        'Поштучно',      900,   NULL, false),
  ('benefit_yearly',  'Пільговий',     100,   365,  false),
  ('monthly_first',   'Перший місяць', 4900,  30,   false),
  ('monthly_regular', 'Місячний',      12900, 30,   true),
  ('yearly',          'Річний',        89000, 365,  false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Нові колонки в існуючій таблиці subscriptions
--    (НЕ видаляємо і НЕ змінюємо наявні колонки)
-- ------------------------------------------------------------

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.plans(id);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_first_month BOOLEAN DEFAULT false;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS liqpay_token TEXT;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS next_charge_at TIMESTAMPTZ;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS next_charge_kopecks INT;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 3. Таблиця purchases — поштучні покупки окремих історій
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchases (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id         TEXT        NOT NULL,
  email             TEXT,
  story_id          UUID        REFERENCES public.stories(id),
  -- навмисно БЕЗ ON DELETE CASCADE:
  -- запис покупки зберігається навіть якщо історію видалено
  price_kopecks     INT,
  paid_at           TIMESTAMPTZ,                    -- NULL до підтвердження оплати LiqPay
  liqpay_order_id   TEXT,
  liqpay_payment_id TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.purchases IS 'Поштучні покупки окремих історій Balabony';

-- ------------------------------------------------------------
-- 4. Нові колонки в таблиці stories
--    (НЕ видаляємо наявні колонки)
-- ------------------------------------------------------------

-- Жанр (може вже існувати — IF NOT EXISTS безпечно)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS genre TEXT;

-- Тривалість аудіо в хвилинах (ціле число)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- Тематична категорія (ширша за жанр: 'дитячі', 'підлітки', 'дорослі' тощо)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS category TEXT;

-- URL аудіофайлу в Storage
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Стан генерації/обробки аудіо
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS audio_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (audio_status IN ('pending', 'processing', 'ready', 'failed'));

-- ------------------------------------------------------------
-- 5. Індекси
-- ------------------------------------------------------------

-- purchases: пошук за пристроєм, за story, за статусом
CREATE INDEX IF NOT EXISTS idx_purchases_device_id
  ON public.purchases (device_id);

CREATE INDEX IF NOT EXISTS idx_purchases_story_id
  ON public.purchases (story_id);

CREATE INDEX IF NOT EXISTS idx_purchases_status
  ON public.purchases (status);

-- subscriptions: пошук за plan_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
  ON public.subscriptions (plan_id);

-- stories: пошук за audio_status (для черги генерації аудіо)
CREATE INDEX IF NOT EXISTS idx_stories_audio_status
  ON public.stories (audio_status);

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------

-- plans: публічне читання (усі тарифи видно без авторизації)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_select_all" ON public.plans;
CREATE POLICY "plans_select_all"
  ON public.plans
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- purchases: RLS увімкнено, конкретні політики додамо при підключенні клієнта
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- subscriptions: RLS НЕ чіпаємо (наявні політики збережено)
