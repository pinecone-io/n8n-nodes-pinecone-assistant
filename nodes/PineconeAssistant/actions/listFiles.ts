import { type IExecuteFunctions, type IDataObject, type INodeExecutionData } from 'n8n-workflow';

import { getFiles, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {	
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;
	
	const responseData = await getFiles.call(this, assistantName, assistantHostUrl);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}

