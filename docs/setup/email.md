# Setting up email for the backend

The backend sends email for job applications, password resets and broadcast emails. We send through our Zoho mailbox, `info@vvet.org`. Until the backend has SMTP settings, email is switched off and the careers form shows an error.

## What happens when someone applies

1. **The applicant gets an email** from `info@vvet.org` with the coding task, how to submit it (a GitHub link, within 7 days) and what happens next. Replying to it reaches `info@vvet.org`.
2. **We get the application** at `info@vvet.org`: their details, links, their LLM answer and the CV as an attachment. Replying to it writes straight to the applicant.

If the applicant's email fails to send, the application still arrives, marked "Failed to send. Please send the task manually."

## Before you start: check the Zoho plan

The backend needs SMTP access. Zoho's paid plans (such as Mail Lite) include it. New accounts on the **Forever Free** plan may not get SMTP access, so check the plan in the Zoho Mail admin console first. If SMTP isn't included, upgrade the `info@vvet.org` mailbox before going further.

## Step 1: Create an app password

If two-factor authentication is on for `info@vvet.org` (it should be), the backend needs an app password instead of the normal password.

1. Sign in at https://accounts.zoho.com as `info@vvet.org`.
2. Go to **Security**, then **App Passwords**, then **Generate New Password**.
3. Name it `V-Vet backend` and click **Generate**.
4. Copy the password straight away, because it's only shown once.

You can revoke it from the same page at any time, and the backend will stop being able to send.

## Step 2: The settings

| Setting | Value |
|---|---|
| `SMTP_HOST` | `smtppro.zoho.com` (see note below) |
| `SMTP_PORT` | `587` |
| `SMTP_TLS` | `True` |
| `SMTP_SSL` | `False` |
| `SMTP_USER` | `info@vvet.org` |
| `SMTP_PASSWORD` | the app password from step 1 |
| `EMAILS_FROM_EMAIL` | `info@vvet.org` (must be the mailbox you sign in with, or one of its aliases) |
| `EMAILS_FROM_NAME` | `V-Vet` |
| `CAREERS_INBOX_EMAIL` | `info@vvet.org` (where applications arrive; this is also the default) |
| `FRONTEND_HOST` | `https://vvet.org` in production, `http://localhost:8080` locally |
| `BACKEND_CORS_ORIGINS` | `https://vvet.org,https://www.vvet.org` (lets the website call the backend) |

**Which SMTP host:** `smtppro.zoho.com` is for paid organisation accounts on your own domain, and `smtp.zoho.com` is for free accounts. Zoho also has regional servers: if you sign in to Zoho Mail at `mail.zoho.eu`, use `smtppro.zoho.eu` instead (`.in` and `.com.au` work the same way).

If port 587 doesn't work, try `SMTP_PORT=465`, `SMTP_SSL=True`, `SMTP_TLS=False`.

`FRONTEND_HOST` is also used for password reset links and the privacy link in application emails, so it must be the live site in production.

## Step 3: Add them locally

Add the lines to `backend/.env`, for example:

```
SMTP_HOST=smtppro.zoho.com
SMTP_PORT=587
SMTP_TLS=True
SMTP_SSL=False
SMTP_USER=info@vvet.org
SMTP_PASSWORD=yourapppasswordhere
EMAILS_FROM_EMAIL=info@vvet.org
EMAILS_FROM_NAME=V-Vet
CAREERS_INBOX_EMAIL=info@vvet.org
```

Never commit `backend/.env` or paste the app password into chat, issues or pull requests.

## Step 4: Add them in production (Azure)

The backend runs on Azure App Service, deployed by `.github/workflows/deploy.yml` when `main` changes. Settings live in Azure, not in the code.

1. Open https://portal.azure.com and go to the V-Vet App Service.
2. Go to **Settings**, then **Environment variables**, then the **App settings** tab.
3. Click **Add** for each setting in the table above.
4. Click **Apply**, then **Confirm**. The app restarts with the new settings.

## Step 5: Keep our emails out of spam

In the Zoho Mail admin console, go to **Domains**, choose `vvet.org`, and make sure **SPF** and **DKIM** both show as verified. If they don't, Zoho shows the DNS records to add at the domain registrar. Without them, applicants are more likely to find the coding task in spam.

## Step 6: Test it

1. **Test email:** open the backend's API docs (`/docs`), sign in as the superuser, and call `POST /api/v1/utils/test-email/` with your own email address. You should get a test email within a minute. Check spam.
2. **Test an application:** on the live site, apply to the Software Engineer role yourself with a small PDF, using a personal email address. Check that:
   - you get the coding task email from `info@vvet.org`,
   - `info@vvet.org` gets the application with the CV attached,
   - replying to the application email goes to the applicant's address.

If nothing arrives, check the App Service logs for `[Careers] Failed to send email`. The usual causes are a wrong app password, the wrong regional SMTP host, or a plan without SMTP access.
