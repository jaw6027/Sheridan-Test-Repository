# Plum & Polish

An editable nail art journal in cream, blush, and plum. The brand is a placeholder you can change. All included designs are labeled sample illustrations; they are not photos of your work. No purchase links are invented.

## See the website

Use Node 24 or newer. In this project folder:

```sh
npm ci --cache /tmp/npm-cache
npm start
```

The app listens on port **3000**. Use your development environment’s port preview if available. Screenshots from the tested preview are in [docs/previews](docs/previews/). No public deployment has been made.

## 1. Log in and publish a design

Before your first login, run `npm run owner:setup` in this folder. Choose a private password of at least 12 characters. Terminal input is visible, so use a private terminal. This saves only a salted password hash and random session secret in ignored `.env`, with restricted file permissions. Restart the app. Open `/owner/login`, enter your password, and select **New design**. No public owner registration exists.

Add a title, description, optional instructions (one step per line), and color/style/occasion. **Save draft** before using the other sections. Upload photos, describe each image for people using screen readers, and save each photo. Smaller order numbers appear first; the first photo is the cover. Choose **Preview**, then **Publish design**. Unpublish hides a design and its images from public view. Deletion is permanent. Published edits appear when you save. Keep confidential material out of published designs.

Use **Your brand & profile** in the dashboard to change your brand name, biography, social links, and homepage feature. Remove sample designs when your own photos are ready. To reset a forgotten password, run `npm run owner:setup` again and restart. For account compromise, also rotate SESSION_SECRET to invalidate sessions.

## 2. Add supplies and purchase links

In a design, expand **Add a supply**. Enter the product name, brand, shade, optional notes, and the real product page address from its retailer. Only ordinary http/https links are accepted. Save each supply individually; use its form to edit it later. Check **Show affiliate link disclosure** if you earn commission from any of those links. Each link is labeled as an external purchase link. Test actual retailer destinations yourself before publishing; automated tests only verify safe link handling.

## 3. Subscriber notifications

The public form asks for consent. A visitor receives a confirmation link, then presses **Confirm my subscription**. Only confirmed subscribers receive new designs. Each email includes an unsubscribe link; confirming unsubscribe removes the subscriber and their pending mail. Subscriber addresses never appear in public pages or the owner dashboard.

Connect **Resend** to send real emails: create an account, verify a domain you control, and configure `RESEND_API_KEY`, `EMAIL_FROM` (a verified sender such as `Studio <hello@your-domain>`), and `PUBLIC_URL` (the actual HTTPS website address). Keep credentials in your host’s secret settings, never Git. The email worker needs HTTPS access to `api.resend.com`. Restart after changing settings. Missing settings show **Email preview mode** and subscription attempts explicitly report that nothing was saved or sent.

When publishing, check **Notify confirmed subscribers**. Publishing and the recipient list are saved in one database transaction. Each design can queue one notification campaign for subscribers confirmed at that time. Later edits, repeat clicks, or republishing do not generate another campaign. Publishing without notifications allows you to send the first campaign later. Samples cannot be emailed.

A background worker checks the durable queue every 15 seconds. Resend’s idempotency keys protect retries. Emails are called “accepted by provider” only after the provider returns a receipt; acceptance is not proof of inbox delivery. Failures remain pending. After 23 hours, uncertain jobs pause as `needs-review` to avoid resending outside Resend’s 24-hour deduplication window. Reconcile these jobs with Resend logs before making any manual queue changes. Keep this service running; do not deploy it as a request-only serverless function. Unsubscribing cancels pending mail, though a message already being delivered may still arrive. Sent delivery records retain addresses; an administrator can remove them from the mail table for a privacy request. A manual resend/reconciliation screen and automated bounce processing are not included.

## 4. Accounts and settings needed to launch

- A host supporting one always-on Node 24 service and a persistent disk. No paid account was purchased.
- An owner password and a long random SESSION_SECRET. Run owner setup locally to generate them; copy the hash and secret securely to production secret settings without committing `.env`.
- Resend, a verified sending domain, and the three email settings above for real subscriptions.
- A domain registrar account if you want your own address.

The database, photos, and fallback development session key live under `DATA_DIR` (default `./data`). Production must mount a persistent disk there. **Do not rely on the container filesystem or a Git deploy to preserve data.** Never replace or clear this directory on deploy. SQLite fits a small owner-run site; deploy one application instance attached to its disk. Do not use multiple replicas or a shared network filesystem. Back up both the database and photos to secure storage regularly; verify restoration. Use `npm run backup -- /path/to/private-backup` while the app runs for a consistent SQLite backup, then back up uploads during a quiet period. For an exact combined snapshot, stop the app during the whole backup. Backups contain subscriber data and must stay private.

## 5. Deploy and connect your domain

A platform such as Render with a persistent disk can run this as a web service. Review its current costs before buying anything.

1. Connect your hosting account to the GitHub repository `jaw6027/Sheridan-Test-Repository` and select its `main` branch.
2. Create one Node web service. Build: `npm ci --omit=dev`. Start: `npm start`. A Dockerfile is also included; its image build has not been tested in this environment.
3. Mount persistent storage at `/data`. Set `DATA_DIR=/data`, `NODE_ENV=production`, `PUBLIC_URL=https://your-website-address`, `SESSION_SECRET`, and `OWNER_PASSWORD_HASH`. Add your email settings. HTTPS must terminate at exactly one trusted reverse proxy; adapt Express `trust proxy` if your hosting topology differs. Production startup refuses to run without the required login and HTTPS settings.
4. In your host’s **Custom domain** settings, add the domain. At your registrar, enter the DNS records supplied by the host. Wait for verification and automatic HTTPS. Update `PUBLIC_URL` to this custom address and restart. Add Resend’s separate sender-verification DNS records too.
5. Before announcing the site, replace sample content, review your biography and privacy wording, verify external supplies, sign in on a phone, upload your own photos, and use an email address you control to confirm, receive a design notification, and unsubscribe. This live email check remains required.

## Validation and maintenance

`npm test` exercises owner login/logout, CSRF rejection, draft privacy, image conversion, supply creation/editing and unsafe-link rejection, publishing, notification deduplication, confirmation, unsubscribe, unpublish, deletion, and brand settings. The Resend response is simulated: no real messages are sent by tests.

`node scripts/check-browser.js` uses system Chromium at `/usr/bin/chromium` (or set `CHROMIUM_PATH`) to check desktop/mobile layout, filtering, the photo viewer, keyboard Escape, and safe initial owner setup. Run it against a fresh development instance with owner credentials unset. It writes screenshots under `/tmp/plum-preview/`. `node scripts/check-owner-browser.js` runs a separate throwaway server, exercises the owner UI on desktop/mobile, and verifies post, photo, and session persistence across a restart. It does not validate a deployed host or actual phone hardware.

Security includes scrypt password hashing, persistent private sessions, CSRF checks, upload limits, image re-encoding and metadata removal, rate limits, a honeypot, security headers, and escaping of user content. Use HTTPS, keep Node and dependencies updated, and store backups securely. The in-memory rate limiter is appropriate for the single-instance design; protect the site with your host’s edge controls for larger traffic.
