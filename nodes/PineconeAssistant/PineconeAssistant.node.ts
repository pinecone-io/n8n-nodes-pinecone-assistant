import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { apiRequest, AssistantData } from './genericFunctions';
import { router } from './router';

export class PineconeAssistant implements INodeType { 
	description: INodeTypeDescription = {
		displayName: 'Pinecone Assistant',
		name: 'pineconeAssistant',
		icon: { light: 'file:pinecone.svg', dark: 'file:pinecone.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'A Pinecone Assistant node for n8n',
		defaults: {
			name: 'Pinecone Assistant',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'pineconeAssistantApi',
				required: true,
			},
		],
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		properties: [
			// Resources
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Assistant',
						value: 'assistant',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Context Snippet',
						value: 'contextSnippet',
					},
				],
				default: 'assistant',
				required: true
			},

			// Operations
			{
				displayName: 'Operation',
				name: 'operation',
				description: 'The operation to use for Pinecone Assistant',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['assistant'],
					},
				},
				options: [
					{
						name: 'List Assistants',
						value: 'listAssistants',
						description: 'List all assistants in my Pinecone account',
						action: 'List all assistants',
					},
				],
				default: 'listAssistants',
				required: true,
				noDataExpression: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				description: 'The operation to use for Pinecone Assistant',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'List Files',
						value: 'listFiles',
						description: 'List all files in my Pinecone Assistant',
						action: 'List files',
					},
					{
						name: 'Upload File',
						value: 'uploadFile',
						description: 'Upload a file to my Pinecone Assistant',
						action: 'Upload file',
					},
					{
						name: 'Update File',
						value: 'updateFile',
						description: 'Update an existing file in my Pinecone Assistant',
						action: 'Update file',
					},
					{
						name: 'Delete File',
						value: 'deleteFile',
						description: 'Delete a file from my Pinecone Assistant',
						action: 'Delete file',
					},
				],
				default: 'listFiles',
				required: true,
				noDataExpression: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				description: 'The operation to use for Pinecone Assistant',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['contextSnippet'],
					},
				},
				options: [
					{
						name: 'Get Context Snippets',
						value: 'getContextSnippets',
						description: 'Get context snippets for a given assistant',
						action: 'Get context snippets',
					}
				],
				default: 'getContextSnippets',
				required: true,
				noDataExpression: true,
			},
			
			// Fields
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Assistant Name',
				name: 'assistantData',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAssistants',
				},
				options: [],
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['listFiles', 'uploadFile', 'updateFile', 'deleteFile', 'getContextSnippets'],
						resource: ['file', 'contextSnippet'],
					},
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-options
				description:
					'The name of the Pinecone Assistant to work with. Choose from the list, or specify a name using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getContextSnippets'],
						resource: ['contextSnippet'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getAssistants(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const { assistants } = await apiRequest.call(
					this,
					'GET',
					'https://api.pinecone.io',
					'assistants',
					{}
				) as { assistants: Array<AssistantData> };
				
				return assistants.map((assistant) => ({
					name: assistant.name,
					value: JSON.stringify({ name: assistant.name, host: assistant.host }),
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
