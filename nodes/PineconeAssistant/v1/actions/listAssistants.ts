import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';

import { apiRequest } from '../genericFunctions';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {	
	const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'GET';
	const endpoint = 'assistants';
	const baseUrl = 'https://api.pinecone.io';

	const responseData = await apiRequest.call(this, requestMethod, baseUrl, endpoint, body, qs);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}

