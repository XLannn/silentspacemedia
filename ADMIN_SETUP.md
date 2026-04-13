# Supabase Admin Setup

## 1) Environment variables

Create `.env.local` in the project root from `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_STORAGE_BUCKET=portfolio-images
VITE_SUPABASE_PORTFOLIO_TABLE=portfolio_content
VITE_SUPABASE_ADMIN_USERS_TABLE=admin_users
VITE_SUPABASE_CONTACT_TABLE=contact_inquiries
# Contact form email notification (FormSubmit)
VITE_CONTACT_NOTIFICATION_EMAIL=alanbijialex@gmail.com
# Optional override endpoint (default is https://formsubmit.co/ajax/<CONTACT_NOTIFICATION_EMAIL>)
VITE_CONTACT_FORMSUBMIT_ENDPOINT=
# Optional (only needed for one-time bootstrap script)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

For production, add the same variables in your hosting provider (for example Vercel Project Settings -> Environment Variables).

## 2) Supabase SQL setup

In Supabase SQL Editor, run:

`supabase/schema.sql`

This creates:

- `portfolio_content` (stores full portfolio JSON)
- `admin_users` (optional username -> email mapping)
- `contact_inquiries` (stores contact form submissions)
- RLS policies for read/write

## 3) Supabase Auth admin account

Create an admin user in Supabase Auth (email + password).

Then add a username mapping row in `admin_users`:

```sql
insert into public.admin_users (username, email)
values ('silentspacemedia', 'your-admin-email@example.com')
on conflict (username) do update set email = excluded.email;
```

Then you can login in `/admin` using:

- Username: `silentspacemedia`
- Password: your Supabase Auth password

If you want the initial password to be `silentspacemedia@123`, create the Supabase Auth user with that password.

## 4) Storage bucket

`supabase/schema.sql` already creates a public bucket named `portfolio-images`
and the required upload/read policies.

If you use a different bucket name, update:

- `VITE_SUPABASE_STORAGE_BUCKET`
- the bucket id inside `supabase/schema.sql` policies

## 5) Run and use admin

```bash
npm run dev
```

Open `/admin`, login, edit categories/order/images, then click **Save Portfolio**.

Use the **Inquiries** tab in `/admin` to view all contact form submissions.

## 6) Optional email notifications for new inquiries (no client setup)

By default, submissions are saved in `contact_inquiries` and visible in admin.

This build sends inquiry notifications through FormSubmit to:

- `VITE_CONTACT_NOTIFICATION_EMAIL` (default: `alanbijialex@gmail.com`)

No Make scenario is required for email sending with this flow.

Note: FormSubmit may send a one-time activation email to the receiver mailbox when first used.

## 7) Optional one-time bootstrap from local `public/assets`

If you want to upload all current local assets and create the portfolio document automatically:

```bash
npm run bootstrap:portfolio
```
