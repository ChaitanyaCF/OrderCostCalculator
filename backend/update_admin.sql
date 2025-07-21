-- Update the user named 'Chaitanya' to have admin privileges
UPDATE users SET is_admin = true WHERE username = 'Chaitanya';
-- Verify the change
SELECT id, username, is_admin FROM users WHERE username = 'Chaitanya'; 