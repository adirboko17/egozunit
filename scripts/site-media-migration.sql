-- Media coverage items (עלינו בתקשורת)
CREATE TABLE IF NOT EXISTS public.site_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  media_type text NOT NULL DEFAULT 'article' CHECK (media_type IN ('article', 'video')),
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_media_published_sort_idx
  ON public.site_media (is_published, sort_order);

ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published site_media" ON public.site_media;
CREATE POLICY "Public read published site_media"
  ON public.site_media FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin manage site_media" ON public.site_media;
CREATE POLICY "Admin manage site_media"
  ON public.site_media FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
