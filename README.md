# EORC — static site

Static replacement (HTML/CSS/JS, no server code) for the previous WordPress site, hosted on GitHub Pages.
Currently served at `https://eorcltd.github.io/website/`; the `eorc.uk` domain gets attached later, see
"Connecting eorc.uk" below.

The design comes from Claude Design project `f6079cf0` (Home / Technology / Contact / About): dark base `#0b0d10` alternating with light sections with rounded corners, mint accent, Instrument Sans + IBM Plex Mono fonts, scroll animations.

## Structure

```
index.html                Home
product.html              Technology
contact.html              Contact — a mailto panel, see "Contact" below
about.html                About / team
404.html                  Served by GitHub Pages on any unknown path
request-a-demo.html       Redirect to contact.html (the old URL stays valid)
request-a-demo/index.html Same redirect for the directory-style URL /request-a-demo/
css/styles.css            Styles and design tokens
js/main.js                Mobile nav, scroll animations, mailto helpers + generic form handling
js/email-service.js       Abstraction layer for sending email (currently unused)
img/                      All site images, self-hosted
.nojekyll                 Skip the Jekyll build step
```

All internal paths are **relative** (`css/styles.css`, `img/foo.png`), so the site works both on the
project-page URL and on a custom domain. `404.html` is relative too, but GitHub Pages serves it for unknown
paths *at any depth*, where relative URLs would resolve against the request path — so it carries a `<base>`
element that a two-line inline script points at the site root (`/` on a custom domain, `/<repo>/` on
`*.github.io`). Any new link added to that page must stay relative.

## Contact

`contact.html` has **no form**: GitHub Pages cannot send mail, so the page offers a `mailto:` link to
`info@eorc.uk` with the subject and a short body template prefilled, and enquiries land in the mailbox directly.

Because a `mailto:` does nothing for a visitor without a registered mail client, `initMailFallback()` in
`js/main.js` reads that same href and builds Gmail and Outlook compose URLs from it, plus a copy-to-clipboard
button. The mailto href in `contact.html` is the single place the address and the template live — the fallback
row is generated from it and stays hidden when JS is off.

### Restoring the form (optional)

The EmailJS-backed form markup lives in git history (commit `c0f33e0` removed it) and `js/email-service.js`
is still in the tree. EmailJS sends directly from the browser, so the site stays fully static. Free tier:
200 emails/month. To bring it back, restore the `<form data-form-type="contact">` markup and the
`[data-form-success]` panel in the contact card, put the EmailJS SDK `<script>`, the `emailjs.init(...)` call
and `js/email-service.js` back before `js/main.js`, and then:

1. Create a free account at emailjs.com.
2. Add an **Email Service** (e.g. the Gmail connector, or SMTP for a mailbox on the `eorc.uk` domain) and
   note its **Service ID**.
3. Create an **Email Template** using the variables `{{name}}`, `{{org}}`, `{{email}}`, `{{message}}`. Set
   the "To" address to the mailbox that should receive the requests, and note the **Template ID**.
4. Copy your **Public Key** from Account → API Keys, and under Account → Security restrict it to `eorc.uk`
   — the key ships in the public repo, so domain restriction is what stops it being reused elsewhere.
5. Paste the values into `js/email-service.js` → `EMAILJS_CONFIG` and into the `emailjs.init(...)` line.

All form code talks to `EmailService.send(...)` in `js/email-service.js`, so switching provider later means
changing only that file. The form has a hidden honeypot field (`name="website"`) as basic anti-spam
protection; EmailJS also offers reCAPTCHA integration on templates. Since sending happens in the browser
there is no server-side validation layer; EmailJS rate-limits per public key.

## Deploying

The site is served by **GitHub Pages** from the `main` branch of `EORCLtd/website`, root folder. Any push to
`main` redeploys within a minute — there is no build step.

Repo settings: Settings → Pages → Source **Deploy from a branch**, branch `main`, folder `/ (root)`.
The repo must stay **public** (Pages on private repos requires GitHub Team or Enterprise).

Live at `https://eorcltd.github.io/website/`.

## Connecting eorc.uk

Not done yet — the repo deliberately has **no `CNAME` file**, so that the site is reachable on the
`github.io` URL while the domain still points elsewhere. A `CNAME` file in the repo *is* the custom domain:
as soon as one exists, Pages redirects `eorcltd.github.io/website/` to it, and the site is unreachable
everywhere until DNS resolves to GitHub.

When the switch is wanted:

1. Point the DNS at GitHub (table below) and wait for it to propagate.
2. Settings → Pages → **Custom domain** = `eorc.uk`. GitHub commits the `CNAME` file back into the repo —
   `git pull` afterwards, and from then on don't delete it.
3. Once the domain check is green, turn on **Enforce HTTPS**.

Nothing in the site needs editing for the move: all paths are relative and `404.html` detects the host itself.

### DNS (GoDaddy, `eorc.uk`)

| Type  | Host | Value |
|-------|------|-------|
| A     | `@`  | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA  | `@`  | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www`| `eorcltd.github.io.` |

- **Do not touch the MX records** or the SPF/DKIM TXT records: mail on `@eorc.uk` (including `info@eorc.uk`,
  linked from the contact page) is unaffected by the A records as long as the MX entries stay put.
- Remove any GoDaddy *Forwarding* / domain-parking rule — it takes precedence over the records and breaks
  certificate issuance.
- The Let's Encrypt certificate is issued automatically once the domain check passes and can take a few hours.

## Local preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

## Notes

- Images are self-hosted in `img/` (~1.1 MB total). They used to be loaded from `eorc.uk/wp-content/uploads/`
  on the old WordPress install; that dependency is gone, so decommissioning the WordPress site is safe.
- Remaining external dependency: **Google Fonts**. If full independence is wanted, self-host the two
  families and drop the `fonts.googleapis.com` links.
- GitHub Pages soft limits: 1 GB site, ~100 GB/month bandwidth, 10 builds/hour. Not a constraint here.
