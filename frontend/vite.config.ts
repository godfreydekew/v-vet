import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const SITE_URL = "https://vvet.org";

// Link previews for pages people share. WhatsApp, LinkedIn and Facebook don't run JavaScript,
// so after the build each page below gets its own copy of index.html with its own title,
// description and image. Vercel serves these files before the catch-all rewrite in vercel.json,
// and the app then loads as normal.
const PAGE_PREVIEWS = [
  {
    path: "careers/software-engineer/apply",
    title: "Apply to be our Software Engineer | V-Vet",
    description:
      "Build the tech that helps Zimbabwe's farmers keep their animals alive. Contract, remote within Zimbabwe.",
    image: "/og/software-engineer.jpg",
    imageAlt: "V-Vet is hiring a Software Engineer. Contract, remote within Zimbabwe.",
  },
  {
    path: "careers/software-engineer",
    title: "We're hiring a Software Engineer | V-Vet",
    description:
      "Build the tech that helps Zimbabwe's farmers keep their animals alive. Contract, remote within Zimbabwe.",
    image: "/og/software-engineer.jpg",
    imageAlt: "V-Vet is hiring a Software Engineer. Contract, remote within Zimbabwe.",
  },
  {
    path: "careers",
    title: "Careers | V-Vet",
    description: "Join the team building livestock health support on WhatsApp for Zimbabwe's farmers.",
    image: "/og/software-engineer.jpg",
    imageAlt: "V-Vet is hiring a Software Engineer. Contract, remote within Zimbabwe.",
  },
];

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Replaces one tag's value, and fails the build if the tag is missing so previews never go stale silently.
function replaceOnce(html: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(html)) throw new Error(`page-previews: couldn't find ${label} in index.html`);
  return html.replace(pattern, replacement);
}

function setMeta(html: string, attribute: "name" | "property", key: string, value: string): string {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`);
  return replaceOnce(html, pattern, `$1${escapeAttribute(value)}$2`, `${attribute}="${key}"`);
}

function pagePreviews(): Plugin {
  return {
    name: "page-previews",
    apply: "build",
    writeBundle(options) {
      const outDir = options.dir ?? path.resolve(__dirname, "dist");
      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      for (const page of PAGE_PREVIEWS) {
        const url = `${SITE_URL}/${page.path}`;
        const image = `${SITE_URL}${page.image}`;
        let html = replaceOnce(template, /<title>[^<]*<\/title>/, `<title>${escapeAttribute(page.title)}</title>`, "<title>");
        html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, "canonical link");
        html = setMeta(html, "name", "description", page.description);
        html = setMeta(html, "property", "og:title", page.title);
        html = setMeta(html, "property", "og:description", page.description);
        html = setMeta(html, "property", "og:url", url);
        html = setMeta(html, "property", "og:image", image);
        html = setMeta(html, "property", "og:image:alt", page.imageAlt);
        html = setMeta(html, "name", "twitter:title", page.title);
        html = setMeta(html, "name", "twitter:description", page.description);
        html = setMeta(html, "name", "twitter:image", image);
        const pageDir = path.join(outDir, page.path);
        fs.mkdirSync(pageDir, { recursive: true });
        fs.writeFileSync(path.join(pageDir, "index.html"), html);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [nodePolyfills(), react(), mode === "development" && componentTagger(), pagePreviews()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
