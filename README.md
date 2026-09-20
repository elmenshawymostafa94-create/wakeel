# Wakeel site

Static site. No dependencies. Working brand name.

- `index.html` is the landing page (EN + AR).
- `posts/<slug>.md` are articles with frontmatter (`title`, `description`, `date`, `slug`, `lang`, `draft`).
- `node build.mjs` renders `blog/<slug>/index.html`, `blog/index.html`, `sitemap.xml`, `robots.txt`.
- Deploy: GitHub Pages from the `main` branch, root folder. Base URL is in `site.json`.

Publish route for the SEO employee: add a post file, run the build, commit, push `main`.
