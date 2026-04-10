import * as url from 'N/url';
import {
  GatewayExecutionResponse,
  GatewayRecordChatResponse,
  QueryExecutionRequest,
  QueryRunnerGateway,
  RecordChatGateway,
  RecordChatRequest
} from '../domain/models';

const RESTLET_SCRIPT_ID = 'customscript_nsqlr_restlet';
const RESTLET_DEPLOYMENT_ID = 'customdeploy_nsqlr_restlet';

export class NetSuiteRestletQueryGateway implements QueryRunnerGateway, RecordChatGateway {
  async execute(request: QueryExecutionRequest): Promise<GatewayExecutionResponse> {
    const response = await fetch(resolveRestletUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...request,
        action: 'RUN_SUITEQL'
      })
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

  async askRecordQuestion(request: RecordChatRequest): Promise<GatewayRecordChatResponse> {
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
      answer: payload.answer || '',
      messages: payload.messages || [],
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
