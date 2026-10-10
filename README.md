<p align="center">
  <img src="img/cropped-EORC_logo_letter-270x270.png" alt="EORC logo" width="120">
</p>

<h1 align="center">Edinburgh Operational Research Corporation Ltd</h1>

<p align="center">
  <strong>Managing uncertainty in energy system decisions.</strong><br>
  <a href="https://eorc.uk">eorc.uk</a> · <a href="mailto:info@eorc.uk">info@eorc.uk</a>
</p>

---

## About EORC

EORC is an Edinburgh-based technology company specialising in optimisation and decision support under
uncertainty for energy systems. We build rigorous, scalable methods for planning and investment decisions in
complex, uncertain environments, grounded in years of research and applied work.

Our focus is operational research, applied mathematics and energy systems analysis, with explicit
representations of uncertainty: demand evolution, technology costs, policy and market dynamics. We work with
asset owners, infrastructure planners and long-term system planners, and we prioritise transparency, robustness
and interpretability so that trade-offs and assumptions stay visible.

## What we do

We make stochastic modelling an effortless part of your workflow, so uncertainty becomes an input to every plan
rather than a caveat added at the end.

- **Plan for many futures, not one forecast.** Test decisions against thousands of possible futures for prices,
  weather, demand and policy.
- **Multi-energy, multi-scale modelling.** Pan-European scope covering power, heat, hydrogen, oil & gas and CCS
  in one integrated model.
- **Proprietary algorithms.** Optimisation and neural-network-enhanced methods built for problems that
  commercial solvers struggle to handle.
- **No-code interface.** Set up models, run scenarios and read results without writing code, connected to the
  data and software your team already uses.

### Who we help

| Audience | How we help |
|----------|-------------|
| Energy asset owners | Invest, retrofit and retire with every likely future in view. |
| System operators | Plan operations across many possible outcomes for wind, solar and demand. |
| Power market analysts | Long-term power price outlooks for Europe that show the range, not just one line. |

### Platform

- **Data analytics**: time-series scenario generation, long-term commodity, policy and technology scenarios, and a
  European energy system database.
- **Algorithms**: scalable optimisation under uncertainty.
- **Models**: integrated multi-energy models, including North Sea offshore systems.
- **Results analytics**: power price outlooks, infrastructure pathways, asset valuation and uncertainty analytics.

## Team

| | Role | Profile |
|---|------|---------|
| Dr Hongyu Zhang | Director | [LinkedIn](https://www.linkedin.com/in/hongyu-zhang-0416/) |
| Tommaso Ferrario | Software Engineer | [LinkedIn](https://www.linkedin.com/in/tommaso-ferrario-383423200/) |
| Gabriele Sormani | Software Engineer | [LinkedIn](https://www.linkedin.com/in/gabriele-sormani-0866962a3/) |

## Contact

Want to see your energy system under uncertainty? Email us at [info@eorc.uk](mailto:info@eorc.uk) with a line
about your system, the energy carriers involved and the decision you are facing, or visit
[eorc.uk/contact](https://eorc.uk/contact.html) to request a demo.

---

# About this repository

This repository is the source of the [eorc.uk](https://eorc.uk) website: plain HTML, CSS and vanilla JavaScript,
no build step and no server code, hosted on GitHub Pages. It replaces the previous WordPress site.

The design is dark (`#0b0d10`) alternating with light, rounded sections, with a mint accent, Instrument Sans and
IBM Plex Mono fonts, and scroll animations.

## Structure

```
index.html                Home
product.html              Technology
contact.html              Contact (a mailto panel, no form)
about.html                About / team
404.html                  Served by GitHub Pages on any unknown path
request-a-demo.html       Redirect to contact.html (the old URL stays valid)
request-a-demo/index.html Same redirect for the directory-style URL /request-a-demo/
css/styles.css            Styles and design tokens
js/main.js                Mobile nav, scroll animations, mailto helpers
js/figures.js             Interactive figures on the Technology page
js/analytics.js           PostHog analytics (see below)
img/                      All site images, self-hosted
CNAME                     Custom domain (eorc.uk). Do not delete
.nojekyll                 Skip the Jekyll build step
```

All internal paths are **relative**, so the site works on both the project-page URL and the custom domain.
`404.html` is served at any path depth, so it carries a `<base>` element that an inline script points at the
site root. Any new link added to that page must stay relative.

## Local preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

## Deploying

Served by **GitHub Pages** from the `main` branch of `EORCLtd/website`, root folder (Settings → Pages → Deploy
from a branch). Any push to `main` redeploys within a minute. The repo must stay **public**, because Pages on
private repos needs GitHub Team or Enterprise.

### Custom domain

The `CNAME` file sets the custom domain to `eorc.uk`. DNS at GoDaddy must point at GitHub Pages:

| Type  | Host | Value |
|-------|------|-------|
| A     | `@`  | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA  | `@`  | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www`| `eorcltd.github.io.` |

- Do not touch the MX records or the SPF/DKIM TXT records: mail on `@eorc.uk` is unaffected as long as they
  stay put.
- Remove any GoDaddy forwarding or parking rule, which takes precedence over these records and breaks
  certificate issuance.
- Turn on **Enforce HTTPS** in Settings → Pages once the domain check is green.

## Contact page

`contact.html` has no form, because GitHub Pages cannot send mail. It offers a `mailto:` link to
`info@eorc.uk` with the subject and a short body prefilled. `initMailFallback()` in `js/main.js` reads that
href and also builds Gmail and Outlook compose links and a copy button for visitors without a mail client. The
mailto href in `contact.html` is the single place the address and template live.

An EmailJS-backed form existed before (removed in commit `c0f33e0`). Restoring it means recovering the form
markup and `js/email-service.js` from that commit's parent in git history, then filling in `EMAILJS_CONFIG`.
If restored, restrict the public key to `eorc.uk` in the EmailJS
dashboard, since the key ships in this public repo.

## Analytics

`js/analytics.js` loads [PostHog](https://posthog.com) (Cloud EU) on every page except the redirect stubs. It
records page views, scroll depth, clicks, heatmaps and session replay, plus four named events:

| Event | Fired when | Properties |
|-------|------------|------------|
| `contact_intent` | The mailto button, a webmail link or "Copy address" is clicked | `method`: `mailto` / `gmail` / `outlook` / `copy`; `role` when the visitor came from a role panel |
| `demo_cta_clicked` | Any link to `contact.html` is clicked | `location`, `label`, and `role` for role panels |
| `role_tab_selected` | A role tab on the home page is clicked | `role` |
| `figure_control_used` | A filter on the Technology figures is clicked | `figure`, `value` |

- The events hang off attributes in the markup (`data-mailto`, `role="tab"`, `data-net-controls`, ...), so
  renaming those breaks tracking silently.
- The PostHog project key in `POSTHOG_KEY` is public and write-only, so it belongs in the repo.
- No cookies: the visit id lives in `sessionStorage` and disappears when the tab closes.
- The script runs only on `eorc.uk` / `www.eorc.uk`. To test elsewhere, append `?ph_debug=1` to the URL.

## Notes

- Images are self-hosted in `img/` (about 1.1 MB). Remaining external dependencies are Google Fonts and PostHog.
- GitHub Pages soft limits: 1 GB site, about 100 GB/month bandwidth, 10 builds/hour. Not a constraint here.

---

<p align="center">© 2026 Edinburgh Operational Research Corporation Ltd. All rights reserved.</p>
