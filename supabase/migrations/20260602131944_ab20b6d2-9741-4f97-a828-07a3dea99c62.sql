
-- 1. calendar_events: tighten write policy
DROP POLICY IF EXISTS "Users can manage own events" ON public.calendar_events;
CREATE POLICY "Users can view own and global events" ON public.calendar_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_global = true);
CREATE POLICY "Users can insert own events" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_global = false);
CREATE POLICY "Users can update own events" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND is_global = false)
  WITH CHECK (auth.uid() = user_id AND is_global = false);
CREATE POLICY "Users can delete own events" ON public.calendar_events
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND is_global = false);

-- 2. legal_consultations: require active link between lawyer and patient
DROP POLICY IF EXISTS "Lawyers can view assigned consultations" ON public.legal_consultations;
CREATE POLICY "Lawyers can view assigned consultations" ON public.legal_consultations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = lawyer_id
    AND has_role(auth.uid(), 'professional'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patient_professional_links l
      WHERE l.professional_id = auth.uid()
        AND l.patient_id = legal_consultations.patient_id
        AND l.is_active = true
    )
  );

-- 3. professional_profiles: restrict public listing & hide sensitive cols
DROP POLICY IF EXISTS "Anyone can view approved professionals" ON public.professional_profiles;
CREATE POLICY "Authenticated can view approved professionals" ON public.professional_profiles
  FOR SELECT TO authenticated
  USING (is_approved = true);

REVOKE SELECT ON public.professional_profiles FROM anon;
REVOKE SELECT (whatsapp, payout_amount, professional_email) ON public.professional_profiles FROM authenticated;
GRANT SELECT (
  id, user_id, specialty, bio, credentials, hourly_rate, is_approved, is_online,
  rating, total_sessions, created_at, updated_at, professional_type, council_number,
  council_state, council_verified, approach, specialties, meeting_link,
  gambling_specialist, availability, accepts_plan, photo_url, full_name
) ON public.professional_profiles TO authenticated;

-- 4. profiles: drop broad professional access (sensitive PII like CPF/stripe_customer_id)
DROP POLICY IF EXISTS "Professionals can view linked patient profiles" ON public.profiles;

-- 5. session_credits: remove user-side insert
DROP POLICY IF EXISTS "Users can insert own credits" ON public.session_credits;

-- 6. subscriptions: remove user-side insert
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

-- 7. storage: body-photos UPDATE policy
CREATE POLICY "Users can update own body photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'body-photos' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'body-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 8. storage: exercise-photos missing policies (SELECT already exists; add UPDATE/DELETE)
CREATE POLICY "Users can update own exercise photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'exercise-photos' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'exercise-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own exercise photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 9. SECURITY DEFINER trigger functions: revoke EXECUTE from clients (triggers still work)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_hide_reported_posts() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_comments_count() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_likes_count() FROM anon, authenticated, PUBLIC;
-- has_role and can_access_patient_record are used inside RLS; keep authenticated access but revoke anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_patient_record(uuid, uuid) FROM anon, PUBLIC;
