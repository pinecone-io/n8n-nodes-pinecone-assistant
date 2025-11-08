import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';

import { apiRequest } from './genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const assistantHostUrl = this.getNodeParameter('assistantHostUrl', index) as string;
    // TODO fix this
    const assistantName = 'n8n-assistant';
    const query = this.getNodeParameter('query', index) as string;
    
	const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'POST';
	const endpoint = `chat/${assistantName}/context`;

    body.query = query;
    // body.top_k = 1;
    // body.snippet_size = 512;

	const responseData = await apiRequest.call(this, requestMethod, assistantHostUrl, endpoint, body, qs);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}
