This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

The Next.js app expects these environment variables:

```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

`NEXT_PUBLIC_CONVEX_URL` should point at your Convex deployment URL ending in `.convex.cloud`.

`NEXT_PUBLIC_CONVEX_SITE_URL` should point at your Convex site URL ending in `.convex.site`.

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

This repo includes [vercel.json](./vercel.json), which tells Vercel to build with Convex using `npx convex deploy --cmd "npm run build"`.

Before deploying to production, add these Vercel environment variables:

- `CONVEX_DEPLOY_KEY` for your Convex production deployment
- `NEXT_PUBLIC_CONVEX_SITE_URL` for your production `.convex.site` URL

That build step injects `NEXT_PUBLIC_CONVEX_URL` during the production build, so you do not need to hardcode the `.convex.cloud` URL in Vercel.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
