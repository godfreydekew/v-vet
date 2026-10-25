# V-Vet Frontend

## Design system

This frontend's design is documented in two files. Read them before building any page.

- [DESIGN.md](DESIGN.md) covers the visual system: colors, typography, spacing and components.
- [PRODUCT.md](PRODUCT.md) is the product brief: who V-Vet is for and what it needs to communicate.

New pages are built with [Impeccable](https://github.com/pbakaus/impeccable), a Claude Code skill that reads both files so new work matches the existing pages.

## Setup

### 1. Install Impeccable

Impeccable needs about 6 GB of free disk space. During the install, watch the terminal because it asks you to accept terms.

```bash
npx impeccable install
```

### 2. Install the companion skills (optional)

These add extra design, animation and browser-testing guidance. Impeccable works without them.

```bash
npx skills add Leonxlnx/taste-skill --skill redesign-skill
npx skills add emilkowalski/skill
npx skills add lackeyjb/playwright-skill --skill playwright-skill --yes
```

More about each one:
- Impeccable: https://github.com/pbakaus/impeccable
- Taste skill: https://www.tasteskill.dev/
- Emil Kowalski's skills: https://github.com/emilkowalski/skill
- Playwright skill: https://github.com/lackeyjb/playwright-skill

### 3. Install the Claude in Chrome extension

Install the [Claude in Chrome](https://claude.com/chrome) extension. Impeccable uses it to screenshot pages at mobile and desktop sizes and fix any problems it finds. Without the extension, Impeccable can still build pages, but it can't check how they look.

## Building a new page

1. Pull the latest `DESIGN.md` and `PRODUCT.md`.
2. Start Claude Code from inside the `frontend/` folder, so Impeccable can find both files:

   ```bash
   cd frontend
   claude
   ```

3. Ask for the page. For example, to build the About page:

   ```
   /impeccable build an About page at /about
   ```

### What happens next

1. **It loads context.** It reads `PRODUCT.md`, `DESIGN.md` and the existing pages and components.
2. **It asks 2–3 questions** about the page, such as who it's for, what visitors should come away believing, and what real content and photos exist. Real answers like team bios and actual open roles give much better pages than placeholders.
3. **It may offer layout options.** For a whole new page, it can sketch several different structures for you to choose from. The colors, fonts and components stay the same across all of them.
4. **It builds the page and checks it.** It screenshots the page at mobile and desktop sizes and fixes what it finds.

### Other commands

| Command | When to use it |
|---|---|
| `/impeccable shape careers page` | Plan the structure and UX first, without writing code. Good when the content isn't settled yet. |
| `/impeccable build a Careers page at /careers` | Go straight to building the page. |
| `/impeccable add a team section to the About page` | Add to an existing page. It reuses that page's layout and skips the options round. |
| `/impeccable polish src/pages/AboutPage.tsx` | Do a final cleanup pass after building. |
| `/impeccable critique src/pages/CareersPage.tsx` | Get a review without making changes. |

## Tips

- **Have the real content ready.** That means About copy, team photos and job listings. Impeccable avoids filler text and will ask for real content anyway.
- **Name the route or file**, for example "at /about" or "in src/pages/", so the page is added to the router the same way as the others.
- **Don't change `DESIGN.md` casually.** Building a new page shouldn't change it, and Impeccable asks before changing the design system. Since everyone shares this file, the team decides on any proposed change together.
- **Expect local files in `.impeccable/`.** Impeccable keeps screenshots and sketches there. Git ignores them, so they won't show up in your commits.
