# Operations

## Intended Users

SuiteQL Runner is intended for trusted NetSuite administrators, developers, technical consultants, support engineers, and analysts who already have permission to inspect account data.

It should not be exposed as a broad reporting portal.

## Running Queries

1. Enter SuiteQL in the editor.
2. Use Format to normalize keyword casing and clause layout.
3. Review hints for likely SuiteQL or Oracle SQL issues.
4. Choose `runSuiteQLPaged` or `runSuiteQL`.
5. Set rows per page and max pages.
6. Run SuiteQL.
7. Review the result grid and performance matrix.

Hints are advisory. They never disable the Run button.

## Performance Matrix

The app records:

- Client validation time.
- Browser-to-RESTlet request latency.
- RESTlet server execution time.
- Execution mode selected.
- Query API actually used.
- Whether direct mode automatically fell back to paged execution.
- Total NetSuite result count.
- Returned row count.
- Whether the result was truncated by the page cap.
- Columns returned.
- Pages available and fetched.
- RESTlet script usage consumed.
- HTTP status.

These values help diagnose whether slowness is caused by query execution, network latency, or oversized results.

## Query Pagination

The UI defaults to `runSuiteQLPaged`, `1000` rows per page, and `50` pages.

The RESTlet enforces the same pagination caps so users cannot bypass the UI by editing the request payload.

Direct `runSuiteQL` mode is available for smaller queries. When direct execution returns at least the configured page size, the RESTlet automatically re-runs the query with `runSuiteQLPaged` to paginate longer result sets.

## Troubleshooting

If a query fails:

- Check the Result panel for the NetSuite error name, message, and stack.
- Run Analyze to look for syntax hints.
- Simplify the query and add joins or predicates back gradually.
- Reduce rows per page or max pages for expensive queries.
- Check RESTlet execution logs if the UI only shows a generic network error.

If deployment fails:

- Confirm SuiteCloud CLI authentication.
- Confirm publisher ID and SuiteApp IDs are valid for the target account.
- Run `npm run bundle` before validation.
- Review SDF object IDs and File Cabinet paths for mismatches.
