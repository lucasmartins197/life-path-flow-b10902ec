
-- Add type column to distinguish income from expenses
ALTER TABLE public.financial_transactions
ADD COLUMN type text NOT NULL DEFAULT 'expense';

-- Add recurring fields
ALTER TABLE public.financial_transactions
ADD COLUMN is_recurring boolean NOT NULL DEFAULT false;

ALTER TABLE public.financial_transactions
ADD COLUMN recurring_day integer;

-- Add index for type filtering
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
