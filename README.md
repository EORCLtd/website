# EORC — static site

Static replacement (HTML/CSS/JS, no server code) for the current WordPress site. Form emails are sent client-side via EmailJS.

The design comes from Claude Design project `f6079cf0` (Home / Technology / Contact / About): dark base `#0b0d10` alternating with light sections with rounded corners, mint accent, Instrument Sans + IBM Plex Mono fonts, scroll animations.

## Structure

```
index.html            Home
product.html           Technology
contact.html           Contact — also contains the "Request a demo" form
about.html              About / team
request-a-demo.html    Redirect to contact.html (the old URL stays valid)
css/styles.css          Styles and design tokens
js/main.js               Mobile nav, scroll animations + generic form handling
js/email-service.js      Abstraction layer for sending email (see below)
```

The Contact page form (name, organisation, email, message) uses the form type `contact`; the separate "Request a demo" page no longer exists.

## Email sending (EmailJS)

The form is delivered through [EmailJS](https://www.emailjs.com/) — emails are sent directly from the browser, so the site stays fully static. Free tier: 200 emails/month.

One-time setup:

1. Create a free account at emailjs.com.
2. On the dashboard, add an **Email Service** (e.g. the Gmail connector, or SMTP for a mailbox on the `eorc.uk` domain) and note its **Service ID**.
3. Create an **Email Template** for the contact form. Use these variables in the subject/body: `{{name}}`, `{{org}}`, `{{email}}`, `{{message}}`. Set the "To" address to the mailbox that should receive the requests, and note the **Template ID**.
4. Copy your **Public Key** from Account → API Keys.
5. Paste the three values into the code:
   - `js/email-service.js` → `EMAILJS_CONFIG` (`publicKey`, `serviceId`, `templateIds.contact`)
   - `contact.html` → the `emailjs.init('YOUR_EMAILJS_PUBLIC_KEY')` line near the bottom

`contact.html` is the only page that loads the EmailJS SDK, since it's the only page with a form. All form code talks to `EmailService.send(...)` in `js/email-service.js`, so switching provider later means changing only that file.

## Deploying to GoDaddy

1. In the GoDaddy panel open **File Manager** (or use FTP/FileZilla) and go to the `public_html` folder of the `eorc.uk` domain.
2. If WordPress is still there: back it up if you want to keep it, then delete everything inside `public_html` (`wp-content`, `wp-admin`, `wp-config.php`, etc.). If WordPress was installed through an automatic installer (e.g. Installatron), uninstall it from there before deleting the files, to avoid leftovers in the database.
3. Upload **all** the contents of this folder (including `css/` and `js/`) into `public_html`, keeping the structure.
4. Visit `https://eorc.uk/` — the site should be online immediately, without touching DNS.

## Notes

- The form has a hidden honeypot field (`name="website"`) as basic anti-spam protection; EmailJS also offers reCAPTCHA integration on templates if spam becomes an issue.
- Client-side validation uses HTML5 + main.js. Since sending happens in the browser, there is no server-side validation layer; EmailJS rate-limits per public key.
- The images on the site still point to URLs on `eorc.uk/wp-content/uploads/...`: they will keep working as long as those files remain reachable. If you later want to host them locally, download them into an `img/` folder and update the paths in the HTML files.
