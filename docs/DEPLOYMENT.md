# Deployment

## Prerequisites

- Node.js and npm.
- NetSuite account with SuiteCloud Development Framework support.
- SuiteCloud CLI authentication configured for the target account.
- A publisher ID and SuiteApp ID appropriate for your account or organization.

## Prepare the Project

Install dependencies:

```bash
npm install
```

Build the SPA bundle:

```bash
npm run bundle
```

The bundle command compiles TypeScript from `src/SuiteApps` and writes deployable NetSuite AMD scripts into `src/FileCabinet/SuiteApps`.

## Configure IDs

The starter project uses example IDs:

- Publisher ID: `com.example`
- SuiteApp path: `com.example.suiteqlrunner`
- SPA script ID: `custspa_suiteqlrunner`
- RESTlet script ID: `customscript_nsqlr_restlet`
- RESTlet deployment ID: `customdeploy_nsqlr_restlet`

Update those values if your account requires different IDs.

Files to review:

- `src/manifest.xml`
- `src/deploy.xml`
- `src/Objects/custspa_suiteqlrunner.xml`
- `src/Objects/customscript_nsqlr_restlet.xml`
- SuiteApp source paths under `src/SuiteApps`
- File Cabinet output paths under `src/FileCabinet`

## Validate

```bash
npm run validate
```

Validation requires SuiteCloud CLI project authentication. The command bundles first, then runs SuiteCloud project validation.

## Deploy

```bash
npm run deploy
```

After deployment, open the SPA path:

```text
/spa-app/com.example.suiteqlrunner/suiteqlrunner
```

## Production Hardening

Before deploying to production:

- Restrict the SPA audience from all roles to trusted roles.
- Restrict the RESTlet deployment from all roles to trusted roles.
- Confirm whether the RESTlet should run as the current role or a specific execution role.
- Review logging level and retention expectations.
- Test expected query sizes in sandbox before production use.

