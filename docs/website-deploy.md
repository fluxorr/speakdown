# Website Deploy

The marketing website lives in `apps/website/` and deploys to Vercel.

## Configuration

- Vercel project: `website`
- Framework: Vite (auto-detected)
- Build command: `pnpm run build`
- Output directory: `dist`
- Production URL: the Vercel project URL (check Vercel dashboard)

## Deploy

Deploys are triggered by git push. Vercel automatically builds and deploys on push to the production branch.

For manual deploys from the website directory:

```sh
vercel deploy . -y --no-wait --scope <team-slug>
```

To set up git-based deploys, link the repo in the Vercel dashboard or run:

```sh
vercel link --repo --scope <team-slug>
```

## Local Build

To build locally and preview:

```sh
vp install
vp run website#build
```

## Notes

- The project uses pnpm with `catalog:` protocol for dependency management; Vercel must use pnpm (configured in `vercel.json`)
- Run `vp check` before deploying source changes when practical
