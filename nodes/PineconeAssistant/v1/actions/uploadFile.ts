import { type IExecuteFunctions, type IDataObject, type INodeExecutionData, NodeOperationError } from 'n8n-workflow';

import { type AssistantData, uploadFile } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;
	const inputDataFieldName = this.getNodeParameter('inputDataFieldName', index) as string;
	
	const externalFileId = this.getNodeParameter('externalFileId', index) as string;
	if (!externalFileId) {
		throw new NodeOperationError(this.getNode(), 'An external file ID is required to upload a file.');
	}
	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;
	const sourceTag = additionalFields?.sourceTag as string | undefined;

	const responseData = await uploadFile.call(
		this,
		assistantName,
		assistantHostUrl,
		externalFileId,
		additionalFields,
		index,
		inputDataFieldName,
		sourceTag,
	);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}
