-- Fix 1: Prevent non-admins from inserting roles into user_roles
-- The existing ALL policy for admins is permissive, so we need a restrictive policy
-- to block non-admin INSERT attempts
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Drop the overly permissive lawyer SELECT policy and replace with role-verified one
DROP POLICY IF EXISTS "Lawyers can view assigned consultations" ON public.legal_consultations;

CREATE POLICY "Lawyers can view assigned consultations"
ON public.legal_consultations
FOR SELECT
USING (
  auth.uid() = lawyer_id
  AND has_role(auth.uid(), 'professional'::app_role)
);