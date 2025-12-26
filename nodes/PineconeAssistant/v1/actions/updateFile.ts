import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from "n8n-workflow";
import { AssistantData, deleteFilesByIds, getFileIdsByExternalFileId, uploadFile } from "../genericFunctions";

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {

    const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;
	const inputDataFieldName = this.getNodeParameter('inputDataFieldName', index) as string;

	// get file id to delete by external file id metadata
	const externalFileId = this.getNodeParameter('externalFileId', index) as string;
	if (!externalFileId) {
        throw new NodeOperationError(this.getNode(), 'External file ID is required to update a file.');
	}

	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;
	const sourceTag = additionalFields?.sourceTag as string | undefined;

    const fileIds = await getFileIdsByExternalFileId.call(this, assistantName, assistantHostUrl, externalFileId, sourceTag);

    // delete files by id
	await deleteFilesByIds.call(this, assistantName, assistantHostUrl, fileIds, sourceTag);

    // upload updated file
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
