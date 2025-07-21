-- Make any existing user an admin
UPDATE users SET is_admin = true;
-- Reset the admin flag for specific users if needed
-- UPDATE users SET is_admin = false WHERE username NOT IN ('admin', 'Chaitanya');
-- Verify changes
SELECT id, username, email, is_admin FROM users; 