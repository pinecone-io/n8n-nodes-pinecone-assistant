import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { apiRequest, constructMetadataValues, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;

	const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'POST';
	const endpoint = `chat/${assistantName}/context`;
	
    const query = this.getNodeParameter('query', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;
	const topK = additionalFields?.topK as number | undefined;
	const snippetSize = additionalFields?.snippetSize as number | undefined;

	if (!query || query.trim() === '') {
		throw new NodeOperationError(this.getNode(), 'Query parameter is required and cannot be empty', {
			itemIndex: index,
		});
	}

	// Handle additional fields - metadata
	let metadataFilter: IDataObject | undefined;
	if (additionalFields?.metadataFilter) {
		metadataFilter = additionalFields.metadataFilter as IDataObject;
		
		const filterValues = constructMetadataValues(metadataFilter);
		if (filterValues !== null) {
			body.filter = filterValues;
		}
	}

    body.query = query;
	if (topK !== undefined && topK !== null) {
		body.top_k = topK;
	}
	if (snippetSize !== undefined && snippetSize !== null) {
		body.snippet_size = snippetSize;
	}

	const responseData = await apiRequest.call(this, requestMethod, assistantHostUrl, endpoint, body, qs);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}

