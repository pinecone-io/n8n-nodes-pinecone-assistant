import { type IExecuteFunctions, type IDataObject, type INodeExecutionData } from 'n8n-workflow';

import { getFiles, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {	
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;

	// Handle additional fields - metadata
	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;
	let metadataFilter: IDataObject | undefined;
	if (additionalFields && additionalFields.metadataFilter) {
		metadataFilter = additionalFields.metadataFilter as IDataObject;
	}
	
	const responseData = await getFiles.call(this, assistantName, assistantHostUrl, metadataFilter);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}