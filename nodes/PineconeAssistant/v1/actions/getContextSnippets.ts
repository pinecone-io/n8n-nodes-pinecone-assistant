import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';

import { apiRequest, constructMetadataValues, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;

	const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'POST';
	const endpoint = `chat/${assistantName}/context`;
	
    const query = this.getNodeParameter('query', index) as string;
	if (!query || query.trim() === '') {
		throw new NodeOperationError(this.getNode(), 'Query parameter is required and cannot be empty', {
			itemIndex: index,
		});
	}

	// Handle additional fields
	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;
	
	// Only one of metadataFilter or advancedMetadataFilter can be set, not both
	if (additionalFields?.metadataFilter && additionalFields?.advancedMetadataFilter) {
		throw new NodeOperationError(
			this.getNode(),
			'Only one of metadataFilter or advancedMetadataFilter can be set, not both',
			{ itemIndex: index },
		);
	}

	const topK = additionalFields?.topK as number | undefined;
	const snippetSize = additionalFields?.snippetSize as number | undefined;

	// Simple metadata filter
	let metadataFilter: IDataObject | undefined;
	if (additionalFields?.metadataFilter) {
		metadataFilter = additionalFields.metadataFilter as IDataObject;
		
		const filterValues = constructMetadataValues(metadataFilter);
		if (filterValues !== null) {
			body.filter = filterValues;
		}
	}

	// Advanced metadata filter
	if (additionalFields?.advancedMetadataFilter) {
		let advancedMetadataFilter: IDataObject;
		const filterValue = additionalFields.advancedMetadataFilter;

		try {
			advancedMetadataFilter = jsonParse<IDataObject>(filterValue as string);
		} catch (parseError) {
			throw new NodeOperationError(this.getNode(), `Invalid JSON in advancedMetadataFilter: ${parseError.message}. Please ensure it is valid JSON.`, { itemIndex: index });
		}
		
		body.filter = advancedMetadataFilter;
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

