/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/llm', 'N/log', 'N/query', 'N/runtime'], (llm, log, query, runtime) => {
  const DEFAULT_EXECUTION_MODE = 'RUN_SUITEQL_PAGED';
  const DEFAULT_MAX_PAGES = 50;
  const DEFAULT_PAGE_SIZE = 1000;
  const HARD_MAX_PAGES = 100;
  const HARD_MAX_PAGE_SIZE = 1000;
  const MIN_PAGE_SIZE = 5;
  const MAX_CHAT_HISTORY = 12;
  const MAX_CHAT_MESSAGE_LENGTH = 4000;

  const RECORD_CHAT_PREAMBLE = [
    'You are the NetSuite SuiteQL Runner record schema assistant.',
    'Answer questions about NetSuite record type IDs, SuiteScript record IDs, SuiteQL table names, transaction type codes, standard field IDs, sublists, joins, and schema patterns.',
    'Use the supplied documents first. If a question needs account-specific custom records, custom fields, or enabled-feature metadata, say that the user must verify it in their account Records Catalog, Records Browser, or Schema Browser.',
    'Distinguish record type ID, SuiteQL table/source, transaction type code, and field ID when those differ.',
    'Keep answers concise and practical. Include sample SuiteQL only when it directly helps the question.'
  ].join(' ');

  const RECORD_SCHEMA_GUIDANCE = [
    'NetSuite ID patterns:',
    '- Standard record type IDs are lowercase SuiteScript IDs such as customer, vendor, invoice, salesorder, purchaseorder, journalentry, account, department, classification, location, subsidiary, and currency.',
    '- Custom record type IDs usually use customrecord_<scriptid>.',
    '- Custom field IDs usually use custbody_, custcol_, custentity_, custitem_, custrecord_, or custpage_ prefixes depending on placement.',
    '- Transaction records are often queried through the SuiteQL transaction table, with line data in transactionline.',
    '- Transaction type code values are not always the same as SuiteScript record type IDs. For example, invoice maps to transaction.type CustInvc and sales order maps to SalesOrd.',
    '- Internal ID means an individual record instance ID. Record type ID means the script/query identifier for the record family.',
    'Schema answer format:',
    '1. Record type ID.',
    '2. SuiteQL source table or join pattern.',
    '3. Important body fields and line fields.',
    '4. Transaction type code when relevant.',
    '5. Any account-specific caveat.'
  ].join('\n');

  const COMMON_RECORDS = [
    {
      id: 'transaction',
      name: 'Transaction',
      aliases: ['transactions', 'general transaction', 'transaction header'],
      suiteql: ['transaction', 'transactionline'],
      transactionType: '',
      fields: ['id', 'tranid', 'trandate', 'type', 'entity', 'mainline', 'status', 'memo', 'currency', 'subsidiary', 'createddate', 'lastmodifieddate'],
      notes: 'Use transaction for body/header fields and transactionline for line fields. Filter transactionline.mainline or transaction.mainline depending on query shape.'
    },
    {
      id: 'invoice',
      name: 'Invoice',
      aliases: ['customer invoice', 'custinvc'],
      suiteql: ['transaction', 'transactionline'],
      transactionType: 'CustInvc',
      fields: ['id', 'tranid', 'trandate', 'entity', 'status', 'duedate', 'terms', 'currency', 'foreigntotal', 'amountremaining', 'memo'],
      notes: 'SuiteScript record type ID is invoice. In SuiteQL, filter transaction.type for CustInvc when working from the transaction table.'
    },
    {
      id: 'salesorder',
      name: 'Sales Order',
      aliases: ['sales order', 'salesord'],
      suiteql: ['transaction', 'transactionline'],
      transactionType: 'SalesOrd',
      fields: ['id', 'tranid', 'trandate', 'entity', 'status', 'shipdate', 'salesrep', 'currency', 'foreigntotal', 'memo'],
      notes: 'SuiteScript record type ID is salesorder. In SuiteQL, filter transaction.type for SalesOrd.'
    },
    {
      id: 'purchaseorder',
      name: 'Purchase Order',
      aliases: ['purchase order', 'purchord', 'po'],
      suiteql: ['transaction', 'transactionline'],
      transactionType: 'PurchOrd',
      fields: ['id', 'tranid', 'trandate', 'entity', 'status', 'employee', 'currency', 'foreigntotal', 'memo'],
      notes: 'SuiteScript record type ID is purchaseorder. In SuiteQL, filter transaction.type for PurchOrd.'
    },
    {
      id: 'vendorbill',
      name: 'Vendor Bill',
      aliases: ['vendor bill', 'vendbill', 'bill'],
      suiteql: ['transaction', 'transactionline'],
      transactionType: 'VendBill',
      fields: ['id', 'tranid', 'trandate', 'entity', 'status', 'duedate', 'terms', 'currency', 'foreigntotal', 'amountremaining'],
      notes: 'SuiteScript record type ID is vendorbill. In SuiteQL, filter transaction.type for VendBill.'
    },
    {
      id: 'customerpayment',
      name: 'Customer Payment',
      aliases: ['customer payment', 'payment', 'custpymt'],
      suiteql: ['transaction'],
      transactionType: 'CustPymt',
      fields: ['id', 'tranid', 'trandate', 'entity', 'account', 'currency', 'paymentmethod', 'total', 'memo'],
      notes: 'Payment applications may require related transaction apply data and account-specific schema checks.'
    },
    {
      id: 'journalentry',
      name: 'Journal Entry',
      aliases: ['journal', 'journal entry', 'journalentry'],
      suiteql: ['transaction', 'transactionline'],
      transactionType: 'Journal',
      fields: ['id', 'tranid', 'trandate', 'subsidiary', 'currency', 'exchangerate', 'memo'],
      notes: 'Line detail is in transactionline with account, debit/credit amount fields, department, class, and location.'
    },
    {
      id: 'customer',
      name: 'Customer',
      aliases: ['client', 'customers'],
      suiteql: ['customer'],
      transactionType: '',
      fields: ['id', 'entityid', 'companyname', 'firstname', 'lastname', 'email', 'phone', 'subsidiary', 'currency', 'terms', 'datecreated', 'lastmodifieddate', 'isinactive'],
      notes: 'Customer is an entity record. Join transactions through transaction.entity = customer.id.'
    },
    {
      id: 'vendor',
      name: 'Vendor',
      aliases: ['vendors', 'supplier'],
      suiteql: ['vendor'],
      transactionType: '',
      fields: ['id', 'entityid', 'companyname', 'email', 'phone', 'subsidiary', 'currency', 'terms', 'datecreated', 'lastmodifieddate', 'isinactive'],
      notes: 'Vendor is an entity record. Join vendor transactions through transaction.entity = vendor.id.'
    },
    {
      id: 'employee',
      name: 'Employee',
      aliases: ['employees'],
      suiteql: ['employee'],
      transactionType: '',
      fields: ['id', 'entityid', 'firstname', 'lastname', 'email', 'supervisor', 'department', 'location', 'subsidiary', 'hiredate', 'isinactive'],
      notes: 'Employee can be referenced by transaction.employee, salesrep, supervisor, and owner fields depending on record.'
    },
    {
      id: 'contact',
      name: 'Contact',
      aliases: ['contacts'],
      suiteql: ['contact'],
      transactionType: '',
      fields: ['id', 'entityid', 'firstname', 'lastname', 'company', 'email', 'phone', 'title', 'datecreated', 'lastmodifieddate'],
      notes: 'Contact links to companies/entities through relationship tables in some account features.'
    },
    {
      id: 'item',
      name: 'Item',
      aliases: ['items', 'inventoryitem', 'serviceitem', 'noninventoryitem', 'assemblyitem'],
      suiteql: ['item'],
      transactionType: '',
      fields: ['id', 'itemid', 'displayname', 'type', 'isinactive', 'baseprice', 'cost', 'incomeaccount', 'assetaccount', 'expenseaccount', 'subsidiary'],
      notes: 'Specific SuiteScript item record type IDs include inventoryitem, serviceitem, noninventoryitem, assemblyitem, kititem, and other enabled item types.'
    },
    {
      id: 'account',
      name: 'Account',
      aliases: ['accounts', 'gl account', 'ledger account'],
      suiteql: ['account'],
      transactionType: '',
      fields: ['id', 'acctnumber', 'acctname', 'displayname', 'accttype', 'parent', 'currency', 'subsidiary', 'isinactive'],
      notes: 'Use BUILTIN.DF(account) when a display value is needed for account references in SuiteQL results.'
    },
    {
      id: 'department',
      name: 'Department',
      aliases: ['departments'],
      suiteql: ['department'],
      transactionType: '',
      fields: ['id', 'name', 'fullname', 'parent', 'subsidiary', 'isinactive'],
      notes: 'Department can appear on transaction bodies and lines depending on accounting preferences.'
    },
    {
      id: 'classification',
      name: 'Class',
      aliases: ['class', 'classification', 'classes'],
      suiteql: ['classification'],
      transactionType: '',
      fields: ['id', 'name', 'fullname', 'parent', 'subsidiary', 'isinactive'],
      notes: 'The UI label is Class, but the SuiteScript/SuiteQL ID is commonly classification.'
    },
    {
      id: 'location',
      name: 'Location',
      aliases: ['locations'],
      suiteql: ['location'],
      transactionType: '',
      fields: ['id', 'name', 'fullname', 'parent', 'subsidiary', 'isinactive'],
      notes: 'Location can appear on transaction bodies, lines, inventory assignments, and employee records.'
    },
    {
      id: 'subsidiary',
      name: 'Subsidiary',
      aliases: ['subsidiaries'],
      suiteql: ['subsidiary'],
      transactionType: '',
      fields: ['id', 'name', 'legalname', 'parent', 'country', 'currency', 'isinactive'],
      notes: 'Subsidiary is available in OneWorld accounts and controls many joins and record visibility rules.'
    },
    {
      id: 'currency',
      name: 'Currency',
      aliases: ['currencies'],
      suiteql: ['currency'],
      transactionType: '',
      fields: ['id', 'name', 'symbol', 'isbasecurrency', 'isinactive'],
      notes: 'Currency references commonly appear on transactions, entities, subsidiaries, and exchange rate logic.'
    }
  ];

  function get() {
    return {
      ok: true,
      service: 'SuiteQL Runner RESTlet',
      version: '1.2.0',
      actions: ['RUN_SUITEQL', 'CHAT_RECORDS'],
      executionModes: ['RUN_SUITEQL', 'RUN_SUITEQL_PAGED']
    };
  }

  function post(requestBody) {
    const context = startExecutionContext();
    let action = 'RUN_SUITEQL';

    try {
      const payload = normalizePayload(requestBody);
      action = normalizeAction(payload.action);

      if (action === 'CHAT_RECORDS') {
        return handleRecordChat(payload, context);
      }

      const request = normalizeExecutionRequest(payload);
      const validationError = validateExecutionRequest(request);

      if (validationError) {
        return failureResponse(validationError.code, validationError.message, context);
      }

      return request.executionMode === 'RUN_SUITEQL'
        ? executeDirectSuiteQL(request, context)
        : executePagedSuiteQL(request, context, {autoPagedFallback: false, directRowsBeforeFallback: null});
    } catch (error) {
      log.error({
        title: action === 'CHAT_RECORDS' ? 'SuiteQL Runner AI chat failed' : 'SuiteQL Runner execution failed',
        details: error
      });

      if (action === 'CHAT_RECORDS') {
        return chatFailureResponse(
          error && error.name ? error.name : 'AI_RECORD_CHAT_ERROR',
          error && error.message ? error.message : String(error),
          context,
          error
        );
      }

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

  function handleRecordChat(payload, context) {
    const request = normalizeRecordChatRequest(payload);
    const validationError = validateRecordChatRequest(request);

    if (validationError) {
      return chatFailureResponse(validationError.code, validationError.message, context);
    }

    const documents = buildRecordSchemaDocuments(request.message);
    const response = llm.generateText({
      preamble: RECORD_CHAT_PREAMBLE,
      prompt: request.message,
      chatHistory: toLlmChatHistory(request.history),
      documents,
      modelFamily: llm.ModelFamily.COHERE_COMMAND,
      modelParameters: {
        maxTokens: 1200,
        temperature: 0.1,
        topK: 3,
        topP: 0.7
      },
      timeout: 30000
    });
    const answer = String((response && response.text) || '').trim();

    return chatSuccessResponse({
      request,
      answer,
      response,
      documents,
      context
    });
  }

  function normalizeExecutionRequest(payload) {
    return {
      executionMode: normalizeExecutionMode(payload.executionMode || payload.mode),
      suiteql: String(payload.query || payload.q || '').trim(),
      params: Array.isArray(payload.params) ? payload.params : [],
      pageSize: clampNumber(payload.pageSize, MIN_PAGE_SIZE, HARD_MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE),
      maxPages: clampNumber(payload.maxPages || payload.pages, 1, HARD_MAX_PAGES, DEFAULT_MAX_PAGES)
    };
  }

  function normalizeRecordChatRequest(payload) {
    return {
      message: normalizeChatText(payload.message || payload.prompt || payload.question),
      history: normalizeChatHistory(payload.history)
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

  function validateRecordChatRequest(request) {
    if (!request.message) {
      return {
        code: 'EMPTY_RECORD_CHAT_MESSAGE',
        message: 'Enter a NetSuite record schema question before asking AI.'
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

  function chatSuccessResponse(args) {
    const usageAfter = getRemainingUsage();
    const llmUsage = (args.response && args.response.usage) || {};

    return {
      ok: true,
      answer: args.answer || 'No answer was returned by the NetSuite LLM module.',
      messages: [
        ...args.request.history,
        {
          role: 'user',
          text: args.request.message
        },
        {
          role: 'assistant',
          text: args.answer || 'No answer was returned by the NetSuite LLM module.'
        }
      ],
      meta: {
        serverExecutionMs: Date.now() - args.context.startedAt,
        llmModel: args.response && args.response.model ? args.response.model : null,
        promptTokens: valueOrNull(llmUsage.promptTokens),
        completionTokens: valueOrNull(llmUsage.completionTokens),
        totalTokens: valueOrNull(llmUsage.totalTokens),
        documentIds: args.documents.map((document) => document.id),
        citationCount: Array.isArray(args.response && args.response.citations) ? args.response.citations.length : 0,
        citations: normalizeCitations(args.response && args.response.citations),
        remainingFreeLlmUsage: getRemainingFreeLlmUsage(),
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

  function chatFailureResponse(code, message, context, error) {
    const usageAfter = getRemainingUsage();

    return {
      ok: false,
      answer: '',
      messages: [],
      error: {
        code,
        name: error && error.name ? error.name : code,
        message,
        stack: error && error.stack ? error.stack : null
      },
      meta: {
        serverExecutionMs: Date.now() - context.startedAt,
        remainingFreeLlmUsage: getRemainingFreeLlmUsage(),
        usageBefore: context.usageBefore,
        usageAfter,
        usageConsumed: usageDelta(context.usageBefore, usageAfter)
      }
    };
  }

  function buildRecordSchemaDocuments(message) {
    const records = selectRecordCatalog(message);

    return [
      {
        id: 'netsuite-record-id-patterns',
        data: RECORD_SCHEMA_GUIDANCE
      },
      {
        id: 'netsuite-common-record-catalog',
        data: formatRecordCatalog(records)
      },
      {
        id: 'netsuite-suiteql-join-patterns',
        data: [
          'Common SuiteQL patterns:',
          'transaction to customer: transaction.entity = customer.id.',
          'transaction to transactionline: transaction.id = transactionline.transaction.',
          'transactionline to item: transactionline.item = item.id.',
          'transactionline to account: transactionline.expenseaccount or transactionline.account references account.id depending on transaction and account feature context.',
          'display values: use BUILTIN.DF(field_reference) when the display name is needed instead of only the internal ID.',
          'mainline filters: transactions often need mainline = T for header rows or mainline = F for line rows, depending on whether the source is transaction or transactionline.'
        ].join('\n')
      }
    ];
  }

  function selectRecordCatalog(message) {
    const normalizedMessage = normalizeForMatch(message);
    const matches = COMMON_RECORDS.filter((record) => recordMatches(record, normalizedMessage));

    if (matches.length > 0) {
      return matches.slice(0, 8);
    }

    return COMMON_RECORDS.slice(0, 12);
  }

  function recordMatches(record, normalizedMessage) {
    const terms = [record.id, record.name, ...record.aliases, ...record.suiteql, record.transactionType].filter(Boolean);
    return terms.some((term) => normalizedMessage.indexOf(normalizeForMatch(term)) !== -1);
  }

  function formatRecordCatalog(records) {
    return records
      .map((record) =>
        [
          `Name: ${record.name}`,
          `Record type ID: ${record.id}`,
          `SuiteQL source: ${record.suiteql.join(', ')}`,
          `Transaction type code: ${record.transactionType || 'not applicable'}`,
          `Common fields: ${record.fields.join(', ')}`,
          `Notes: ${record.notes}`
        ].join('\n')
      )
      .join('\n\n');
  }

  function toLlmChatHistory(history) {
    return history.map((message) =>
      llm.createChatMessage({
        role: message.role === 'assistant' ? llm.ChatRole.CHATBOT : llm.ChatRole.USER,
        text: message.text
      })
    );
  }

  function normalizeChatHistory(history) {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
      .map((message) => ({
        role: message.role,
        text: normalizeChatText(message.text)
      }))
      .filter((message) => message.text.length > 0)
      .slice(-MAX_CHAT_HISTORY);
  }

  function normalizeChatText(value) {
    return String(value || '').trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
  }

  function normalizeCitations(citations) {
    if (!Array.isArray(citations)) {
      return [];
    }

    return citations.map((citation) => ({
      documentIds: Array.isArray(citation.documentIds) ? citation.documentIds : [],
      start: valueOrNull(citation.start),
      end: valueOrNull(citation.end),
      text: citation.text || ''
    }));
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

  function normalizeAction(value) {
    return String(value || '').toUpperCase() === 'CHAT_RECORDS' ? 'CHAT_RECORDS' : 'RUN_SUITEQL';
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

  function normalizeForMatch(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9_]+/g, ' ').trim();
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

  function valueOrNull(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function getRemainingUsage() {
    try {
      return runtime.getCurrentScript().getRemainingUsage();
    } catch (error) {
      return null;
    }
  }

  function getRemainingFreeLlmUsage() {
    try {
      return llm.getRemainingFreeUsage();
    } catch (error) {
      return null;
    }
  }

  return {
    get,
    post
  };
});
