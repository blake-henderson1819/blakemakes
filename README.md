# blakemakes.xyz

Static portfolio for Blake Henderson, built with [Eleventy 3](https://www.11ty.dev/). It ships plain HTML and CSS with **no client-side JavaScript**.

## Run it locally
```bash
npm install
npm run dev      # http://localhost:8080 (live reload)
npm run build    # writes the static site to _site/
```

## Add a project
1. Pick a slug: lowercase with dashes, e.g. `line-follower`.
2. Copy `src/projects/example-project-one.md` to `src/projects/line-follower.md`.
3. Put the images in `public/images/projects/line-follower/` (jpg, png, webp, svg, mp4).
4. Fill in the frontmatter:
   ```yaml
   title: "Line-following robot"
   date: 2026-10-01              # sets the order (newest first) and the BH-00x number
   summary: "One line shown on the homepage card."
   cover: /images/projects/line-follower/cover.jpg
   video: /images/projects/line-follower/demo.mp4   # or a YouTube embed URL (https://www.youtube.com/embed/ID), or ""
   featured: true                # the newest featured project WITH a video fills the homepage video slot
   tags: [robotics, arduino]
   ```
5. Write the body under these headings: `## Demo`, `## What I designed`, `## Design decisions`, `## Failed iterations`, `## Results`. Add images with `![alt text](/images/projects/line-follower/photo.jpg)`.
6. The page is published at `/projects/line-follower/`.

Delete `example-project-*.md` and their image folders once you have real projects.
Site-wide text (intro, about, email, GitHub, LinkedIn, fallback featured video) lives in `src/_data/site.json`.
Compress photos before adding them. About 2000px wide is plenty, and an 80% quality JPG/WebP works well.
`npm run placeholders` regenerates the gray placeholder SVGs.

## Deploy
Build command: `npm run build`. Output directory: `_site`. Use Node 18 or newer.

- **Netlify:** push the repo to GitHub, then Add new site → Import from Git. Use the build settings above.
- **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git. Framework preset: Eleventy (or set the build settings above).
- **GitHub Pages:** Settings → Pages → Source: GitHub Actions. Add `.github/workflows/deploy.yml`:
  ```yaml
  name: deploy
  on: { push: { branches: [main] } }
  permissions: { contents: read, pages: write, id-token: write }
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: npm ci && npm run build
        - uses: actions/upload-pages-artifact@v3
          with: { path: _site }
    deploy:
      needs: build
      runs-on: ubuntu-latest
      environment: github-pages
      steps:
        - uses: actions/deploy-pages@v4
  ```
  Also add an empty `public/CNAME` file containing `blakemakes.xyz`. Then set the custom domain under Settings → Pages.

## Point the Namecheap domain at it
In Namecheap, go to Domain List → blakemakes.xyz → Manage → **Advanced DNS**. Delete the default parking records, then:

| Host | Netlify | GitHub Pages |
|------|---------|--------------|
| `@`  | A → `75.2.60.5` | A → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `www`| CNAME → `<yoursite>.netlify.app` | CNAME → `<username>.github.io` |

- **Netlify:** add the domain under Domain management first. The simplest option is to switch Namecheap to Netlify DNS: Domain → Nameservers → Custom DNS → the nameservers Netlify gives you.
- **Cloudflare Pages:** add the site to Cloudflare. Then in Namecheap, Nameservers → Custom DNS → Cloudflare's two nameservers. In Pages → Custom domains, add `blakemakes.xyz` and `www`, and Cloudflare creates the records itself.
- Check the provider's docs for current IPs. DNS changes can take up to a few hours. Turn on HTTPS / "Enforce HTTPS" once the certificate is issued.
