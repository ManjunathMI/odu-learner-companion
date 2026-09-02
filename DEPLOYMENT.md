# Deployment Guide

## Vercel Deployment

This application is configured for seamless deployment to Vercel.

### Prerequisites

1. A Vercel account (free tier available at https://vercel.com)
2. A Supabase project with the database schema initialized
3. GitHub repository with this code

### Environment Variables

Configure these in your Vercel project settings:

**Required (Public)**
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anonymous public key

**Required (Secret)**
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (server-side only)

### Deployment Steps

#### Option 1: Via Vercel Dashboard (Recommended)

1. Visit https://vercel.com/new
2. Import this GitHub repository
3. Select `Next.js` framework (auto-detected)
4. Add environment variables from the list above
5. Click **Deploy**

#### Option 2: Via Vercel CLI

```bash
npm i -g vercel
vercel env pull          # Pull environment variables from Vercel
npm run build            # Test build locally
vercel --prod            # Deploy to production
```

### Post-Deployment

1. Configure your Supabase project's **Authentication Redirect URLs** in the Supabase dashboard:
   - Add your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - Add redirect paths: `/auth`, `/paths`

2. Test the sign-in flow at `https://your-app.vercel.app/auth`

3. Monitor logs in Vercel dashboard: **Deployments** → **Functions**

### Troubleshooting

**401 Unauthorized on API calls**
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correctly set
- Check Supabase RLS policies allow the operation

**Supabase connection errors**
- Confirm `NEXT_PUBLIC_SUPABASE_URL` is correct
- Ensure Supabase project is active (not paused)

**API rate limits**
- Vercel free tier has function call limits
- Consider upgrading if experiencing frequent 429 errors

### CI/CD

GitHub Actions automatically runs:
- **Lint**: `npm run lint` — Code quality checks
- **Build**: `npm run build` — Production build verification

Pull requests must pass these checks before merging to `main`.
Pushes to `main` trigger automatic deployment to Vercel.

### Rollback

1. Go to Vercel dashboard → **Deployments**
2. Find the previous successful deployment
3. Click **Promote to Production**

### Database Backups

Regularly backup your Supabase database:

```bash
# Using Supabase CLI (requires authentication)
supabase db pull --db-url $SUPABASE_DB_URL > backup-$(date +%Y%m%d).sql
```

Or use Supabase dashboard: **Settings** → **Backups** → **Create a backup**

### Performance

Monitor performance at https://vercel.com/your-project/analytics

Key metrics:
- **First Contentful Paint (FCP)**
- **Largest Contentful Paint (LCP)**
- **Cumulative Layout Shift (CLS)**

Optimize by:
1. Reducing API response times
2. Enabling image optimization (Next.js automatic)
3. Using Supabase query caching
