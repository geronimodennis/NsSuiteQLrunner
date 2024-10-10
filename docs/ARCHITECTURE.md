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

- Shared models such as query hints, completion items, and execution responses.
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
- `PerformanceMatrix.ts` maps execution metadata into grid rows.

Application services depend on gateway interfaces instead of direct NetSuite modules.

## Infrastructure

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/infrastructure`

Responsibilities:

- `NetSuiteRestletQueryGateway.ts` resolves the RESTlet URL through `N/url`.
- It sends the query execution request to the RESTlet.
- It maps HTTP and RESTlet payloads into the gateway response used by the application layer.

This is the only SPA layer that imports NetSuite integration modules.

## Presentation

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/presentation`

Responsibilities:

- Render the editor, hints, autocomplete, performance matrix, and results.
- Convert view data into UIF component inputs such as `DataGrid` columns and `ArrayDataSource`.
- Stay passive: panels receive props and callbacks, but do not execute SuiteQL or own business rules.

## Composition Root

Path: `src/SuiteApps/com.netsuite.suiteqlrunner/suiteqlrunner/SuiteQLRunner.tsx`

Responsibilities:

- Own page state.
- Instantiate `QueryRunnerService` with `NetSuiteRestletQueryGateway`.
- Call use cases and pass data into presentation components.

## RESTlet Structure

Path: `src/FileCabinet/SuiteScripts/com.netsuite.suiteqlrunner/SuiteQLRunnerRestlet.js`

The RESTlet remains one deployable SuiteScript file, but is organized into small functions:

- `normalizeExecutionRequest`
- `validateExecutionRequest`
- `executeDirectSuiteQL`
- `executePagedSuiteQL`
- `collectRows`
- `successResponse`
- `failureResponse`
- telemetry helpers for server time and governance usage

This keeps SuiteScript deployment simple while preserving clean code boundaries.

`executeDirectSuiteQL` uses `N/query.runSuiteQL`. If the result size reaches the configured page size, the RESTlet treats it as likely capped and falls back to `executePagedSuiteQL`.

`executePagedSuiteQL` uses `N/query.runSuiteQLPaged` and fetches up to the requested max page count. The default max page count is `50`.
