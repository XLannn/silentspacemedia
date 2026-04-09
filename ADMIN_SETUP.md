# Admin Setup

## 1) Local environment

Create a `.env.local` file in the project root using `.env.example` as reference:

```env
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=your_long_random_secret
BLOB_READ_WRITE_TOKEN=your_vercel_blob_read_write_token
```

`.env.local` is already ignored by Git in `.gitignore`.

## 2) Upload current portfolio to Vercel Blob (one-time bootstrap)

Run:

```bash
npm run bootstrap:portfolio
```

This uploads all files from `public/assets` and writes portfolio metadata to:

- `portfolio/images/*`
- `portfolio/portfolio-data.json`

## 3) Run app and use admin page

- Start local app with API support:
  ```bash
  npx vercel dev
  ```
- Open `http://localhost:3000/admin`
- Login with `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Manage category titles, order, and image uploads
- Click `Save Portfolio` to publish changes

## 4) Vercel project environment variables

Add the same four variables in Vercel Project Settings -> Environment Variables:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `BLOB_READ_WRITE_TOKEN`
