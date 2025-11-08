import {
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type IHttpRequestMethods,
	type ILoadOptionsFunctions,
	type IHttpRequestOptions
} from 'n8n-workflow';

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
		json: true,
        headers: {
            'X-Pinecone-API-Version': '2025-04',
            'User-Agent': 'source_tag=n8n:n8n_nodes_pinecone_assistant',
		},
	};
    
	if (method === 'GET') {
        delete options.body;
	}
    this.logger.debug(`Making API request to Pinecone: ${JSON.stringify(options)}`);

    return await this.helpers.httpRequestWithAuthentication.call(this, 'pineconeAssistantApi', options);
}