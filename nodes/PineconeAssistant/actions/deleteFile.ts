import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from "n8n-workflow";
import { apiRequest, AssistantData, getFileIdsByExternalFileId} from "../genericFunctions";

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {

    const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;

	// get file id to delete by external file id metadata
	const externalFileId = this.getNodeParameter('externalFileId', index) as string;
	if (!externalFileId) {
        throw new NodeOperationError(this.getNode(), 'External file ID is required to update a file.');
	}
    
    const fileIds = await getFileIdsByExternalFileId.call(this, assistantName, assistantHostUrl, externalFileId);
	
    if (fileIds.length === 0) {
        throw new NodeOperationError(this.getNode(), `File with external file ID ${externalFileId} not found.`);
    }
    
    // delete files by id
	const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'DELETE';
	for (const fileId of fileIds) {
		const endpoint = `files/${assistantName}/${fileId}`;
		await apiRequest.call(this, requestMethod, assistantHostUrl, endpoint, body, qs);
	}
    return this.helpers.returnJsonArray([{ json: { deleted: true } }]);
}

