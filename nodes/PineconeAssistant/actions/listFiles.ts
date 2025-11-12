import { type IExecuteFunctions, type IDataObject, type INodeExecutionData } from 'n8n-workflow';

import { apiRequest, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {	
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;
	
    const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'GET';
	const endpoint = `files/${assistantName}`;

	const responseData = await apiRequest.call(this, requestMethod, assistantHostUrl, endpoint, body, qs);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}

