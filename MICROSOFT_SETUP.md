# Connecting Business Email to Microsoft 365

The **Business Email** module reads and sends mail from a real Microsoft 365
mailbox through Microsoft Graph. Before it works, Microsoft needs to know this
app exists. That is a one-time, five-minute job in the Azure portal.

You need an account that can create app registrations in your Microsoft 365
tenant. That is usually any user, but some organizations restrict it — if the
**New registration** button is greyed out, ask whoever administers your
Microsoft 365.

---

## 1. Create the app registration

1. Go to <https://entra.microsoft.com> → **Applications** → **App registrations**
   → **New registration**.
2. **Name**: anything you'll recognise — e.g. `GenCopilot Portal`.
3. **Supported account types**: **Accounts in any organizational directory
   (Any Microsoft Entra ID tenant – Multitenant)**.
   Pick **Single tenant** instead if only your own organization should ever
   sign in.
4. **Redirect URI**: change the dropdown to **Single-page application (SPA)**
   — this part matters — and enter:

   ```
   http://localhost:5173
   ```

5. **Register**.

> ⚠️ The platform must be **Single-page application**, not *Web*. A *Web*
> platform expects a client secret and will reject the browser sign-in with
> `AADSTS9002326`. If you picked the wrong one, delete the entry under
> **Authentication** and add it again under the SPA heading.

---

## 2. Add your real URL too

Still in the registration, open **Authentication**. Under the
**Single-page application** platform, add every origin the app is served from:

```
http://localhost:5173
https://your-deployed-domain.example
```

The redirect URI must match the browser's origin **exactly** — scheme, host,
and port, with no trailing slash. A mismatch produces `AADSTS50011`.

If your dev server prints a different port than 5173, use that one.

---

## 3. Copy the client ID into the app

**Overview** → copy **Application (client) ID**.

Create `.env.local` in the project root (it is gitignored; `.env` is not) and
add:

```bash
VITE_MS_CLIENT_ID=00000000-0000-0000-0000-000000000000
VITE_MS_TENANT_ID=organizations
```

`VITE_MS_TENANT_ID` options:

| Value             | Who can sign in                                    |
| ----------------- | -------------------------------------------------- |
| `organizations`   | Any Microsoft 365 work or school account (default) |
| *your tenant GUID* | Only your own organization                        |
| `common`          | Also personal outlook.com / hotmail.com accounts   |

Restart the dev server — Vite only reads env files at startup.

Both values are **public**. A client ID identifies an app; it is not a
credential. The sign-in flow is authorization code + PKCE, which needs no
client secret, so there is nothing secret to protect here. **If any guide tells
you to put a client secret in a browser app, it is wrong** — a secret in a
static bundle is readable by anyone who opens devtools.

---

## 4. Install the sign-in library

```bash
npm install
```

`@azure/msal-browser` is already listed in `package.json`. Until it is
installed, the module shows a setup card saying so rather than failing.

---

## 5. Sign in

Open the portal → **Business Email** → **Connect Microsoft account**.

Microsoft will ask you to approve these permissions, for **your own mailbox
only**:

| Permission       | Why                                            |
| ---------------- | ---------------------------------------------- |
| `User.Read`      | Your name and address, to label the mailbox    |
| `Mail.ReadWrite` | Read mail, mark read, flag, move, delete       |
| `Mail.Send`      | Send, reply, and forward                       |
| `offline_access` | Stay signed in without re-prompting constantly |

These are **delegated** permissions: the app can only ever do what *you* can
do, to *your* mailbox. No administrator approval is required, and nobody —
including the founder — can read anyone else's mail through this app.

---

## Troubleshooting

| What you see | What it means |
| --- | --- |
| `AADSTS50011` redirect URI mismatch | The origin in the browser's address bar isn't listed in **Authentication**. Add it exactly, no trailing slash. |
| `AADSTS9002326` cross-origin token redemption | The redirect URI is registered under **Web** instead of **Single-page application**. Move it. |
| `AADSTS700016` application not found | The client ID is wrong, or the app belongs to a tenant your account can't reach. |
| `AADSTS650057` invalid resource | Usually a stale registration — confirm the client ID matches the app you edited. |
| "Need admin approval" | Your tenant requires admin consent for all apps. An administrator can grant it once from **API permissions → Grant admin consent**. |
| Popup closes instantly, nothing happens | A popup blocker. Allow popups for the site. |
| Module shows "library isn't installed" | Run `npm install`, then restart the dev server. |

---

## Deploying

Set `VITE_MS_CLIENT_ID` and `VITE_MS_TENANT_ID` as build-time environment
variables wherever the app is built (Cloudflare dashboard → your Worker →
Settings → Variables). They are inlined into the bundle at build time, so a
change requires a rebuild, not just a redeploy.

Add the production origin to the registration's SPA redirect URIs before the
first real sign-in.
