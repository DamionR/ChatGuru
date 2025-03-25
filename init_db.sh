#!/bin/bash

# Initialize the database schema
echo "Initializing Supabase database schema..."

curl -X POST "https://zxkvmgmcjuigfgevwdrc.supabase.co/rest/v1/rpc/execute_sql" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a3ZtZ21janVpZ2ZnZXZ3ZHJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1MjY5MSwiZXhwIjoyMDU4NDI4NjkxfQ.ZP5pR7_9MP9s9ZxKosUnmP9HVu94niRuprVVU0sFJzk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a3ZtZ21janVpZ2ZnZXZ3ZHJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1MjY5MSwiZXhwIjoyMDU4NDI4NjkxfQ.ZP5pR7_9MP9s9ZxKosUnmP9HVu94niRuprVVU0sFJzk" \
  -d '{
    "sql": "CREATE TABLE IF NOT EXISTS tokens (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, access_token TEXT NOT NULL, refresh_token TEXT, provider TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()); CREATE TABLE IF NOT EXISTS mcp_servers (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL, sse_url TEXT NOT NULL, post_url TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), CONSTRAINT unique_mcp_server_name UNIQUE (name)); CREATE TABLE IF NOT EXISTS intent_mappings (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, intent TEXT NOT NULL UNIQUE, server_name TEXT NOT NULL, tool_name TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), CONSTRAINT fk_server_name FOREIGN KEY (server_name) REFERENCES mcp_servers(name)); CREATE OR REPLACE FUNCTION register_mcp_server(server_name TEXT, sse_url TEXT, post_url TEXT, intents JSONB) RETURNS VOID AS $$ BEGIN INSERT INTO mcp_servers (name, sse_url, post_url) VALUES (server_name, sse_url, post_url) ON CONFLICT ON CONSTRAINT unique_mcp_server_name DO UPDATE SET sse_url = EXCLUDED.sse_url, post_url = EXCLUDED.post_url; FOR i IN 0..(jsonb_array_length(intents) - 1) LOOP INSERT INTO intent_mappings (intent, server_name, tool_name) VALUES ((intents->i->>''intent'')::TEXT, server_name, (intents->i->>''tool_name'')::TEXT) ON CONFLICT (intent) DO UPDATE SET server_name = EXCLUDED.server_name, tool_name = EXCLUDED.tool_name; END LOOP; END; $$ LANGUAGE plpgsql;"
  }'

echo "Database schema initialized."