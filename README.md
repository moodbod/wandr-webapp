This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

This app uses Convex Auth, so production config is split across the Next.js app
and the Convex deployment.

Next.js environment:

```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

- `NEXT_PUBLIC_CONVEX_URL` should point at your Convex deployment URL ending in `.convex.cloud`.
- `NEXT_PUBLIC_CONVEX_SITE_URL` should point at your Convex site URL ending in `.convex.site`.
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` should point at your public Mapbox token.

Convex deployment environment:

```bash
SITE_URL=
JWT_PRIVATE_KEY=
JWKS=
```

- `SITE_URL` should point at your public app origin, for example `http://localhost:3000` in local development or your production domain in live deploys.
- `JWT_PRIVATE_KEY` and `JWKS` are required by Convex Auth to sign and verify auth tokens.
- The easiest way to set the Convex auth variables is to run `npx @convex-dev/auth`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

If Vercel is only building Next.js and you deploy Convex separately, keep the Vercel build command as the default `next build` and set these Vercel environment variables manually:

- `NEXT_PUBLIC_CONVEX_URL` for your production `.convex.cloud` URL
- `NEXT_PUBLIC_CONVEX_SITE_URL` for your production `.convex.site` URL
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for your public Mapbox token

Then configure the Convex production deployment itself:

```bash
npx @convex-dev/auth --prod --web-server-url https://your-domain.com
```

That command writes the Convex Auth backend variables for the production deployment, including `SITE_URL`, `JWT_PRIVATE_KEY`, and `JWKS`.

If `/api/auth` returns `Missing environment variable \`JWT_PRIVATE_KEY\``, your Next.js app is pointing at a Convex deployment that has not had the auth setup run yet.

If you want Vercel itself to run `npx convex deploy`, then you would switch to a Convex-aware build command and provide a deploy key. This repo does not require that flow.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
