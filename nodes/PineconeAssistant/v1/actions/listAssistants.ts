import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';

import { apiRequest } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'GET';
	const endpoint = 'assistants';
	const baseUrl = 'https://api.pinecone.io';

	// Handle additional fields
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
	const sourceTag = additionalFields?.sourceTag as string | undefined;

	const responseData = await apiRequest.call(this, requestMethod, baseUrl, endpoint, body, qs, sourceTag);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}

