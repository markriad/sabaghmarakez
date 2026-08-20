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
- **Homepage URL:** your site address. GitHub only shows this to people on the
  authorisation screen, so the worker address works too if you'd rather —
  nothing breaks either way
- **Redirect URI:** the worker address from 4.2 **followed by `/callback`**

Leave **Allow wildcard matching** and **Enable Device Flow** unticked. Leave
**Expire user access tokens** ticked — that's GitHub's default and it's the
safer setting; it just means you sign in to the panel again occasionally.

Click **Register application**, then **Generate a new client secret**. Keep the
page open.

> **"Redirect URI" and "Authorization callback URL" are the same field.**
> GitHub renamed it in August 2026, and the "Add redirect URI" button is new.
> Older guides — including earlier versions of this one — call it the
> authorization callback URL. One entry is all you need.

> The `/callback` on the end is the step people get wrong. It's part of the
> URL, not the name of the field. Without it the login fails with a
> `redirect_uri_mismatch` error.

**4.4** In Cloudflare → `sveltia-cms-auth` worker → **Settings** →
**Variables and Secrets**. Add three:

| Name | What to paste |
|---|---|
| `GITHUB_CLIENT_ID` | The Client ID shown on the GitHub app page from 4.3 — about 20 characters, e.g. `Ov23liAbCd1234EfGh56` |
| `GITHUB_CLIENT_SECRET` | The Client secret from that same page — about 40 characters of letters and numbers |

> **Paste the real values, not these descriptions.** If the worker ends up with
> the literal text `Client ID from 4.3`, it passes that to GitHub and you get a
> GitHub **404 page** in the sign-in popup. The giveaway is the popup's address
> bar: it will read `client_id=Client+ID+from+4.3` instead of a real ID.
>
> If you can no longer see the client secret, GitHub only displays it once —
> click **Generate a new client secret** and use the fresh one.
| `ALLOWED_DOMAINS` | your site's domain — see below. Add this one as a
plain **Text** variable, not a Secret: it isn't a credential, and keeping it
readable lets you check it later. |

For `ALLOWED_DOMAINS`, use your **site's** domain, not the worker address:

```
dev-marakez.com, *.dev-marakez.com
```

Both entries are needed. A bare `dev-marakez.com` matches only the naked
domain, and `*.dev-marakez.com` matches subdomains but *not* the naked domain —
so listing both means the panel works whether you reach it with or without
`www`. If you also use the free `.pages.dev` address, add that too, separated
by a comma.

This is what stops anyone else pointing their own CMS at your worker and
signing people into your repository. It's technically optional, but leaving it
empty means the worker will authenticate requests from any site that finds it.

**Then make the new version active — this is the step that catches everyone.**

Saving a secret creates a *new version* of the worker, but it does not start
serving it. The worker carries on running the version that was active before,
which has no secrets in it. Nothing in the Settings screen tells you this: the
secrets are listed, they look saved, and they are — just not in the version
that's running.

Go to the **Deployments** tab and compare:

- **Active deployment** at the top shows the version actually serving traffic
- **Version History** below shows a row like *"Add secret: GITHUB_CLIENT_ID…"*

If the "Add secret" row is **newer** than the active deployment, the secrets
aren't live. On that row, open the **`···`** menu and deploy it. The Active
deployment box should then show that version ID.

(If the menu offers no deploy option, use **Edit code** → change nothing →
**Deploy**. That publishes a new version on top of the current secrets and
makes it active in one step.)

> **"OAuth app client ID or secret is not configured"**
>
> The panel reached the worker and the worker replied, so `base_url`, the
> domain check and the deployment are all working. The worker just can't read
> `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET`. Check, in this order:
>
> 1. **Did you click Deploy** after adding the variables? Saving is not enough.
>    Under **Deployments**, the newest version should be dated *after* the time
>    you added them.
> 2. **Are they on the right worker?** They must be on the worker whose address
>    is in `base_url` in `admin/config.yml`. If you deployed the worker twice
>    while setting up, it's easy to configure one and point at the other.
> 3. **Check the names character by character** — `GITHUB_CLIENT_ID` and
>    `GITHUB_CLIENT_SECRET`, capitals and underscores exactly. A trailing space
>    after a name is invisible in the dashboard and breaks the match.
> 4. **Check the value has no stray space** at either end. Pasting from GitHub
>    often picks one up.
> 5. **Are they in the Production environment?** If the worker shows Preview
>    and Production, the variables must be on Production.
>
> To test the worker on its own, open this in a browser tab:
>
> ```
> https://sveltia-cms-auth.YOUR-SUBDOMAIN.workers.dev/auth?provider=github&site_id=dev-marakez.com
> ```
>
> **Configured correctly, it sends you to GitHub's authorise screen.**
>
> **A blank white page means the test failed.** The worker doesn't display its
> errors — it returns a page whose only job is to pass the message back to the
> popup's parent window. Opened directly in a tab there is no parent, so
> nothing renders. To read it, view the page source (`Ctrl+U`, or
> `Cmd+Option+U` on a Mac); the error text is in the HTML even though the page
> looks empty.
>
> A blank white page is not a network problem. A network failure gives you the
> browser's own "This site can't be reached" page. A white page with your URL
> still in the address bar and no spinner means the server replied.

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

**6.** Update the GitHub OAuth app's **Redirect URI** (older GitHub screens
call this the Authorization callback URL) to the new address followed by
`/callback`.

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
