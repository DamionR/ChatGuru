
# ChatGuru

ChatGuru is an enterprise‐grade, real‐time chat application powered by OpenRouter and hosted on GitHub Pages with Jekyll. It dynamically fetches free AI models, integrates Supabase for user authentication and profile management, and provides advanced features such as persistent conversation history and integrated MCP servers for tools like Google Maps, GitHub, and GDrive.

## Features

• Real-Time Chat – Instant messaging with AI-powered responses.  
• Dynamic Model Selection – Automatically fetches and displays free models from OpenRouter.  
• Persistent Conversation History – Conversations are saved per user and can be reloaded.  
• Robust User Authentication – Secure sign up, sign in, password reset, and profile management powered by Supabase.  
• Integrated MCP Servers – Extend functionality via MCP servers (Google Maps, GitHub, GDrive, etc.).  
• Responsive, Enterprise-Grade UI/UX – Mobile-first, clean design with smooth transitions and interactive elements (e.g., clickable addresses that open modal maps).  
• GitHub Pages Deployment – Simple, automated deployment using Jekyll.

## Live Demo

Visit [https://DamionR.github.io/ChatGuru/](https://DamionR.github.io/ChatGuru/) to view the live application.

## Setup

### Prerequisites
• Ruby 3.4.2+ (e.g., install via `brew install ruby` on macOS)  
• Git for version control  
• Bundler and Jekyll (`gem install bundler jekyll`)  
• OpenRouter API key from [openrouter.ai](https://openrouter.ai)  
• Supabase project with authentication and required database schema (see `init_db.sh`)

### Installation

Clone the repository:
~~~bash
git clone https://github.com/DamionR/ChatGuru.git
cd ChatGuru
~~~

Install dependencies:
~~~bash
gem install jekyll bundler
bundle install
~~~

Link your local project to Supabase (ensure your project is already linked):
~~~bash
supabase link --project-ref zxkvmgmcjuigfgevwdrc
~~~

Set the environment secret for the Google Maps API key:
~~~bash
supabase functions secrets set GOOGLE_MAPS_API_KEY=AIzaSyCYhgqMfTMImNQQjQb6gzHYtW1EODYPpEI
~~~

### Running Locally

Serve the site locally with:
~~~bash
bundle exec jekyll serve --baseurl ""
~~~
Open [http://localhost:4000/ChatGuru/](http://localhost:4000/ChatGuru/) in your browser.

## Usage

• **Chat Interface:** Select an AI model, type your message, and click “Send”.  
• **Conversation History:** Logged‑in users have their past conversations saved and can click a history item to reload the chat.  
• **Settings:** Use the settings modal to update your API key, system prompt, and AI parameters.  
• **User Authentication:** Manage sign up, sign in, password reset, and profile updates via dedicated pages.  
• **Integrated Tools:** Interact with integrated MCP servers for additional functionality (e.g., map rendering with interactive modals).

## Deployment

1. Commit and push your changes:
~~~bash
git add .
git commit -m "Update ChatGuru"
git push origin main
~~~
2. In your GitHub repository, go to **Settings > Pages** and set the source to the main branch.
3. Access your deployed site at [https://DamionR.github.io/ChatGuru/](https://DamionR.github.io/ChatGuru/).

## Project Structure

• **/_config.yml:** Jekyll configuration.  
• **/_layouts:** Base layouts (e.g., `default.html`).  
• **/_includes:** Reusable partials (header, footer, auth navigation).  
• **/assets/css:**  
 – `style.css`: Chat interface and general layout styles.  
 – `auth.css`: Authentication page styles.  
• **/assets/js:**  
 – **/chat:**  
  • `mcpClient.js`: MCP client for server-sent events and tool calls.  
  • `chatRenderer.js`: Renders messages, including interactive maps and clickable elements.  
  • `chatSettings.js`: Manages chat settings in localStorage.  
  • `chat.js`: Main chat module tying together chat functionality, conversation history, and model fetching.  
 – `supabase-client.js`: Initializes the Supabase client and provides authentication functions.  
• **/supabase/functions:** Serverless functions (MCP servers for Google Maps, GitHub auth, GDrive, etc.).  
• **/index.markdown:** Main entry point for the chat interface.  
• **Authentication Pages:** `signin.html`, `signup.html`, `reset-password.html`, `update-password.html`, `profile.html`.  
• **Error Pages:** `404.html` and `auth-error.html`.

## Contributing

1. Fork the repository.  
2. Create a new branch for your feature or fix.  
3. Make your changes while following the code style and structure.  
4. Submit a pull request detailing your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

• OpenRouter – Free AI models.  
• Supabase – Robust backend services.  
• Jekyll – Static site generation for GitHub Pages.  
• Design inspiration from modern enterprise interfaces.

## Contact

For issues or feature requests, please open an issue in the GitHub repository or contact the project maintainers directly.
~~~
