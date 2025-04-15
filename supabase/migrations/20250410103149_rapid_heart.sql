/*
  # Add email columns to profiles and token_requests

  1. Changes
    - Add email column to profiles table
    - Add user_email column to token_requests table
    - Update handle_new_user trigger to store email
    - Add trigger to sync email changes

  2. Security
    - Maintain existing RLS policies
    - Email columns are protected by existing table policies
*/

-- Add email column to profiles
ALTER TABLE public.profiles 
ADD COLUMN email TEXT NOT NULL DEFAULT '';

-- Add user_email column to token_requests
ALTER TABLE public.token_requests 
ADD COLUMN user_email TEXT NOT NULL DEFAULT '';

-- Update existing profiles with emails from auth.users
DO $$
BEGIN
  UPDATE public.profiles
  SET email = (
    SELECT email 
    FROM auth.users 
    WHERE users.id = profiles.id
  )
  WHERE email = '';
END $$;

-- Update existing token_requests with emails from profiles
DO $$
BEGIN
  UPDATE public.token_requests
  SET user_email = (
    SELECT email 
    FROM public.profiles 
    WHERE profiles.id = token_requests.user_id
  )
  WHERE user_email = '';
END $$;

-- Drop and recreate handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'user'
    END,
    NEW.email
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger function to sync email changes to token_requests
CREATE OR REPLACE FUNCTION sync_token_request_email()
RETURNS trigger AS $$
BEGIN
  UPDATE public.token_requests
  SET user_email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to sync email changes
CREATE TRIGGER sync_token_request_email_trigger
AFTER UPDATE OF email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_token_request_email();