-- RPC function to allow admin users to update passwords for other users
-- This function uses SECURITY DEFINER to run with elevated privileges

CREATE OR REPLACE FUNCTION admin_update_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller is admin (check user_locations table)
  IF NOT EXISTS (
    SELECT 1 FROM user_locations
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update passwords';
  END IF;

  -- Update the user's password using Supabase Auth
  -- Note: This requires the auth schema to be accessible
  UPDATE auth.users
  SET
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'Password updated successfully'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_password(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION admin_update_password IS 'Allows admin users to update passwords for other users. Requires caller to have admin role in user_locations table.';
