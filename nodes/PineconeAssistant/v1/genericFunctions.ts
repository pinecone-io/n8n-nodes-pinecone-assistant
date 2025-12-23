import {
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type IHttpRequestMethods,
	type ILoadOptionsFunctions,
	type IHttpRequestOptions
} from 'n8n-workflow';

import * as packageInfo from '../version.json';

export interface AssistantData {
	name: string;
	host: string;
}

export function normalizeSourceTag(sourceTag?: string): string {
	sourceTag = sourceTag || packageInfo.defaultSourceTag;
  
	// Prefix with "n8n:" if not already present
	if (!sourceTag.startsWith('n8n:')) {
		sourceTag = `n8n:${sourceTag}`;
	}

	/**
	 * normalize sourceTag
	 * 1. Lowercase
	 * 2. Limit charset to [a-z0-9_ :]
	 * 3. Trim left/right spaces
	 * 4. Condense multiple spaces to one, and replace with underscore
	 */
	return sourceTag
	  .toLowerCase()
	  .replace(/[^a-z0-9_ :]/g, '')
	  .trim()
	  .replace(/[ ]+/g, '_');
  };

/**
 * Check if body contains file data (for multipart/form-data)
 */
function hasFileData(body: object): boolean {
	if (!body || typeof body !== 'object') {
		return false;
	}
	
	for (const value of Object.values(body)) {
		if (value && typeof value === 'object') {
			// Check if it's a file object with value property containing Buffer
			// Format: { fieldName: { value: Buffer, options: { filename: string, contentType?: string } } }
			if ('value' in value && Buffer.isBuffer(value.value)) {
				return true;
			}
			// Also check old format: { fieldName: { data: Buffer, filename: string, contentType?: string } }
			if ('data' in value && Buffer.isBuffer(value.data)) {
				return true;
			}
			// Also check if value is directly a Buffer
			if (Buffer.isBuffer(value)) {
				return true;
			}
			// Recursively check nested objects
			if (hasFileData(value)) {
				return true;
			}
		} else if (Buffer.isBuffer(value)) {
			// Direct Buffer value
			return true;
		}
	}
	return false;
}

/**
 * Make an API request to Pinecone Assistant
 */
export async function apiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
    baseUrl: string,
	endpoint: string,
	body: object,
	query?: IDataObject,
	sourceTag?: string,
): Promise<unknown> {
	query = query || {};
	const normalizedSourceTag = normalizeSourceTag(sourceTag);

	const options: IHttpRequestOptions = {
        method,
		body,
		qs: query,
		url: `${baseUrl}/assistant/${endpoint}`,
        headers: {
            'X-Pinecone-API-Version': '2025-10',
			'User-Agent': `${packageInfo.name} v${packageInfo.version}; source_tag=${normalizedSourceTag}`,
		},
	};
	
    const isMultipart = hasFileData(body);
	// For multipart/form-data, don't set json and don't manually set Content-Type
	// n8n's httpRequestWithAuthentication will automatically detect the body structure and set Content-Type with boundary
	if (!isMultipart) {
		options.json = true;
	}
	 
	if (method === 'GET') {
        delete options.body;
	}

	return await this.helpers.httpRequestWithAuthentication.call(this, 'pineconeAssistantApi', options);
}

export async function getFiles(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions, assistantName: string, assistantHostUrl: string, filterValues: IDataObject | null | undefined, sourceTag?: string) {
	let endpoint = `files/${assistantName}`;

	if (filterValues && Object.keys(filterValues).length > 0) {
		endpoint += `?filter=${encodeURIComponent(JSON.stringify(filterValues))}`;
	}

	return await apiRequest.call(this, 'GET', assistantHostUrl, endpoint, {}, undefined, sourceTag);
}

export async function getFileIdsByExternalFileId(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions, assistantName: string, assistantHostUrl: string, externalFileId: string, sourceTag?: string): Promise<string[]> {
	const filterValues = { external_file_id: externalFileId };
	const {files} = await getFiles.call(this, assistantName, assistantHostUrl, filterValues, sourceTag) as { files: IDataObject[] };

	return files.map(file => file.id as string);
}

/**
 * Delete files by their IDs
 */
export async function deleteFilesByIds(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	assistantName: string,
	assistantHostUrl: string,
	fileIds: string[],
	sourceTag?: string,
): Promise<void> {
	const body = {} as IDataObject;
	const qs = {} as IDataObject;
	const requestMethod = 'DELETE';
	for (const fileId of fileIds) {
		const endpoint = `files/${assistantName}/${fileId}`;
		await apiRequest.call(this, requestMethod, assistantHostUrl, endpoint, body, qs, sourceTag);
	}
}

/**
 * Upload a file to Pinecone Assistant with metadata
 */
export async function uploadFile(
	this: IExecuteFunctions,
	assistantName: string,
	assistantHostUrl: string,
	externalFileId: string,
	additionalFields: IDataObject | undefined,
	index: number,
	inputDataFieldName: string,
	sourceTag?: string,
): Promise<unknown> {
	const qs = {} as IDataObject;
	const requestMethod = 'POST';
	let endpoint = `files/${assistantName}`;

	// Handle additional fields - metadata
	let metadataValues = {} as IDataObject;
	if (additionalFields?.metadata) {
		const constructed = constructMetadataValues(additionalFields.metadata as IDataObject);
		if (constructed) {
			metadataValues = constructed;
		}
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

	return await apiRequest.call(this, requestMethod, assistantHostUrl, endpoint, body, qs, sourceTag);
}

/**
 * Build metadata values object
 * Returns null if no metadata values are provided
 */
export function constructMetadataValues(metadata: IDataObject | undefined): IDataObject | null {
	if (!metadata || !metadata.metadataValues) {
		return null;
	}

	const values = metadata.metadataValues as IDataObject[] || [];
	
	// Only add metadata values if there are actual values to add
	if (values.length === 0) {
		return null;
	}

	const metadataValues = values.reduce(
		(acc, value) => Object.assign(acc, { [`${value.key}`]: value.value }),
		{} as IDataObject,
	);
	
	return metadataValues;
}