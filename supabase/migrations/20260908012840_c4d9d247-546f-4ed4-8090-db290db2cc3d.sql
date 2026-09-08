REVOKE EXECUTE ON FUNCTION public.audit_table_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.award_points_on_delivery() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_cart_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_loyalty_tier() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_loyalty_tier(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon, authenticated, public;

REVOKE EXECUTE ON FUNCTION public.preview_coupon(text, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_points(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.preview_coupon(text, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_points(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_loyalty_tier(uuid) TO service_role;