-- Migration: 20260813204500_fix_launchpad_config_routes
-- Description: Updates the launchpad_config in the database to point to the new Workspace routes

UPDATE settings
SET value = jsonb_set(
    value,
    '{modules}',
    (
        SELECT jsonb_agg(
            CASE 
                WHEN elem->>'id' = 'asset-management' THEN jsonb_set(elem, '{defaultRoute}', '"/assets-workspace"')
                WHEN elem->>'id' = 'commercial' THEN jsonb_set(elem, '{defaultRoute}', '"/selling-workspace"')
                WHEN elem->>'id' = 'procurement' THEN jsonb_set(elem, '{defaultRoute}', '"/buying-workspace"')
                WHEN elem->>'id' = 'supply-chain' THEN jsonb_set(elem, '{defaultRoute}', '"/stock-workspace"')
                WHEN elem->>'id' = 'finance' THEN jsonb_set(elem, '{defaultRoute}', '"/accounting-workspace"')
                ELSE elem
            END
        )
        FROM jsonb_array_elements(value->'modules') AS elem
    )
)
WHERE key = 'launchpad_config' AND jsonb_typeof(value) = 'object' AND value ? 'modules';
