# Architecture

The SuiteQL Runner SPA uses clean architecture boundaries so SuiteQL rules, application workflow, NetSuite integration, and UIF rendering can evolve independently.

## Layer Overview

```text
presentation  ->  application  ->  domain
      |               |
      v               v
infrastructure  ->  NetSuite RESTlet
```

The dependency direction points inward. Presentation and infrastructure can depend on application and domain code, but domain code does not depend on UIF components, browser APIs, or NetSuite modules.

## Domain

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/domain`

Responsibilities:

- Shared models such as query hints, completion items, execution responses, and AI report/schema chat messages.
- SuiteQL catalog data such as clauses, keywords, Oracle functions, NetSuite built-ins, pseudo-columns, and bind variables.
- Query text helpers for token replacement and string/comment stripping.
- Constants such as row limits and sample query text.

## Application

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/application`

Responsibilities:

- `SuiteQLAnalyzer.ts` detects common SuiteQL and Oracle SQL issues.
- `SuiteQLFormatter.ts` formats SQL text without knowing about UI state.
- `CompletionService.ts` returns autocomplete suggestions.
- `QueryRunnerService.ts` orchestrates validation timing, execution-mode selection, pagination options, RESTlet execution, response mapping, and error formatting.
- `RecordChatService.ts` normalizes AI report, search, schema, and SuiteQL questions, trims chat history, sends the AI request through the gateway, and maps NetSuite LLM errors into UI-safe messages.
- `PerformanceMatrix.ts` maps execution metadata into grid rows.

Application services depend on gateway interfaces instead of direct NetSuite modules.

## Infrastructure

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/infrastructure`

Responsibilities:

- `NetSuiteRestletQueryGateway.ts` resolves the RESTlet URL through `N/url`.
- It sends query execution and AI record chat requests to the RESTlet.
- It maps HTTP and RESTlet payloads into the gateway responses used by the application layer.

This is the only SPA layer that imports NetSuite integration modules.

## Presentation

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/presentation`

Responsibilities:

- Render the editor, hints, autocomplete, floating report/schema chat, performance matrix, and results.
- Convert view data into UIF component inputs such as `DataGrid` columns and `ArrayDataSource`.
- Keep the main workflow ordered as Query Editor, Result, Performance Matrix, then Hints and Autocomplete.
- Expose foldable secondary sections through UIF `Portlet` collapse controls.
- Stay passive: panels receive props and callbacks, but do not execute SuiteQL or own business rules.

## Composition Root

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/SuiteQLRunner.tsx`

Responsibilities:

- Own page state.
- Instantiate `QueryRunnerService` and `RecordChatService` with `NetSuiteRestletQueryGateway`.
- Call use cases and pass data into presentation components.

## RESTlet Structure

Path: `src/FileCabinet/SuiteScripts/com.netsuite.suiteqlrunner/SuiteQLRunnerRestlet.js`

The RESTlet remains one deployable SuiteScript file, but is organized into small functions:

- `normalizeExecutionRequest`
- `validateExecutionRequest`
- `executeDirectSuiteQL`
- `executePagedSuiteQL`
- `handleRecordChat`
- `collectRows`
- `successResponse`
- `failureResponse`
- telemetry helpers for server time and governance usage

This keeps SuiteScript deployment simple while preserving clean code boundaries.

`executeDirectSuiteQL` uses `N/query.runSuiteQL`. If the result size reaches the configured page size, the RESTlet treats it as likely capped and falls back to `executePagedSuiteQL`.

`executePagedSuiteQL` uses `N/query.runSuiteQLPaged` and fetches up to the requested max page count. The default max page count is `50`.

## AI Report And Schema Chat Flow

The SPA header includes an `AI Chat` action after `Format`. Clicking it toggles a floating chat panel below the header action area.

The chat request is sent to the same RESTlet with action `CHAT_RECORDS`. The RESTlet uses `N/llm.generateText` with a reporting/search/schema preamble, concise chat history, and source documents that describe standard record ID patterns, common SuiteQL join patterns, report/search guidance, and frequently used standard record families.

The assistant specializes in reports, saved searches, standard NetSuite record type IDs, SuiteQL source tables, transaction type codes, common standard fields, joins, table relationships, and schema patterns. It can still answer broader NetSuite, SuiteQL, SuiteScript, SDF, analytics, and reporting questions when useful. Account-specific custom records, custom fields, and feature-dependent schema details should still be verified in the target account.
