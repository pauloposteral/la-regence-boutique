ALTER TABLE public.tv_videos ADD COLUMN IF NOT EXISTS rotation_group text;
COMMENT ON COLUMN public.tv_videos.rotation_group IS
  'Editions of the same campaign share a group so the screen can space them within a round.';

-- Group the existing editions without changing their activation, titles or order.
UPDATE public.tv_videos AS video
SET rotation_group = edition.campaign
FROM (VALUES
  ('317dab46-c831-4710-89d0-112fdd1d87bc'::uuid, 'frappe'),
  ('f43886aa-4301-4c2e-8ccb-ea5959a8de86'::uuid, 'frappe'),
  ('fa1b77dc-d93d-45ff-bf24-d5d34a3d88c7'::uuid, 'affogato'),
  ('69b32c85-4dad-4eeb-b927-ee42f56c35d6'::uuid, 'nutellino-chocolate'),
  ('98857e2e-2f61-4ae2-867c-a8aba7286792'::uuid, 'nutellino-chocolate'),
  ('18a19ffe-de7d-489b-b2ae-3852aeca4245'::uuid, 'petit-gateau'),
  ('b2fc7b03-d5ec-4634-b19b-e229f5f29a21'::uuid, 'mini-pizzas'),
  ('127dec44-315f-4af4-903e-c7695ca642b9'::uuid, 'mini-pizzas'),
  ('8905d2c6-e670-4614-90bc-ba75bcfe5a95'::uuid, 'soda-italiana'),
  ('06f78eac-e255-4079-aed3-fa72b23c25ac'::uuid, 'petit-gateau'),
  ('17b27821-fff8-47f8-9dc8-51e8eadf830c'::uuid, 'soda-italiana')
) AS edition(id, campaign)
WHERE video.id = edition.id AND video.rotation_group IS NULL;
