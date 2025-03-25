import os
from pathlib import Path

# List of file paths to process
file_paths = [
    "/Users/damionrashford/ChatGuru/README.md",
    "/Users/damionrashford/ChatGuru/package.json",
    "/Users/damionrashford/ChatGuru/organize_project.sh",
    "/Users/damionrashford/ChatGuru/init_db.sh",
    "/Users/damionrashford/ChatGuru/index.markdown",
    "/Users/damionrashford/ChatGuru/Gemfile.lock",
    "/Users/damionrashford/ChatGuru/Gemfile",
    "/Users/damionrashford/ChatGuru/auth-error.html",
    "/Users/damionrashford/ChatGuru/deploy_edge_functions.sh",
    "/Users/damionrashford/ChatGuru/404.html",
    "/Users/damionrashford/ChatGuru/.gitignore",
    "/Users/damionrashford/ChatGuru/_config.yml",
    "/Users/damionrashford/ChatGuru/supabase/config.toml",
    "/Users/damionrashford/ChatGuru/supabase/.gitignore",
    "/Users/damionrashford/ChatGuru/supabase/functions/register-mcp/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/register-mcp/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/register-mcp/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/maps-mcp/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/maps-mcp/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/maps-mcp/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/github-token-exchange/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/github-token-exchange/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/github-token-exchange/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/github-mcp/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/github-mcp/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/github-mcp/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/git-mcp/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/git-mcp/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/git-mcp/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/gdrive-mcp/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/gdrive-mcp/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/gdrive-mcp/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/gdrive-auth/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/gdrive-auth/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/gdrive-auth/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/filesystem-mcp/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/filesystem-mcp/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/filesystem-mcp/.npmrc",
    "/Users/damionrashford/ChatGuru/supabase/functions/fetch-mcp/deno.json",
    "/Users/damionrashford/ChatGuru/supabase/functions/fetch-mcp/index.ts",
    "/Users/damionrashford/ChatGuru/supabase/functions/fetch-mcp/.npmrc",
    "/Users/damionrashford/ChatGuru/auth/update-password.html",
    "/Users/damionrashford/ChatGuru/auth/signup.html",
    "/Users/damionrashford/ChatGuru/auth/signin.html",
    "/Users/damionrashford/ChatGuru/auth/reset-password.html",
    "/Users/damionrashford/ChatGuru/auth/profile.html",
    "/Users/damionrashford/ChatGuru/auth/github/callback.html",
    "/Users/damionrashford/ChatGuru/assets/js/supabase-client.js",
    "/Users/damionrashford/ChatGuru/assets/js/chat/mcpClient.js",
    "/Users/damionrashford/ChatGuru/assets/js/chat/conversationHistory.js",
    "/Users/damionrashford/ChatGuru/assets/js/chat/chatSettings.js",
    "/Users/damionrashford/ChatGuru/assets/js/chat/chatRenderer.js",
    "/Users/damionrashford/ChatGuru/assets/js/chat/chat.js",
    "/Users/damionrashford/ChatGuru/assets/css/style.css",
    "/Users/damionrashford/ChatGuru/assets/css/auth.css",
    "/Users/damionrashford/ChatGuru/_layouts/default.html",
    "/Users/damionrashford/ChatGuru/_includes/nav.html",
    "/Users/damionrashford/ChatGuru/_includes/head.html"
]

def write_files_to_output():
    # Set output file path in project root
    output_file = Path.cwd() / "file_contents_output.txt"
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for file_path in file_paths:
            # Skip directories
            if os.path.isdir(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as infile:
                    # Write file path as header
                    outfile.write(f"\n{'=' * 50}\n")
                    outfile.write(f"Contents of: {file_path}\n")
                    outfile.write(f"{'=' * 50}\n\n")
                    
                    # Write file contents
                    contents = infile.read()
                    outfile.write(contents)
                    outfile.write("\n")
                    
            except FileNotFoundError:
                outfile.write(f"\n{'=' * 50}\n")
                outfile.write(f"File not found: {file_path}\n")
                outfile.write(f"{'=' * 50}\n\n")
            except Exception as e:
                outfile.write(f"\n{'=' * 50}\n")
                outfile.write(f"Error reading {file_path}: {str(e)}\n")
                outfile.write(f"{'=' * 50}\n\n")

if __name__ == "__main__":
    write_files_to_output()
    print("File contents have been written to 'file_contents_output.txt' in the project root.")