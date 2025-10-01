-- Update loan start dates from August to September
-- This script changes the loan_start_date from August 2024 to September 2024
-- so that the first payment month is September instead of August

-- Update all users' loan start dates
UPDATE users 
SET 
  loan_start_date = '2024-09-01',
  updated_at = NOW()
WHERE 
  loan_start_date = '2024-08-01' 
  OR loan_start_date = '2024-08-15'
  OR loan_start_date = '2024-08-31';

-- Verify the changes
SELECT 
  id,
  name,
  email,
  loan_start_date,
  loan_amount,
  monthly_payment,
  loan_duration_months
FROM users 
ORDER BY created_at;
