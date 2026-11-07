# Social, Instagram and Google setup guide

Step-by-step setup for the Instagram feed, the Google Business page and Google reviews, plus the other optional items still open.
Nothing here is needed for the site to build: each feature hides itself until it is set up.

| Feature | Status in the code | What you need to do |
|---|---|---|
| Footer links (Instagram, Google Reviews) | Done | Nothing. Edit under CMS -> Site settings -> Social links |
| Google reviews on the homepage | Done | Copy each review into the CMS by hand (section 2) |
| Instagram swipeable gallery | Done, hidden until a token is set | Sections 1 and 3 |
| Daily refresh of the Instagram gallery | Done | Section 3 |
| "Leave us a Google review" button | Not built | Section 2, step 4 |
| Business email / form endpoint, analytics, domain | Not set | Section 4 |

---

## 1. Instagram feed: getting `INSTAGRAM_ACCESS_TOKEN`

The token lets the website read the latest posts of `jnb.sounds.events` when it is built. It is a secret: never commit it,
paste it into chat or put it in a file that is tracked by Git.

Meta changes the wording of its dashboards from time to time, so menu names below may differ slightly.

### 1.1 Make the Instagram account Professional (free)
1. Instagram app -> profile -> menu -> **Settings and activity** -> **Account type and tools**.
2. **Switch to professional account** -> choose **Business** (or **Creator**) -> pick a category -> finish.

### 1.2 Create a Meta developer app
1. Go to <https://developers.facebook.com> and log in with a Facebook account (create one if needed; it does not need to be public).
2. Complete the developer registration if asked.
3. **My Apps** -> **Create App** -> choose the **Business** type (or "Other" -> "Business") -> name it e.g. `JNB Events website`.
4. In the app dashboard, **Add product** -> **Instagram** -> open **API setup with Instagram login**.

### 1.3 Generate the token
1. In **API setup with Instagram login**, under **Generate access tokens**, click **Add account**.
2. Log in as `jnb.sounds.events` and accept the permissions. The permission the site needs is `instagram_business_basic` (read-only).
3. If it says the account must be a tester: **App roles** -> **Roles** -> **Add people** -> **Instagram Testers**, add `jnb.sounds.events`,
   then accept the invite in the Instagram app (Settings -> Website permissions -> Apps and websites -> Tester invites).
4. Click **Generate token** and copy the long string. This is `INSTAGRAM_ACCESS_TOKEN`.
   If the page only gives a short-lived token, exchange it for a long-lived one (valid 60 days) by running this in a terminal,
   with your own values (the app secret is in **App settings -> Basic**):

   ```bash
   curl -s "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=SHORT_LIVED_TOKEN"
   ```

   The reply contains the long-lived `access_token`. Note: this command puts secrets in your shell history, so clear it afterwards.

### 1.4 Give the token to the website
- **Live site (Cloudflare Pages):** project -> **Settings** -> **Variables and Secrets** -> **Add** -> name `INSTAGRAM_ACCESS_TOKEN`,
  value = the token, type **Secret** (encrypted), environment **Production** (and Preview if you want it there too). Save, then redeploy.
- **Your own computer (optional):** copy `.env.example` to `.env`, paste the token after `INSTAGRAM_ACCESS_TOKEN=`.
  `.env` is already git-ignored. Then run `npm run build`.

### 1.5 Check it worked
- In the Cloudflare build log there should be **no** `[instagram]` warning.
- The homepage shows an **On Instagram** section above the testimonials and `/gallery/` shows one above the closing banner.
- If the section is missing, look in the build log for `[instagram] Feed request failed (HTTP ...)`. HTTP 400/401 means the token is
  wrong, expired or missing the permission; generate a new one (1.3). No warning at all means the token variable was not seen by the build.

### 1.6 Keep it working
- Each build renews the token's 60-day life, so it never lapses while the site is rebuilt at least every couple of months.
  The daily rebuild in section 3 takes care of that.
- If the site is not rebuilt for 60 days the token expires: repeat 1.3 and update the Cloudflare variable.
- If you change the Instagram password or the app is disabled, tokens stop working: generate a new one.

---

## 2. Google Business Profile and Google reviews

Your page link `https://maps.app.goo.gl/yc8HABoshppiNUhu5` is already in the footer as **Google Reviews**.

### 2.1 Show reviews on the website (manual, by design)
Google only provides reviews through a paid API that cannot be used safely from a static site, so reviews are copied in by hand.
Only copy reviews that are genuine, and ideally tell the customer or check they are happy for it to be quoted.

1. Open the CMS (Pages CMS) -> **Testimonials** -> **New**.
2. **Quote:** paste the review text exactly as written (do not edit the meaning).
3. **Client name:** the reviewer's name as shown on Google (first name and initial is fine).
4. **Event type:** e.g. `Wedding` (optional).
5. **Where it was left:** `Google review`.
6. **Order:** `1` for the review to show large; higher numbers appear beneath it.
7. Tick **Published** and save. The site rebuilds and the **Kind words** section appears on the homepage.

Delete or leave unpublished the `sample-testimonial` entry; it is never shown while **Published** is off.

### 2.2 Get more reviews (recommended)
1. Sign in at <https://business.google.com> (or search "my business" while logged into the owner Google account).
2. Open the profile -> **Get more reviews** (also called **Ask for reviews**) and copy the **review link** (it starts with `https://g.page/r/...`).
3. Send that link to customers by WhatsApp after the event.
4. To add a **"Leave us a Google review"** button to the website, send that link to the developer, or add it to Site settings -> Social links
   as `Leave a review`. It will appear in the footer.

### 2.3 Complete the Business Profile (helps local search)
- Verify the profile if Google asks (video or postcard).
- Fill in: services, service area (Leicester and surrounding areas), opening hours, phone `07872 340258`, website URL once the domain is live, and photos.
- Add the website address to the profile as soon as the site is live.
- Reply to every review, good or bad, politely.

---

## 3. Daily rebuild (so new Instagram posts appear automatically)

The site is static, so new posts only appear when it is rebuilt. `.github/workflows/daily-rebuild.yml` triggers a rebuild every day at about 05:17 UTC.

1. Cloudflare dashboard -> **Workers & Pages** -> your project -> **Settings** -> **Builds** (or **Build configuration**) -> **Deploy hooks** -> **Add deploy hook**.
   Name it `daily`, branch `main`, and copy the URL. Treat the URL as a secret.
2. GitHub -> the `jnb-events` repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
   Name: `CF_PAGES_DEPLOY_HOOK`, value: the URL. Save.
3. GitHub -> **Actions** tab -> **Daily rebuild** -> **Run workflow** to test it. A new build should appear in Cloudflare.
4. Scheduled workflows run only from the repository's default branch and need the workflow file to be merged there, so merge this branch first.
   GitHub also pauses scheduled workflows after 60 days with no repository activity; re-enable it in the **Actions** tab if that happens.

---

## 4. Other open items

| Item | How |
|---|---|
| Business email on the contact page | CMS -> Site settings -> **Email**. Until set, the form opens WhatsApp. |
| Enquiry forms by email | Create a form on [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com), paste the URL into Site settings -> **Form endpoint**. |
| Facebook or TikTok links | CMS -> Site settings -> Social links -> add an entry (name + full `https://` link). It appears in the footer and in the site's search data. |
| Real photos | Replace the placeholder images from the CMS media panel before launch. See `IMAGE_HANDOVER.txt`. |
| Live domain | `astro.config.mjs` -> `SITE` must match the final domain (used for canonical URLs, sitemap, search data). |
| Analytics | Optional: [Plausible](https://plausible.io) or [Fathom](https://usefathom.com) (no cookie banner needed). |

---

## 5. Security notes

- Keep `INSTAGRAM_ACCESS_TOKEN`, the Meta **app secret** and the Cloudflare deploy hook URL out of Git, chat, screenshots and emails.
- The token is read-only and only used while the site builds; visitors' browsers never receive it.
- If a secret is ever exposed: for Instagram, generate a new token and update Cloudflare; for the deploy hook, delete it in Cloudflare and create a new one.
- Use Cloudflare's **Secret** variable type (encrypted), not plain text.
- Turn on two-factor authentication for the Instagram, Facebook/Meta, Google, GitHub and Cloudflare accounts.
