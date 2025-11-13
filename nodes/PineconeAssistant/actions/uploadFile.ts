import { type IExecuteFunctions, type IDataObject, type INodeExecutionData, NodeOperationError } from 'n8n-workflow';

import { apiRequest, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;
	const inputDataFieldName = this.getNodeParameter('inputDataFieldName', index) as string;
	
	const qs = {} as IDataObject;
	const requestMethod = 'POST';
	let endpoint = `files/${assistantName}`;
	
	// Handle additional fields - metadata
	let metadataValues = {} as IDataObject;
	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;
	if (additionalFields && additionalFields.metadata) {
		const values =
		((additionalFields.metadata as IDataObject).metadataValues as IDataObject[]) || [];
		
		metadataValues = values.reduce(
			(acc, value) => Object.assign(acc, { [`${value.key}`]: value.value }),
			{} as IDataObject,
		);
	}
	
	// Add external file id to metadata
	const externalFileId = this.getNodeParameter('externalFileId', index) as string;
	if (!externalFileId) {
		throw new NodeOperationError(this.getNode(), 'An external file ID is required to upload a file.');
	}
	metadataValues.external_file_id = externalFileId;
	endpoint += `?metadata=${encodeURIComponent(JSON.stringify(metadataValues))}`;

	// Get binary data from input
	const binaryData = this.helpers.assertBinaryData(index, inputDataFieldName);
	const fileBuffer = await this.helpers.getBinaryDataBuffer(index, inputDataFieldName);
	const fileBlob = new Blob([fileBuffer], {type: binaryData.mimeType})
	const formData = new FormData();
	formData.append('file', fileBlob, binaryData.fileName)
	const body = formData;
	
	const responseData = await apiRequest.call(this, requestMethod, assistantHostUrl, endpoint, body, qs);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}

