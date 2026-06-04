
-- 1. Professional profiles: revoke sensitive columns from anon/authenticated
REVOKE SELECT (whatsapp, professional_email, payout_amount, meeting_link)
  ON public.professional_profiles FROM authenticated, anon;

-- Secure function so a user can retrieve the meeting link only for their own active appointment
CREATE OR REPLACE FUNCTION public.get_professional_meeting_link(_professional_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pp.meeting_link
  FROM public.professional_profiles pp
  WHERE pp.id = _professional_id
    AND (
      auth.uid() = pp.user_id
      OR EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.professional_id = _professional_id
          AND a.user_id = auth.uid()
          AND a.status IN ('scheduled','completed')
      )
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_professional_meeting_link(uuid) TO authenticated;

-- 2. Session credits: drop user self-update policy
DROP POLICY IF EXISTS "Users can update own credits" ON public.session_credits;

-- 3. Lawyer availability: require authentication
DROP POLICY IF EXISTS "Anyone can view lawyer availability" ON public.lawyer_availability;
CREATE POLICY "Authenticated can view lawyer availability"
  ON public.lawyer_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Remove direct_messages from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.direct_messages;
