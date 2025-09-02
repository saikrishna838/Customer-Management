# 🚀 Deploying Customer Management App to Vercel

This guide will help you deploy your Customer Management System to Vercel with serverless functions.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, Bitbucket)
3. **Vercel CLI** (optional): Install with `npm i -g vercel`

## ⚠️ Important Database Considerations

**SQLite Limitation**: Vercel's serverless functions don't support persistent file storage, so SQLite won't work for production. You have several options:

### Option 1: Vercel Postgres (Recommended)
```bash
# Install Vercel Postgres
npm install @vercel/postgres
```

### Option 2: External Database Services
- **Supabase** (PostgreSQL)
- **PlanetScale** (MySQL)
- **MongoDB Atlas**
- **FaunaDB**

### Option 3: Demo Mode (In-Memory)
For testing purposes, the app will run with in-memory storage (data resets on each function call).

## 🚀 Deployment Methods

### Method 1: Vercel Dashboard (Easiest)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select root directory as the project root

3. **Configure Environment Variables** (in Vercel Dashboard):
   ```
   NODE_ENV=production
   DATABASE_TYPE=memory
   # For external database, add:
   # POSTGRES_URL=postgresql://username:password@hostname:port/database
   # Or for other databases:
   # DATABASE_HOST=your-db-host
   # DATABASE_USERNAME=your-username
   # DATABASE_PASSWORD=your-password
   # DATABASE=your-database-name
   ```

4. **Deploy**: Click "Deploy" and wait for the build to complete

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   # From the root directory
   vercel

   # For production deployment
   vercel --prod
   ```

4. **Set environment variables**:
   ```bash
   vercel env add NODE_ENV
   vercel env add DATABASE_TYPE
   ```

## 🗄️ Database Setup Options

### Option A: Vercel Postgres (Recommended)

1. **Install dependency**:
   ```bash
   npm install @vercel/postgres
   ```

2. **Add to Vercel project**:
   - Go to your project dashboard
   - Click "Storage" tab
   - Add "Postgres" database

3. **Update environment variables**:
   ```env
   DATABASE_TYPE=postgres
   POSTGRES_URL=postgresql://...
   ```

4. **Update API functions** to use `db-cloud.js` instead of `db.js`

### Option B: Supabase (Free Tier Available)

1. **Create Supabase project**: [supabase.com](https://supabase.com)

2. **Get connection string** from Supabase dashboard

3. **Set environment variables**:
   ```env
   DATABASE_TYPE=postgres
   POSTGRES_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```

4. **Create tables in Supabase**:
   ```sql
   -- Run this in Supabase SQL editor
   CREATE TABLE customers (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     phone TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE addresses (
     id SERIAL PRIMARY KEY,
     customer_id INTEGER NOT NULL,
     street TEXT NOT NULL,
     city TEXT NOT NULL,
     state TEXT NOT NULL,
     zip_code TEXT NOT NULL,
     country TEXT NOT NULL DEFAULT 'USA',
     address_type TEXT DEFAULT 'home',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
   );
   ```

### Option C: Demo Mode (In-Memory)

For quick testing without external database:
```env
DATABASE_TYPE=memory
```

**Note**: Data will reset on each serverless function execution.

## 📁 Project Structure for Vercel

Your project structure should look like this:

```
customer-management-app/
├── api/                          # Vercel serverless functions
│   ├── _lib/
│   │   ├── db.js                # SQLite database utility
│   │   └── db-cloud.js          # Cloud database utilities
│   ├── addresses/
│   │   └── [id].js              # PUT/DELETE /api/addresses/:id
│   ├── customers/
│   │   ├── index.js             # GET/POST /api/customers
│   │   ├── [id].js              # GET/PUT/DELETE /api/customers/:id
│   │   └── [id]/
│   │       └── addresses.js     # GET/POST /api/customers/:id/addresses
│   └── health.js                # GET /api/health
├── client/                      # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.production
├── server/                      # Original Express server (for local dev)
├── vercel.json                  # Vercel configuration
└── package.json                 # Root package.json with dependencies
```

## 🌍 Environment Variables for Vercel

Set these in your Vercel project dashboard or using the CLI:

### Required Variables:
```env
NODE_ENV=production
DATABASE_TYPE=memory
```

### For External Database (Postgres):
```env
DATABASE_TYPE=postgres
POSTGRES_URL=postgresql://username:password@hostname:port/database
```

### For External Database (MySQL):
```env
DATABASE_TYPE=mysql
DATABASE_HOST=your-host
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE=your-database-name
```

## 🔧 Vercel Configuration (`vercel.json`)

The `vercel.json` file configures:
- **API Functions**: Serverless functions in `/api` directory
- **Static Files**: React build served from `/client/build`
- **Routing**: API routes and SPA fallback routing
- **Runtime**: Node.js 18.x for serverless functions

## ✅ Testing Your Vercel Deployment

1. **Health Check**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **API Endpoints**:
   ```bash
   # Get customers
   curl https://your-app.vercel.app/api/customers
   
   # Create customer
   curl -X POST https://your-app.vercel.app/api/customers \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","phone":"123-456-7890"}'
   ```

3. **Frontend**:
   - Visit `https://your-app.vercel.app`
   - Test navigation between pages
   - Test CRUD operations

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Via Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository
   - Click "Deploy"

2. **Via CLI**:
   ```bash
   npx vercel
   ```

### Step 3: Configure Database (Choose One)

#### Option A: Quick Demo (In-Memory)
- No additional setup required
- Data resets on function restart

#### Option B: Vercel Postgres
1. Add Postgres to your Vercel project
2. Copy the connection string
3. Add environment variable: `POSTGRES_URL`
4. Set `DATABASE_TYPE=postgres`

#### Option C: External Database
1. Set up your preferred database service
2. Create the required tables
3. Add connection environment variables
4. Set appropriate `DATABASE_TYPE`

### Step 4: Verify Deployment

1. Check the deployment URL provided by Vercel
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Test the frontend: `https://your-app.vercel.app`

## 🔗 Your Vercel URLs

After deployment, your app will be available at:
- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://your-app.vercel.app/api/*`
- **Health Check**: `https://your-app.vercel.app/api/health`

## 📱 Mobile & Performance

Vercel automatically provides:
- **Global CDN**: Fast content delivery worldwide
- **Automatic HTTPS**: SSL certificates
- **Edge Functions**: Low latency API responses
- **Image Optimization**: Optimized image delivery
- **Analytics**: Built-in performance monitoring

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Verify environment variables are set correctly
   - Check database service is accessible from Vercel

2. **CORS Errors**:
   - API functions include CORS headers
   - Check browser developer console for details

3. **404 Errors on Page Refresh**:
   - `vercel.json` includes SPA routing configuration
   - Should work automatically with the provided config

4. **Function Timeout**:
   - Vercel functions have 10s timeout limit
   - Optimize database queries if needed

### Debug Commands:

```bash
# Check Vercel logs
vercel logs your-deployment-url

# Local development with Vercel
vercel dev
```

## 💡 Tips for Success

1. **Use Environment Variables**: Never hardcode secrets
2. **Test Locally**: Use `vercel dev` to test locally
3. **Monitor Performance**: Use Vercel Analytics
4. **Database Choice**: Choose persistent storage for production
5. **Error Handling**: Monitor function logs for issues

## 🎉 Next Steps

After successful deployment:

1. **Custom Domain**: Add your domain in Vercel dashboard
2. **Analytics**: Enable Vercel Analytics
3. **Monitoring**: Set up alerts for function errors
4. **Database**: Migrate to persistent database for production
5. **CI/CD**: Automatic deployments on git push

## 🔒 Security Notes

- All API functions include CORS headers
- Environment variables are secure in Vercel
- HTTPS is automatic
- Consider adding authentication for production use

---

## 🆘 Need Help?

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Use `vercel logs` to debug
3. Test locally with `vercel dev`
4. Check environment variables in Vercel dashboard

**Congratulations!** Your Customer Management App is now ready for Vercel deployment! 🎊
