Since the current application is written in React with TypeScript/JSX (.tsx), it cannot be deployed as a simple static HTML file because browsers cannot natively understand TypeScript or JSX syntax. You need a "Build Tool" (like Vite) to translate your code into standard JavaScript that browsers can run.
Here is your comprehensive guide to preparing and deploying this system to Vercel or Netlify.
Phase 1: Local Project Setup (The Build Wrapper)
You need to wrap your existing files in a standard project structure.
Create a folder named tfda-ai-review.
Move your existing files into a subfolder named src.
src/App.tsx
src/index.tsx
src/types.ts
src/constants.ts
src/services/geminiService.ts
src/components/Dashboard.tsx
Move index.html to the root folder (outside of src).
Move metadata.json to a new folder named public (create this folder in the root).
Your folder structure should look like this:
code
Text
tfda-ai-review/
├── public/
│   └── metadata.json
├── src/
│   ├── components/
│   ├── services/
│   ├── App.tsx
│   ├── index.tsx
│   ├── types.ts
│   └── constants.ts
├── index.html
├── package.json       (See Phase 2)
├── tsconfig.json      (See Phase 2)
└── vite.config.ts     (See Phase 2)
Phase 2: Essential Configuration Code (Modifications Required)
To make this deployable, you need to create three new configuration files and slightly modify index.html.
1. Create package.json (in root)
This file tells the server what libraries to install.
code
JSON
{
  "name": "tfda-ai-review",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@google/genai": "^0.1.1",
    "lucide-react": "^0.344.0",
    "recharts": "^2.12.0",
    "pdfjs-dist": "3.11.174"
  },
  "devDependencies": {
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.6",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1"
  }
}
2. Create vite.config.ts (in root)
This configures how the app is built.
code
TypeScript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Needed for top-level await or modern JS features
  }
});
3. Create tsconfig.json (in root)
This configures TypeScript.
code
JSON
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
(Note: You can create a dummy tsconfig.node.json or simply remove the "references" line if it causes issues).
4. Modify index.html (in root)
You must remove the importmap (since we are now using package.json for dependencies) and tell Vite where your entry file is.
Replace your current index.html content with this:
code
Html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TFDA Agentic AI Review System</title>
    <!-- Tailwind CDN is fine for quick deployment, though npm install is better for prod -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans TC', sans-serif; overflow-x: hidden; }
        /* Keep your existing custom scrollbar CSS here */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .glass-panel { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.18); }
        .dark .glass-panel { background: rgba(17, 24, 39, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); }
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .animate-pulse-soft { animation: pulse-soft 3s infinite; }
    </style>
    <!-- PDF.js Global Configuration -->
    <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
    <script>
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }
    </script>
</head>
<body>
    <div id="root"></div>
    <!-- THIS IS THE CRITICAL CHANGE: Point to your index.tsx -->
    <script type="module" src="/src/index.tsx"></script>
</body>
</html>
Phase 3: Deployment (Vercel)
This is generally the easiest method for React apps.
Push to GitHub:
Initialize a git repo in your folder: git init.
Add files: git add ..
Commit: git commit -m "Initial commit".
Create a new repository on GitHub and push your code there.
Login to Vercel: Go to vercel.com and log in with GitHub.
Add New Project: Click "Add New..." -> "Project".
Import Repository: Select the repository you just pushed.
Configure Build:
Framework Preset: Vercel usually detects "Vite" automatically. If not, select Vite.
Root Directory: ./ (default).
Build Command: npm run build (default).
Output Directory: dist (default).
Deploy: Click Deploy. Vercel will build your app and give you a URL (e.g., tfda-ai-review.vercel.app).
Phase 4: Deployment (Netlify)
Push to GitHub: (Same as above).
Login to Netlify: Go to netlify.com.
New Site: Click "Add new site" -> "Import from existing project".
Connect Git: Choose GitHub and select your repository.
Build Settings:
Base directory: (Leave empty).
Build command: npm run build.
Publish directory: dist.
Deploy: Click Deploy Site.
20 Comprehensive Follow-Up Questions
Security: Since the API key is currently stored in localStorage, how can we migrate this to a server-side proxy to prevent users from needing to input their own keys?
Persistence: The app currently relies on browser state. How would you integrate a database (like Supabase or Firebase) to save review history permanently?
PDF Handling: The current PDF rendering converts pages to images. How would you optimize this for 100+ page documents to avoid browser memory crashes?
Model Fine-tuning: Can we use the "Preview & Edit" data to fine-tune a custom Gemini model specifically for TFDA regulations?
OCR Accuracy: How does the gemini-2.5-flash vision OCR compare to dedicated OCR services like Google Cloud Vision API for Traditional Chinese handwritten text?
Collaboration: How would you implement real-time collaboration so two reviewers can edit the "Quick Notes" simultaneously?
Export Formats: Besides PDF and Markdown, can we implement an export to a formal Microsoft Word (.docx) template that follows official TFDA submission formats?
Rate Limiting: If we deploy this for a team, how do we handle Google Gemini API rate limits (RPM/TPM)?
Cost Management: How can we add a usage tracker to calculate the estimated cost per document review based on token usage?
Mobile Responsiveness: The current UI is dense. What specific CSS changes are needed to make the "Execute Pipeline" view usable on an iPad?
Agent Chaining: Currently, agents run sequentially. How can we modify the pipeline to allow Agent 2 to use the output of Agent 1 as its input context automatically?
Validation: How can we add a "Validation" step where a human must approve Agent 1's extraction before Agent 2 runs?
Theme Customization: The flower themes are hardcoded. Can we allow users to upload a custom background image?
Offline Support: Can we turn this into a PWA (Progressive Web App) so users can view previously analyzed reports while offline?
Multi-Language: The code has some zh_TW / en toggles. How do we implement a full i18n library (like react-i18next) to translate the entire UI?
File Support: How difficult would it be to add support for uploading .docx or image files (.jpg, .png) directly alongside PDFs?
Testing: What is the best strategy to write unit tests for the runGeminiAgent function, considering it calls an external API?
Error Handling: If the API fails mid-pipeline (e.g., network error on Agent 3 of 5), how do we implement a "Retry from failed step" mechanism?
Accessibility: Is the current color contrast in "Dark Mode" compliant with WCAG 2.1 AA standards for government use?
Deployment CI/CD: How can we set up a GitHub Action to automatically run linting and type-checking before allowing a deploy to Vercel?
