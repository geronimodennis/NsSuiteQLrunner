/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/log', 'N/query', 'N/runtime'], (log, query, runtime) => {
  const DEFAULT_EXECUTION_MODE = 'RUN_SUITEQL_PAGED';
  const DEFAULT_MAX_PAGES = 50;
  const DEFAULT_PAGE_SIZE = 1000;
  const HARD_MAX_PAGES = 100;
  const HARD_MAX_PAGE_SIZE = 1000;
  const MIN_PAGE_SIZE = 5;

  function get() {
    return {
      ok: true,
      service: 'SuiteQL Runner RESTlet',
      version: '1.1.1',
      executionModes: ['RUN_SUITEQL', 'RUN_SUITEQL_PAGED']
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

      return request.executionMode === 'RUN_SUITEQL'
        ? executeDirectSuiteQL(request, context)
        : executePagedSuiteQL(request, context, {autoPagedFallback: false, directRowsBeforeFallback: null});
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

  function executeDirectSuiteQL(request, context) {
    const resultSet = query.runSuiteQL({
      query: request.suiteql,
      params: request.params
    });
    const rows = resultSet.asMappedResults();

    if (rows.length >= request.pageSize) {
      return executePagedSuiteQL(request, context, {
        autoPagedFallback: true,
        directRowsBeforeFallback: rows.length
      });
    }

    const columns = extractColumns(rows);

    return successResponse({
      request,
      queryApi: 'runSuiteQL',
      rows,
      columns,
      resultCount: rows.length,
      pagesAvailable: 1,
      pagesFetched: 1,
      truncated: false,
      autoPagedFallback: false,
      directRowsBeforeFallback: null,
      context
    });
  }

  function executePagedSuiteQL(request, context, fallbackInfo) {
    const pagedData = query.runSuiteQLPaged({
      query: request.suiteql,
      params: request.params,
      pageSize: request.pageSize
    });
    const pageResult = collectRows(pagedData, request.maxPages);
    const columns = extractColumns(pageResult.rows);

    return successResponse({
      request,
      queryApi: 'runSuiteQLPaged',
      rows: pageResult.rows,
      columns,
      resultCount: pagedData.count,
      pagesAvailable: pagedData.pageRanges.length,
      pagesFetched: pageResult.pagesFetched,
      truncated: pagedData.pageRanges.length > pageResult.pagesFetched || pagedData.count > pageResult.rows.length,
      autoPagedFallback: fallbackInfo.autoPagedFallback,
      directRowsBeforeFallback: fallbackInfo.directRowsBeforeFallback,
      context
    });
  }

  function normalizeExecutionRequest(requestBody) {
    const payload = normalizePayload(requestBody);

    return {
      executionMode: normalizeExecutionMode(payload.executionMode || payload.mode),
      suiteql: String(payload.query || payload.q || '').trim(),
      params: Array.isArray(payload.params) ? payload.params : [],
      pageSize: clampNumber(payload.pageSize, MIN_PAGE_SIZE, HARD_MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE),
      maxPages: clampNumber(payload.maxPages || payload.pages, 1, HARD_MAX_PAGES, DEFAULT_MAX_PAGES)
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

  function collectRows(pagedData, maxPages) {
    const rows = [];
    let pagesFetched = 0;
    const pageLimit = Math.min(maxPages, pagedData.pageRanges.length);

    for (let i = 0; i < pageLimit; i += 1) {
      const page = pagedData.fetch({index: pagedData.pageRanges[i].index});
      const mappedRows = page.data.asMappedResults();
      pagesFetched += 1;

      for (let j = 0; j < mappedRows.length; j += 1) {
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
        executionMode: args.request.executionMode,
        queryApi: args.queryApi,
        autoPagedFallback: args.autoPagedFallback,
        directRowsBeforeFallback: args.directRowsBeforeFallback,
        serverExecutionMs: Date.now() - args.context.startedAt,
        resultCount: args.resultCount,
        returnedRows: args.rows.length,
        truncated: args.truncated,
        pageSize: args.request.pageSize,
        pagesAvailable: args.pagesAvailable,
        pagesFetched: args.pagesFetched,
        maxPages: args.request.maxPages,
        rowCapacity: args.request.maxPages * args.request.pageSize,
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

  function normalizeExecutionMode(value) {
    return value === 'RUN_SUITEQL' || value === 'RUN_SUITEQL_PAGED' ? value : DEFAULT_EXECUTION_MODE;
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
