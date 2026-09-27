NEXUS

Nexus is a fast, clean web search engine built by repurposing the NexAi-Neo repository.

STACK
- React 19 + Vite
- Vercel serverless API
- GitHub source control
- Brave Search API for full web results
- Wikipedia fallback when no Brave key is configured

DEVELOPMENT
npm install
npm run dev

VERCEL
Set BRAVE_SEARCH_API_KEY in the Vercel project's Production environment. Without the key, Nexus still works using Wikipedia search as a fallback.
Build command: npm run build
Output directory: dist

SEARCH URLS
Nexus uses normal query URLs such as /search?q=quantum+biology. Searches are shareable, bookmarkable, and directly addressable.

The old Telegram/Gemini bot implementation has been retired from the active web build; this repository is now the Nexus search engine project.