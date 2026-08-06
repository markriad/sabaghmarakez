# First-time setup

You have already done all of this. It is kept here in case the site ever has
to be rebuilt from nothing, or handed to someone else.

# Part 1 — Put the site on GitHub

**1.1** Create a free account at [github.com](https://github.com).

**1.2** Go to [github.com/new](https://github.com/new).
- **Repository name:** `marakez-site`
- Set it **Public**
- Do **not** tick "Add a README"
- Click **Create repository**

**1.3** On the next screen click **uploading an existing file**.

**1.4** Drag in everything from this folder — the four `.html` files plus the
`admin`, `assets` and `content` folders. Wait for every upload to finish, then
click **Commit changes**.

> Write down `YOUR-USERNAME/marakez-site`. You need it twice below.

---

# Part 2 — Publish with Cloudflare

> Cloudflare has merged Pages into Workers. "Connect to Git" now creates a
> **Worker**, and by default it tries to run a build script. This project is
> plain HTML, so the repo includes a `wrangler.toml` telling Cloudflare to serve
> the folder as static files instead. Make sure that file is in your upload.

**2.1** Create a free account at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).

**2.2** Sidebar → **Compute** → **Workers & Pages** → **Create** → **Import a repository**.

**2.3** Authorise GitHub access, pick your site repository, continue.

**2.4** Build settings:

| Setting | Value |
|---|---|
| Build command | *leave completely empty* |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

The `wrangler.toml` in the repo does the rest — it declares the folder as static
assets, so nothing gets compiled.

**2.5** **Save and Deploy**. A minute later the site is live at
`your-project.workers.dev`. Open it and check the pages load.

> **If you see a build error** mentioning a missing entry point or script, the
> `wrangler.toml` is not in the repository root. Upload it and redeploy.

From now on, every commit redeploys automatically — including everything you
does in the admin panel.

# Part 3 — Connect your GoDaddy domain

You bought a domain at GoDaddy. There are two ways to point it at the site. The
second is better, and it's the one Cloudflare will nudge you toward.

## Option A — Keep the domain at GoDaddy (quickest)

Good if you want to change as little as possible.

**3.1** In Cloudflare, open your Worker → **Domains** (top tabs) →
**Add** → **Custom domain**. Enter your domain and continue.

**3.2** In GoDaddy: sign in → **My Products** → find the domain → **DNS** →
**Manage DNS**.

**3.3** Delete any existing `A` record for `@` and any `CNAME` for `www` that
GoDaddy created by default (they usually point at a parking page).

**3.4** Add these two records:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `your-project.workers.dev` | 1 hour |
| A | `@` | *(the IP Cloudflare shows you)* | 1 hour |

**GoDaddy will not accept a CNAME at `@`.** The root of a domain cannot be a
CNAME — that is a DNS rule, not a GoDaddy limitation. Use the A record with the
IP address Cloudflare gives you on the custom domain screen.

**3.5** Back in Cloudflare, wait for the domain to show **Active**. Usually a few
minutes; can take up to an hour.

## Option B — Move the domain's DNS to Cloudflare (recommended)

Slightly more setup, meaningfully better: faster DNS, free SSL managed for you,
and the root domain works without workarounds.

**3.1** In Cloudflare, click **Add a domain** (top of the dashboard), enter your
domain, choose the **Free** plan.

**3.2** Cloudflare scans your existing records and shows you two nameservers,
something like:

```
ana.ns.cloudflare.com
rick.ns.cloudflare.com
```

Copy both.

**3.3** In GoDaddy: **My Products** → your domain → **DNS** → scroll to
**Nameservers** → **Change** → **I'll use my own nameservers**.

**3.4** Delete GoDaddy's nameservers and paste Cloudflare's two. Save.

**3.5** GoDaddy will warn you this changes where your domain is managed. That's
expected — confirm.

**3.6** Back in Cloudflare, click **Done, check nameservers**. It usually takes
5–30 minutes, occasionally up to 24 hours. You'll get an email when it's active.

**3.7** Once active, open your Worker → **Domains** → **Add** →
**Custom domain** → enter your domain. Because DNS is now inside Cloudflare, it
creates the records for you. This is the easiest route and avoids the root-CNAME
problem entirely.

## Which to pick

Use **Option B** unless you have a reason not to. It removes the root-domain
awkwardness entirely and SSL is handled automatically.

> **If you use email on this domain** (e.g. `info@yourdomain.com`), be careful.
> Option B moves *all* DNS to Cloudflare, so your MX records must move too.
> Before switching nameservers, screenshot every record in GoDaddy's DNS page and
> re-create the MX ones in Cloudflare. Missing this will stop your email.

## Checking it worked

Give it a few minutes, then visit your domain. You should see the site with a
padlock in the address bar. If the padlock is missing, wait — Cloudflare issues
the certificate automatically and it can take a few minutes after the domain
goes active.

---

# Part 4 — Turn on the admin panel

> **You will end up with two Workers.** One serves the website (Part 2), the
> other handles the admin login (this part). Give them clearly different names —
> for example `marakez-site` and `marakez-auth`. If you reuse a name, the second
> deployment overwrites the first and something stops working.

You need a "Login with GitHub" button. That needs a small free helper
service. Ten minutes, once.

**4.1** Open [github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)
and click **Deploy to Cloudflare Workers** in the README. Sign in with the same
Cloudflare account and let it deploy.

**4.2** In Cloudflare → **Workers & Pages** → click the `sveltia-cms-auth` worker
and copy its address:

```
https://sveltia-cms-auth.YOUR-SUBDOMAIN.workers.dev
```

**4.3** Register the login app: [github.com/settings/developers](https://github.com/settings/developers)
→ **OAuth Apps** → **New OAuth App**

- **Application name:** `Marakez site admin`
- **Homepage URL:** your site address
- **Authorization callback URL:** the worker address from 4.2 **followed by `/callback`**

Click **Register application**, then **Generate a new client secret**. Keep the
page open.

> The `/callback` on the end is the step people get wrong. Without it the login
> fails with a redirect error.

**4.4** In Cloudflare → `sveltia-cms-auth` worker → **Settings** →
**Variables and Secrets**. Add three, each as an encrypted **Secret**:

| Name | Value |
|---|---|
| `GITHUB_CLIENT_ID` | Client ID from 4.3 |
| `GITHUB_CLIENT_SECRET` | Client secret from 4.3 |
| `ALLOWED_DOMAINS` | your domain, e.g. `example.com` |

Click **Deploy**.

**4.5** In your GitHub repository, open `admin/config.yml`, click the pencil, and
edit the first few lines:

```yaml
backend:
  name: github
  repo: YOUR-USERNAME/marakez-site
  branch: main
  base_url: https://sveltia-cms-auth.YOUR-SUBDOMAIN.workers.dev
```

Commit. The site redeploys within a minute.

**4.6** Go to `your-domain.com/admin` and click **Sign in with GitHub**.

**Giving someone else access:** GitHub repository → **Settings** → **Collaborators** →
**Add people** → invite his GitHub account with **Write** permission. He accepts
the emailed invitation, then signs in at `/admin` with his own account.

---

---

# Recovering the admin login

If you connected the auth Worker to your site repository by mistake, it has been
replaced by the website and the admin panel will no longer log in. Nothing is
lost — the Worker just needs deploying again under its own name.

**1.** Cloudflare → **Workers & Pages** → **Create** → **Import a repository**

**2.** This time use the Sveltia auth repository, not your site repo. Easiest
route: open [github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth),
click **Fork** to copy it into your own account, then import that fork.

**3.** Name it something clearly different from your site Worker — for example
`marakez-auth`.

**4.** Once deployed, copy its address:
`https://marakez-auth.YOUR-SUBDOMAIN.workers.dev`

**5.** Add the three secrets from Part 4.4 to *this* Worker:
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`

**6.** Update the GitHub OAuth app's **Authorization callback URL** to the new
address followed by `/callback`.

**7.** In your site repo, edit `admin/config.yml` so `base_url` points at the new
auth Worker address.

Commit, wait a minute, then try `/admin` again.

## Telling the two apart

| Worker | Serves | Where its address goes |
|---|---|---|
| Site worker | The four pages | Your domain |
| Auth worker | `/admin` login | `base_url` in `admin/config.yml` |

Your domain always points at the **site** Worker. The **auth** Worker address
only ever appears inside `admin/config.yml`.
