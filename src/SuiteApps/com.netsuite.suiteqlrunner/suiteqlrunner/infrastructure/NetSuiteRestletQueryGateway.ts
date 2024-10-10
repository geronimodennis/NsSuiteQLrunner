import * as url from 'N/url';
import {GatewayExecutionResponse, QueryExecutionRequest, QueryRunnerGateway} from '../domain/models';

const RESTLET_SCRIPT_ID = 'customscript_nsqlr_restlet';
const RESTLET_DEPLOYMENT_ID = 'customdeploy_nsqlr_restlet';

export class NetSuiteRestletQueryGateway implements QueryRunnerGateway {
  async execute(request: QueryExecutionRequest): Promise<GatewayExecutionResponse> {
    const response = await fetch(resolveRestletUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    const payload = await response.json();

    return {
      ok: Boolean(payload.ok),
      rows: payload.rows || [],
      columns: payload.columns || [],
      meta: payload.meta || {},
      error: payload.error,
      httpStatus: response.status
    };
  }
}

function resolveRestletUrl() {
  return url.resolveScript({
    scriptId: RESTLET_SCRIPT_ID,
    deploymentId: RESTLET_DEPLOYMENT_ID,
    returnExternalUrl: false
  });
}

