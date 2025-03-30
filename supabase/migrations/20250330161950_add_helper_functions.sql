-- Create a function to list all tables in a given schema
CREATE OR REPLACE FUNCTION public.get_tables_in_schema(schema_name text)
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tablename::text
  FROM pg_catalog.pg_tables
  WHERE schemaname = schema_name
  ORDER BY tablename;
$$;

-- Grant execute permission to the anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_tables_in_schema TO anon, authenticated; 