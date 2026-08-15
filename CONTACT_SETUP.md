# Contact form — how messages reach you

The form on `/contact` sends every submission down **two independent paths**, so
a message survives even if one of them is not configured.

| Path | Destination | Needs setup? |
| --- | --- | --- |
| 1. Firestore | `contacts` collection | **No** — works already |
| 2. Email | `gencopilotfounder@gmail.com` | Yes — see below |

If both fail, the sender is told to email you directly instead of getting a
false "message sent" confirmation.

---

## Path 1 — Firestore (already working)

Every submission is written to the `contacts` collection. The security rules
allow create-only from the browser, so nobody can read other people's messages:

```
match /contacts/{contactId} {
  allow create: if true;
  allow read, update, delete: if false;
}
```

**To read your messages:** Firebase Console → Firestore Database → `contacts`.
Each document has `name`, `email`, `message`, and `createdAt`.

This needs no API keys and is the reason the form is already useful today.

---

## Path 2 — Email delivery (optional, ~5 minutes)

Uses [Resend](https://resend.com) — free tier covers 3,000 emails/month.

### Step 1 — Get an API key

1. Sign up at [resend.com](https://resend.com) using **gencopilotfounder@gmail.com**
   (this matters — see the sandbox limit below).
2. **API Keys** → **Create API Key** → copy it (starts with `re_`).

### Step 2 — Set it where the site is deployed

**Cloudflare** (Workers/Pages — this repo's `npm run deploy`):

```powershell
npx wrangler secret put RESEND_API_KEY
```

Paste the key when prompted.

**Vercel** (`gencofounder.vercel.app`):
Project → Settings → Environment Variables → add `RESEND_API_KEY` → Redeploy.

**Local testing** — add to `.dev.vars` (already gitignored, never commit it):

```
RESEND_API_KEY=re_your_key_here
```

### Step 3 — Send a test message

Submit the form. The email arrives with the sender's address in `reply_to`, so
hitting Reply in Gmail answers the person who wrote in.

---

## The sandbox sender limit (read this if mail doesn't arrive)

Out of the box the function sends from `onboarding@resend.dev`. Resend only
lets that sandbox address deliver **to the email that owns the Resend account**.

- Signed up as `gencopilotfounder@gmail.com` → messages arrive. Done.
- Signed up as anything else → Resend rejects the send. Either re-register with
  `gencopilotfounder@gmail.com`, or verify your own domain (below).

### Sending from your own domain (optional, looks more professional)

1. Resend → **Domains** → **Add Domain** → enter your domain.
2. Add the DNS records it shows you at your registrar.
3. Once verified, set one more variable:

```
CONTACT_FROM=GenCopilot <hello@yourdomain.com>
```

After this the sandbox restriction is gone and mail can go anywhere.

---

## Optional variables

| Variable | Default | What it does |
| --- | --- | --- |
| `RESEND_API_KEY` | *(unset)* | Turns email on. Without it, Firestore only. |
| `CONTACT_TO` | `gencopilotfounder@gmail.com` | Where messages are delivered. |
| `CONTACT_FROM` | `GenCopilot <onboarding@resend.dev>` | Sender. Needs a verified domain to change. |
| `RECAPTCHA_SECRET_KEY` | *(unset)* | Turns on spam filtering. Site key is already in `App.jsx`. |

---

## Spam protection

The frontend already requests a reCAPTCHA v3 token on submit. The endpoint only
*checks* it once `RECAPTCHA_SECRET_KEY` is set — until then tokens are ignored
and every submission passes. Get the secret half of the key pair at
[google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) (the site
key `6LcH43kt…` in `App.jsx` is already public and safe to commit; the secret
is not — set it the same way as `RESEND_API_KEY`).

---

## Troubleshooting

**Nothing in Firestore either** → check the browser console on submit. A
`permission-denied` means the rules above were never published; paste them into
Firebase Console → Firestore → Rules → Publish.

**Form says sent, no email** → check Cloudflare logs with `npm run tail` (or
Vercel function logs). `RESEND_API_KEY not set` means step 2 was missed;
a Resend rejection is logged with its reason — usually the sandbox limit above.

**Form shows the "email us directly" error** → both paths failed, which almost
always means the browser is offline or Firestore rules block the write.
