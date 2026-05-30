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

Hints are advisory. They can flag likely issues such as malformed clauses, malformed `ORDER BY` expressions, dangling operators, trailing commas, unsupported functions, and SQL dialect mismatches, but they do not block `Run SuiteQL`. Warning and error hints appear directly under Query Editor. Informational hints stay hidden to save space.

NetSuite remains the final source of truth. If `Run SuiteQL` fails, the execution error appears in the Query Editor hint section.

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
- `SuiteQL Hints`: local warnings/errors and any SuiteQL execution error directly under Query Editor.
- `SuiteQL Performance Matrix`: API used, latency, server time, row counts, page counts, truncation, and governance usage.

The Result panel appears directly below Query Editor. Result and SuiteQL Performance Matrix can be collapsed or expanded from their panel headers.

## 6. Ask AI About Reports, Searches, And Records

Select `AI Chat` in the Query Editor controls to show or hide the floating chat panel. The panel can also be closed from its `Close` button without clearing the conversation. The panel can be resized from its lower corner when you need more room for the conversation or generated SQL.

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

When an AI response includes a SQL or SuiteQL code block, use `Insert to Query Editor` to replace the current editor text with that SQL, or `Merge to Current Query` to combine it with the current editor text. The `Use AI query merging` checkbox controls whether merge asks NetSuite AI to produce one combined query. AI merging may use NetSuite AI tokens; when AI is unavailable, the app shows a warning and falls back to a basic append-style merge.

### Use AI Chat History

Use `History` in the AI chat tool row to open the AI Chat History panel.

- `New Chat` starts a separate conversation while keeping previous chats in history.
- `Load` restores a previous chat into the active chat panel.
- `Delete` removes one saved chat.
- `Clear All` removes all saved chats and starts a fresh conversation.

Chat history is saved in browser storage for the current browser profile. It is not shared across browsers or devices, and clearing browser storage removes it.

It can still answer broader NetSuite, SuiteQL, SuiteScript, SDF, analytics, and reporting questions when that helps the workflow.

Custom records, custom fields, and feature-dependent schema should still be verified in the target account's Records Catalog, Records Browser, or Schema Browser.

## 7. Troubleshoot

If execution fails:

- Read the Result panel for the NetSuite error name and message.
- Run `Analyze` and check local hints.
- Simplify the query, then add joins and filters back gradually.
- Reduce rows per page or max pages for expensive queries.
- Check RESTlet logs if the UI shows a network or generic server error.
