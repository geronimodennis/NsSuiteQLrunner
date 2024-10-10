/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/log', 'N/query', 'N/runtime'], (log, query, runtime) => {
  const DEFAULT_PAGE_SIZE = 1000;
  const DEFAULT_MAX_ROWS = 1000;
  const HARD_MAX_ROWS = 5000;

  function get() {
    return {
      ok: true,
      service: 'SuiteQL Runner RESTlet',
      version: '1.0.0'
    };
  }

  function post(requestBody) {
    const context = startExecutionContext();

    try {
      const request = normalizeExecutionRequest(requestBody);
      const validationError = validateExecutionRequest(request);

      if (validationError) {
        return failureResponse(validationError.code, validationError.message, context);
      }

      return executeSuiteQL(request, context);
    } catch (error) {
      log.error({
        title: 'SuiteQL Runner execution failed',
        details: error
      });

      return failureResponse(
        error && error.name ? error.name : 'SUITEQL_EXECUTION_ERROR',
        error && error.message ? error.message : String(error),
        context,
        error
      );
    }
  }

  function executeSuiteQL(request, context) {
    const pagedData = query.runSuiteQLPaged({
      query: request.suiteql,
      params: request.params,
      pageSize: request.pageSize
    });
    const pageResult = collectRows(pagedData, request.maxRows);
    const columns = extractColumns(pageResult.rows);

    return successResponse({
      request,
      pagedData,
      rows: pageResult.rows,
      columns,
      pagesFetched: pageResult.pagesFetched,
      context
    });
  }

  function normalizeExecutionRequest(requestBody) {
    const payload = normalizePayload(requestBody);

    return {
      suiteql: String(payload.query || payload.q || '').trim(),
      params: Array.isArray(payload.params) ? payload.params : [],
      pageSize: clampNumber(payload.pageSize, 5, DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE),
      maxRows: clampNumber(payload.maxRows, 1, HARD_MAX_ROWS, DEFAULT_MAX_ROWS)
    };
  }

  function validateExecutionRequest(request) {
    if (!request.suiteql) {
      return {
        code: 'EMPTY_QUERY',
        message: 'Enter a SuiteQL query before executing.'
      };
    }

    return null;
  }

  function collectRows(pagedData, maxRows) {
    const rows = [];
    let pagesFetched = 0;

    for (let i = 0; i < pagedData.pageRanges.length && rows.length < maxRows; i += 1) {
      const page = pagedData.fetch({index: pagedData.pageRanges[i].index});
      const mappedRows = page.data.asMappedResults();
      pagesFetched += 1;

      for (let j = 0; j < mappedRows.length && rows.length < maxRows; j += 1) {
        rows.push(mappedRows[j]);
      }
    }

    return {
      rows,
      pagesFetched
    };
  }

  function successResponse(args) {
    const usageAfter = getRemainingUsage();

    return {
      ok: true,
      rows: args.rows,
      columns: args.columns,
      meta: {
        serverExecutionMs: Date.now() - args.context.startedAt,
        resultCount: args.pagedData.count,
        returnedRows: args.rows.length,
        truncated: args.pagedData.count > args.rows.length,
        pageSize: args.request.pageSize,
        pagesAvailable: args.pagedData.pageRanges.length,
        pagesFetched: args.pagesFetched,
        maxRows: args.request.maxRows,
        columnCount: args.columns.length,
        queryLength: args.request.suiteql.length,
        usageBefore: args.context.usageBefore,
        usageAfter,
        usageConsumed: usageDelta(args.context.usageBefore, usageAfter)
      }
    };
  }

  function failureResponse(code, message, context, error) {
    const usageAfter = getRemainingUsage();

    return {
      ok: false,
      rows: [],
      columns: [],
      error: {
        code,
        name: error && error.name ? error.name : code,
        message,
        stack: error && error.stack ? error.stack : null
      },
      meta: {
        serverExecutionMs: Date.now() - context.startedAt,
        resultCount: 0,
        returnedRows: 0,
        truncated: false,
        usageBefore: context.usageBefore,
        usageAfter,
        usageConsumed: usageDelta(context.usageBefore, usageAfter)
      }
    };
  }

  function normalizePayload(requestBody) {
    if (!requestBody) {
      return {};
    }

    if (typeof requestBody === 'string') {
      return JSON.parse(requestBody);
    }

    return requestBody;
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  function extractColumns(rows) {
    const names = {};

    rows.forEach((row) => {
      Object.keys(row || {}).forEach((name) => {
        names[name] = true;
      });
    });

    return Object.keys(names);
  }

  function startExecutionContext() {
    return {
      startedAt: Date.now(),
      usageBefore: getRemainingUsage()
    };
  }

  function usageDelta(before, after) {
    return before === null || after === null ? null : before - after;
  }

  function getRemainingUsage() {
    try {
      return runtime.getCurrentScript().getRemainingUsage();
    } catch (error) {
      return null;
    }
  }

  return {
    get,
    post
  };
});

