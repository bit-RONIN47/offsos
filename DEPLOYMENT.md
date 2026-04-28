# Vercel Deployment Setup Guide

## 1. Set up a Free PostgreSQL Database

### Option A: Neon (Recommended for Vercel)
1. Go to https://neon.tech and sign up for free
2. Create a new project
3. Copy the connection string (DATABASE_URL)
4. Format: `postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require`

### Option B: Supabase
1. Go to https://supabase.com and sign up for free
2. Create a new project
3. Go to Settings > Database > Connection string
4. Copy the URI format connection string

## 2. Set Environment Variables

### For Local Development
Create a `.env` file in your project root:
```
DATABASE_URL="your_postgresql_connection_string"
```

### For Vercel Deployment
1. Go to your Vercel project dashboard
2. Go to Settings > Environment Variables
3. Add `DATABASE_URL` with your PostgreSQL connection string
4. Add to Production, Preview, and Development environments

## 3. Generate Prisma Client

Run this command to generate the Prisma client:
```bash
npx prisma generate
```

## 4. Push Schema to Database

Run this to create tables in your PostgreSQL database:
```bash
npx prisma db push
```

## 5. Deploy to Vercel

### First-time setup:
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel will auto-detect Next.js
5. Add the DATABASE_URL environment variable
6. Click Deploy

### Subsequent deployments:
Just push to your main branch - Vercel will auto-deploy.

## Notes

- The `postinstall` script in package.json will automatically generate Prisma client on Vercel
- Make sure to never commit `.env` files (they're in .gitignore)
- Use `.env.example` as a template for required environment variables
