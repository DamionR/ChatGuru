#!/bin/bash

# Supabase project reference
SUPABASE_PROJECT_REF="zxkvmgmcjuigfgevwdrc"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a3ZtZ21janVpZ2ZnZXZ3ZHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTI2OTEsImV4cCI6MjA1ODQyODY5MX0.fTxsFd_NN4p2i2giUsY1FvFm8hlhrBJ-7ycso4ux8I8"
FUNCTIONS_DIR="$(pwd)/supabase/functions"

# Function to deploy and register an MCP function
deploy_register_function() {
  local function_name=$1
  local intents=$2
  
  echo "=== Deploying Edge Function: ${function_name} ==="
  supabase functions deploy ${function_name} --project-ref ${SUPABASE_PROJECT_REF}
  
  # Check if deployment was successful
  if [ $? -ne 0 ]; then
    echo "Failed to deploy ${function_name}. Continuing anyway..."
  else
    echo "Successfully deployed ${function_name}!"
  fi
  
  # If intents are provided, register the MCP server
  if [ -n "$intents" ]; then
    # URLs for the MCP server
    local sse_url="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/${function_name}/sse"
    local post_url="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/${function_name}/messages"
    
    echo "=== Registering MCP server: ${function_name} ==="
    curl -s -X POST "https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/register-mcp" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ANON_KEY}" \
      -d "{\"server_name\": \"${function_name}\", \"sse_url\": \"${sse_url}\", \"post_url\": \"${post_url}\", \"intents\": ${intents}}"
    
    echo -e "\nMCP server ${function_name} registration completed."
  fi
  
  echo -e "========================================\n"
}

# Function to determine intents for a function based on its name
get_intents_for_function() {
  local function_name=$1
  
  # Define intents based on function name
  case "$function_name" in
    gdrive-mcp)
      echo '[{"intent": "search_drive", "tool_name": "search"}, {"intent": "get_file_details", "tool_name": "getFile"}, {"intent": "list_folder_contents", "tool_name": "listFolder"}]'
      ;;
    *)
      # No intents for other functions
      echo ""
      ;;
  esac
}

echo "===== ChatGuru Edge Functions Deployment ====="

# Loop through all subdirectories in the functions directory
if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "Error: Functions directory not found at $FUNCTIONS_DIR"
  exit 1
fi

# Deploy register-mcp first if it exists
if [ -d "$FUNCTIONS_DIR/register-mcp" ]; then
  deploy_register_function "register-mcp" ""
fi

# Then deploy all other functions
for func_dir in "$FUNCTIONS_DIR"/*; do
  if [ -d "$func_dir" ]; then
    func_name=$(basename "$func_dir")
    
    # Skip register-mcp as it's already deployed
    if [ "$func_name" != "register-mcp" ]; then
      # Get intents for this function
      intents=$(get_intents_for_function "$func_name")
      
      # Deploy and register
      deploy_register_function "$func_name" "$intents"
    fi
  fi
done

echo "===== Deployment Process Completed ====="
echo "Deployed and registered all functions in $FUNCTIONS_DIR"