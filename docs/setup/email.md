# Setting up email for the backend

The backend sends email for job applications (the coding task to the applicant, and the application to us), password resets and broadcast emails. Until it has SMTP settings, email is switched off and the careers form shows an error.

## Is it free?

Yes. For now we send through the Gmail account `projectsfreelance1@gmail.com`, which costs nothing. A normal Gmail account can send about 500 emails a day, and each application uses 2, so that's plenty.

When the `vvet.org` mailbox is ready, we should switch so emails come from `@vvet.org` (see "Later" at the bottom).

## Step 1: Create a Gmail app password

Gmail won't accept the normal account password from an app. It needs a separate "app password".

1. Sign in to `projectsfreelance1@gmail.com` in a browser.
2. Turn on 2-Step Verification: go to https://myaccount.google.com/security, then **2-Step Verification**, and follow the steps. App passwords only exist once this is on.
3. Go to https://myaccount.google.com/apppasswords.
4. Name it `V-Vet backend` and click **Create**.
5. Google shows a 16-letter password. Copy it straight away, because it's only shown once. Remove the spaces when you paste it.

If the app passwords page says it isn't available, 2-Step Verification isn't fully on yet.

You can delete this app password at any time from the same page, and the backend will stop being able to send.

## Step 2: The settings

| Setting | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_TLS` | `True` |
| `SMTP_SSL` | `False` |
| `SMTP_USER` | `projectsfreelance1@gmail.com` |
| `SMTP_PASSWORD` | the 16-letter app password, no spaces |
| `EMAILS_FROM_EMAIL` | `projectsfreelance1@gmail.com` (must be the same Gmail account) |
| `EMAILS_FROM_NAME` | `V-Vet` |
| `CAREERS_INBOX_EMAIL` | `projectsfreelance1@gmail.com` (where applications arrive) |
| `FRONTEND_HOST` | `https://vvet.org` in production, `http://localhost:8080` locally |
| `BACKEND_CORS_ORIGINS` | `https://vvet.org,https://www.vvet.org` (lets the website call the backend) |

`FRONTEND_HOST` is also used for password reset links and the privacy link in application emails, so it must be the live site in production.

## Step 3: Add them locally

Add the lines to `backend/.env`, for example:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=True
SMTP_SSL=False
SMTP_USER=projectsfreelance1@gmail.com
SMTP_PASSWORD=yourapppasswordhere
EMAILS_FROM_EMAIL=projectsfreelance1@gmail.com
EMAILS_FROM_NAME=V-Vet
CAREERS_INBOX_EMAIL=projectsfreelance1@gmail.com
```

Never commit `backend/.env` or paste the app password into chat, issues or pull requests.

## Step 4: Add them in production (Azure)

The backend runs on Azure App Service, deployed by `.github/workflows/deploy.yml` when `main` changes. Settings live in Azure, not in the code.

1. Open https://portal.azure.com and go to the V-Vet App Service.
2. Go to **Settings**, then **Environment variables**, then the **App settings** tab.
3. Click **Add** for each setting in the table above.
4. Click **Apply**, then **Confirm**. The app restarts with the new settings.

## Step 5: Test it

1. **Test email:** open the backend's API docs (`/docs`), sign in as the superuser, and call `POST /api/v1/utils/test-email/` with your own email address. You should get a test email within a minute. Check spam.
2. **Test an application:** on the live site, apply to the Software Engineer role yourself with a small PDF. Check that:
   - you get the coding task email,
   - `CAREERS_INBOX_EMAIL` gets the application with the CV attached,
   - replying to the application email goes to the applicant's address.

If nothing arrives, check the App Service logs for `[Careers] Failed to send email`. The usual causes are a wrong app password, spaces left in it, or 2-Step Verification being switched off.

## Later: sending from @vvet.org

Gmail will always show the sender as the Gmail address. To send from `careers@vvet.org` or `info@vvet.org`, use either:

- **Google Workspace** on the `vvet.org` domain (paid per user), then repeat the steps above with the new account, or
- **A transactional email service** such as Brevo or Resend. Both have free plans that cover our volume. Check their pricing pages, since limits change. You verify the `vvet.org` domain by adding a few DNS records, then they give you SMTP settings to put in the table above.

Either way, set up SPF and DKIM records for `vvet.org` so our emails don't land in spam.
