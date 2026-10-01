# Ask the Docs

Ask questions about your team documents. Passages are ranked locally with BM25 and Claude answers from them with citations.

A portfolio project by [Peter Goodwin](https://goodwinstudios.com.au), built with Next.js and the Claude API.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3002. Without an API key the app runs in **demo mode** with sample results.
Demo link: http://localhost:3002/?q=Can I deploy on a Friday?

## Use Claude

Copy `.env.example` to `.env.local` and add your key:

```
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-haiku-4-5
```

The key is only read on the server and is never sent to the browser. Each visitor is limited to a small number of requests per hour.
