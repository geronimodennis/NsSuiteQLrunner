# Why Use a SuiteApp

SuiteQL Runner is intentionally packaged as a SuiteApp instead of a standalone web app or external SQL client.

## NetSuite-Native Security Context

Queries execute inside NetSuite through SuiteScript. That means execution follows the account, role, subsidiary, feature, and permission context available to the current user and deployment.

External tools often require separate credentials, integrations, tokens, or exported data. This SuiteApp keeps the workflow close to the source system.

## Repeatable Delivery

SDF packages the SPA, RESTlet, deployments, manifest, and File Cabinet paths together. That makes installation and promotion predictable across sandbox, release preview, and production.

The same project can be reviewed, versioned, deployed, rolled back, and audited like any other SuiteCloud customization.

## Better Support Workflow

Implementation teams often need quick SuiteQL checks during configuration, data migration, debugging, saved search replacement, and support cases.

A shared SuiteApp gives the team one consistent runner instead of ad hoc scripts, browser console snippets, or local tools that behave differently from account to account.

## Performance Visibility

The runner returns a performance matrix with the selected execution mode, query API used, fallback status, client validation time, request latency, server execution time, result count, returned rows, page metrics, and governance usage.

Those metrics help users distinguish a slow query from a slow network request, a large result set, or a query that is consuming too much script usage.

## AI Report And Schema Help

The floating AI chat gives SuiteQL authors an in-account place to ask about reports, saved searches, standard NetSuite record type IDs, SuiteQL sources, transaction type codes, common standard fields, joins, table relationships, and schema patterns.

It is meant to speed up query drafting and reporting analysis, not replace account-specific verification. Custom records, custom fields, enabled-feature fields, and bundle-specific schema still need to be checked in the target NetSuite account.

## Guardrails Without Blocking

The app highlights likely problems such as DDL/DML keywords, malformed clauses, malformed `ORDER BY` expressions, dangling operators, trailing commas, SQL Server-only functions, unsupported function names, bracketed identifiers, unbalanced parentheses, and expensive `SELECT *` patterns.

It does not block execution because SuiteQL support can vary by account, feature, and NetSuite release. NetSuite still returns the authoritative error in the result panel.

## When Not to Use It

Do not treat this as a public reporting portal. It is an administrative and developer tool for trusted users.

For production analytics consumed by a wide audience, prefer dashboards, reports, workbooks, saved searches, or a purpose-built SuiteApp with fixed query surfaces and stricter authorization.
