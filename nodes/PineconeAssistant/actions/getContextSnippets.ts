import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { apiRequest, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;
	
    const query = this.getNodeParameter('query', index) as string;
    
	if (!query || query.trim() === '') {
		throw new NodeOperationError(this.getNode(), 'Query parameter is required and cannot be empty', {
			itemIndex: index,
		});
	}
    
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

