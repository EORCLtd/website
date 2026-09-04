# EORC — static site

Static replacement (HTML/CSS/JS, no server code) for the previous WordPress site, hosted on GitHub Pages at `https://eorc.uk`.

The design comes from Claude Design project `f6079cf0` (Home / Technology / Contact / About): dark base `#0b0d10` alternating with light sections with rounded corners, mint accent, Instrument Sans + IBM Plex Mono fonts, scroll animations.

## Structure

```
index.html                Home
product.html              Technology
contact.html              Contact — currently a mailto panel, see "Contact form" below
about.html                About / team
404.html                  Served by GitHub Pages on any unknown path
request-a-demo.html       Redirect to contact.html (the old URL stays valid)
request-a-demo/index.html Same redirect for the directory-style URL /request-a-demo/
css/styles.css            Styles and design tokens
js/main.js                Mobile nav, scroll animations + generic form handling
js/email-service.js       Abstraction layer for sending email (currently unused)
img/                      All site images, self-hosted
CNAME                     Custom domain for GitHub Pages (eorc.uk)
.nojekyll                 Skip the Jekyll build step
```

All internal paths are **relative** (`css/styles.css`, `img/foo.png`), so the site works both on the
project-page URL and on the custom domain. The single exception is `404.html`, which uses **root-absolute**
paths (`/css/styles.css`) because GitHub Pages serves it for unknown paths at any depth — that page renders
unstyled if previewed on `eorcltd.github.io/website/`, but is correct on `eorc.uk`.

## Contact form

**The form is currently disabled.** `contact.html` shows a static panel pointing at `hz@eorc.uk` instead,
so no visitor hits a form that cannot deliver. The form markup lives in git history; the placeholder block
in `contact.html` carries the restore instructions.

The form was delivered through [EmailJS](https://www.emailjs.com/) — sent directly from the browser, so the
site stays fully static. Free tier: 200 emails/month. To re-enable it:

1. Create a free account at emailjs.com.
2. Add an **Email Service** (e.g. the Gmail connector, or SMTP for a mailbox on the `eorc.uk` domain) and
   note its **Service ID**.
3. Create an **Email Template** using the variables `{{name}}`, `{{org}}`, `{{email}}`, `{{message}}`. Set
   the "To" address to the mailbox that should receive the requests, and note the **Template ID**.
4. Copy your **Public Key** from Account → API Keys, and under Account → Security restrict it to `eorc.uk`
   — the key ships in the public repo, so domain restriction is what stops it being reused elsewhere.
5. Restore the form markup and the three `<script>` tags in `contact.html`, then paste the values into
   `js/email-service.js` → `EMAILJS_CONFIG` and into the `emailjs.init(...)` line.

All form code talks to `EmailService.send(...)` in `js/email-service.js`, so switching provider later means
changing only that file. The form has a hidden honeypot field (`name="website"`) as basic anti-spam
protection; EmailJS also offers reCAPTCHA integration on templates. Since sending happens in the browser
there is no server-side validation layer; EmailJS rate-limits per public key.

## Deploying

The site is served by **GitHub Pages** from the `main` branch of `EORCLtd/website`, root folder. Any push to
`main` redeploys within a minute — there is no build step.

Repo settings: Settings → Pages → Source **Deploy from a branch**, branch `main`, folder `/ (root)`.
The `CNAME` file pins the custom domain; **do not delete it**, GitHub rewrites it from the Pages settings.

### DNS (GoDaddy, `eorc.uk`)

| Type  | Host | Value |
|-------|------|-------|
| A     | `@`  | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA  | `@`  | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www`| `eorcltd.github.io.` |

- **Do not touch the MX records** or the SPF/DKIM TXT records: mail on `@eorc.uk` (including `hz@eorc.uk`,
  linked from the contact page) is unaffected by the A records as long as the MX entries stay put.
- Remove any GoDaddy *Forwarding* / domain-parking rule — it takes precedence over the records and breaks
  certificate issuance.
- Turn on **Enforce HTTPS** in Settings → Pages only once the domain check is green; the Let's Encrypt
  certificate is issued automatically and can take a few hours.

### Local preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

## Notes

- Images are self-hosted in `img/` (~1.1 MB total). They used to be loaded from `eorc.uk/wp-content/uploads/`
  on the old WordPress install; that dependency is gone, so decommissioning the WordPress site is safe.
- Remaining external dependency: **Google Fonts**. If full independence is wanted, self-host the two
  families and drop the `fonts.googleapis.com` links.
- GitHub Pages soft limits: 1 GB site, ~100 GB/month bandwidth, 10 builds/hour. Not a constraint here.
