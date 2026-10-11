# Deploy CareGuide to AWS Amplify

## Current status

GitHub and AWS CLI authentication work. Deployment is blocked because IAM user `naigam-cli` is denied `amplify:ListApps`. Cost Explorer and Free Tier reads are also denied. A public URL and successful cloud deployment have not been verified.

The first application supplied by the user is RoboAssist: https://main.d1zh2706tsevoy.amplifyapp.com/ . Its public homepage returned HTTP 200 during verification. AWS also denied `amplify:GetApp` for app ID `d1zh2706tsevoy`, so its console deployment status cannot be confirmed through this CLI user.

## Required account step

An AWS administrator must grant this user Amplify deployment permissions. In the AWS console, open IAM → Users → naigam-cli → Add permissions. For this class deployment, the AWS managed `AdministratorAccess-Amplify` policy is one available option; it grants broad permissions, so the administrator should choose an appropriate scoped policy if required by the account. Do not paste access keys into chat or GitHub. Billing visibility separately requires `ce:GetCostAndUsage` and `freetier:GetFreeTierUsage` (and billing account access where applicable).

Alternatively, deploy through the Amplify console using an authorized account. The GitHub app authorization may require an interactive account-owner login even after CLI permissions are granted.

## Console deployment

1. Open https://console.aws.amazon.com/amplify/ in us-east-1.
2. Choose **Create new app**, select GitHub, and authorize AWS Amplify to access `naigambhatt98/careguide-workshop5`.
3. Select the `main` branch. Use hosting with server compute (`WEB_COMPUTE`) because this app includes an Express API. Do not choose a static-only upload.
4. Keep the repository's `amplify.yml`: Node 22, `npm ci`, `npm run build:amplify`, and artifact directory `.amplify-hosting`. If asked for an SSR compute service role, let the authorized console user create the recommended Amplify role. The application does not need permissions to access other AWS data services.
5. Remove any `VITE_API_URL` value pointing at localhost. Production uses the same domain for `/api`. Do not add `.env` or API keys to the repository. The current app uses deterministic generation and does not call an external AI provider.
6. Save and deploy. Enable automatic builds for `main`. Copy the `https://main.<app-id>.amplifyapp.com` URL only after the job succeeds.
7. Visit `/`, `/new`, `/guides`, and `/api/health`. Create a guide using fictional appointment details, toggle a checklist item, reload, reopen the guide, and delete it. Check at a mobile viewport and on an actual phone. Hard-refresh `/new` to verify SPA routing.
8. Push a small intended change to `main` and confirm Amplify starts another build automatically.

## Assignment evidence still required after deployment

- Screenshot of the real public app, showing its URL and visible date/time.
- Screenshot of the Amplify console showing both class applications and their successful deployment statuses. Amplify uses deployment statuses rather than App Runner's “Running” status. If the first app uses another AWS service, include a separate console screenshot.
- Screenshot of the GitHub repository, with visible date/time.
- Copy the live URL and verification results into the deployment report. Do not submit local screenshots as proof of cloud deployment.
- In Billing and Cost Management, check October 2026 costs and applicable Free Tier usage/credits. Free Tier eligibility and a zero bill cannot be inferred from a small app. Hosting compute also has usage charges.
- Share the URL with a friend yourself and record their feedback; this requires an actual person to test it.

## Useful commands

PowerShell blocks `npm.ps1` on this computer, so use `npm.cmd`:

```powershell
npm.cmd ci
npm.cmd run build:amplify
npm.cmd test
npm.cmd start
aws amplify list-apps --region us-east-1
aws amplify list-branches --app-id YOUR_APP_ID --region us-east-1
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main --region us-east-1
```

`npm.cmd start` runs the built full app on http://localhost:3001. For development, use `npm.cmd run dev` and http://localhost:5173.

## Architecture and limits

Amplify serves static assets and routes application/API traffic to Express on port 3000 using the deployment manifest. The build packages client assets, compiled server code, and dependencies, excluding `.env`. Guides persist in browser localStorage; the API's in-memory store is temporary and can disappear when compute instances restart or differ between instances. Checklist editing in the browser already preserves local changes when the server no longer has a guide. This remains an academic prototype.

Reference: https://docs.aws.amazon.com/amplify/latest/userguide/deploy-express-server.html
Pricing: https://aws.amazon.com/amplify/pricing/
