# How to Use SuiteQL Runner

This guide walks through the main SuiteQL Runner workflow after the SuiteApp is installed and available in NetSuite.

![SuiteQL Runner interface](assets/suiteql-runner-screenshot.png)

## 1. Open the Runner

Open the `SuiteQL Runner` single page app from the NetSuite role that should run the query.

The query runs through the RESTlet as the current NetSuite user, so role permissions, subsidiary access, and account features still apply.

## 2. Write or Paste SuiteQL

Use the Query Editor for the SuiteQL statement.

The editor starts blank on first use. When you select `Run SuiteQL`, `Format SuiteQL`, or `Analyze`, the current query is saved in browser storage and restored automatically when you leave the page and come back.

Use `Format SuiteQL` to clean up keyword casing and line breaks. Use `Analyze` to refresh local hints before running.

## 3. Use Autocomplete and Hints

Autocomplete suggestions appear inside Query Editor and include known SuiteQL and Oracle SQL language constructs such as clauses, functions, built-ins, pseudo-columns, and bind variables.

Hints are advisory. They can flag likely issues, but they do not block `Run SuiteQL`. NetSuite remains the final source of truth and returns execution errors in the Result panel.

The combined SuiteQL Performance Matrix & Hints panel is collapsible, so you can fold it while focusing on the editor and query results.

## 4. Choose Execution Mode

Check `Run as SuiteQLPaged` when you want paginated results with `N/query.runSuiteQLPaged`.

Leave it unchecked for direct `N/query.runSuiteQL`. Direct mode automatically falls back to paged execution when the RESTlet sees a capped-looking result.

Set:

- `Rows/page`: defaults to `1000`.
- `Pages`: defaults to `50`.

## 5. Run the Query

Select `Run SuiteQL`.

After execution, review:

- `Result`: returned rows or the NetSuite execution error.
- `SuiteQL Performance Matrix & Hints`: API used, latency, server time, row counts, page counts, truncation, governance usage, and local query guidance.

The Result panel appears directly below Query Editor. Result and SuiteQL Performance Matrix & Hints can be collapsed or expanded from their panel headers.

## 6. Ask AI About Reports, Searches, And Records

Select `AI Chat` in the Query Editor controls to show or hide the floating chat panel. The panel can be resized from its lower corner when you need more room for the conversation or generated SQL.

Use it for questions like:

```text
What is the record type ID and SuiteQL source for invoices?
```

You can also ask:

```text
Which saved search type should I start from for invoice line reporting, and what SuiteQL joins match it?
```

The AI chat specializes in reports, saved searches, standard NetSuite record type IDs, SuiteQL source names, transaction type codes, common standard fields, joins, and table relationships. It can also use the current Query Editor SQL as context when you ask it to fix, explain, improve, troubleshoot, or optimize the query.

AI responses support Markdown, including bullets and fenced SQL examples. Fenced code blocks render as separate code boxes.

It can still answer broader NetSuite, SuiteQL, SuiteScript, SDF, analytics, and reporting questions when that helps the workflow.

Custom records, custom fields, and feature-dependent schema should still be verified in the target account's Records Catalog, Records Browser, or Schema Browser.

## 7. Troubleshoot

If execution fails:

- Read the Result panel for the NetSuite error name and message.
- Run `Analyze` and check local hints.
- Simplify the query, then add joins and filters back gradually.
- Reduce rows per page or max pages for expensive queries.
- Check RESTlet logs if the UI shows a network or generic server error.
