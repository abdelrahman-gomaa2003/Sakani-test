-- أوقف التريجر خالص (مش هنحتاجه)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- فعّل التأكيد للك المستخدمين
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
