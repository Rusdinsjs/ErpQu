DO $$
DECLARE
    row RECORD;
    truncate_stmt TEXT := '';
BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_organization_id_fkey;
    
    UPDATE public.users SET department_id = NULL, organization_id = NULL;
    UPDATE public.user_roles SET organization_id = NULL;

    FOR row IN
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('public', 'hr', 'crm', 'rental', 'inventory', 'commercial')
          AND tablename NOT IN ('users', 'roles', 'user_roles', '_sqlx_migrations')
    LOOP
        truncate_stmt := truncate_stmt || quote_ident(row.schemaname) || '.' || quote_ident(row.tablename) || ', ';
    END LOOP;

    IF length(truncate_stmt) > 0 THEN
        truncate_stmt := 'TRUNCATE ' || rtrim(truncate_stmt, ', ') || ' CASCADE;';
        RAISE NOTICE 'Executing: %', truncate_stmt;
        -- EXECUTE truncate_stmt; -- Commented out to just see the generated statement
    END IF;

    -- Re-add FKs (if we were executing it)
END $$;
