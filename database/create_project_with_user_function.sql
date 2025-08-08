-- Create a PostgreSQL function to create user and project in a single transaction
-- This bypasses RLS issues by doing everything in one atomic operation

CREATE OR REPLACE FUNCTION create_project_with_user(
    user_id UUID,
    user_email TEXT,
    project_id UUID,
    project_name TEXT,
    project_description TEXT,
    project_slug TEXT,
    project_call_to_action TEXT DEFAULT 'Share your experience'
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    created_project_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
BEGIN
    -- First, insert or update the user
    INSERT INTO users (id, email, created_at, updated_at)
    VALUES (user_id, user_email, NOW(), NOW())
    ON CONFLICT (id) 
    DO UPDATE SET 
        email = EXCLUDED.email,
        updated_at = NOW();
    
    -- Then, insert the project
    INSERT INTO projects (id, name, description, slug, call_to_action, user_id, created_at, updated_at)
    VALUES (project_id, project_name, project_description, project_slug, project_call_to_action, user_id, NOW(), NOW());
    
    -- Return success
    RETURN QUERY SELECT TRUE as success, 'Project created successfully'::TEXT as message, project_id as created_project_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN QUERY SELECT FALSE as success, SQLERRM::TEXT as message, NULL::UUID as created_project_id;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION create_project_with_user TO service_role;

-- Also grant to authenticated users if needed
GRANT EXECUTE ON FUNCTION create_project_with_user TO authenticated;
