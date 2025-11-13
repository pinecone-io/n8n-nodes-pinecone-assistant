import {
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type IHttpRequestMethods,
	type ILoadOptionsFunctions,
	type IHttpRequestOptions
} from 'n8n-workflow';

export interface AssistantData {
	name: string;
	host: string;
}

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
): Promise<unknown> {
	query = query || {};
	const options: IHttpRequestOptions = {
        method,
		body,
		qs: query,
		url: `${baseUrl}/assistant/${endpoint}`,
        headers: {
            'X-Pinecone-API-Version': '2025-04',
            'User-Agent': 'source_tag=n8n:n8n_nodes_pinecone_assistant',
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
    this.logger.debug(`Making API request to Pinecone: ${JSON.stringify(options)}`);

    return await this.helpers.httpRequestWithAuthentication.call(this, 'pineconeAssistantApi', options);
}

export async function getFiles(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions, assistantName: string, assistantHostUrl: string, metadataFilter: IDataObject | undefined) {
	let endpoint = `files/${assistantName}`;
	this.logger.debug(`Metadata filter: ${JSON.stringify(metadataFilter)}`);
	// Filter by metadata
	if (metadataFilter && metadataFilter.metadataFilterValues) {
		const values = metadataFilter.metadataFilterValues as IDataObject[] || [];

		this.logger.debug(`Values: ${JSON.stringify(values)}`);
		
		// Only add filter if there are actual values to filter by
		if (values.length > 0) {
			const metadataFilterValues = values.reduce(
				(acc, value) => Object.assign(acc, { [`${value.key}`]: value.value }),
				{} as IDataObject,
			);

			this.logger.debug(`Metadata filter values: ${JSON.stringify(metadataFilterValues)}`);
			
			endpoint += `?filter=${encodeURIComponent(JSON.stringify(metadataFilterValues))}`;
			this.logger.debug(`Endpoint: ${endpoint}`);
		}
	}

	return await apiRequest.call(this, 'GET', assistantHostUrl, endpoint, {});
}

export async function getFileIdsByExternalFileId(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions, assistantName: string, assistantHostUrl: string, externalFileId: string): Promise<string[]> {
	const {files} = await getFiles.call(this, assistantName, assistantHostUrl, { metadataFilterValues: [{ key: 'external_file_id', value: externalFileId }] }) as { files: IDataObject[] };

	return files.map(file => file.id as string);
}