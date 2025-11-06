import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

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
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'My String',
				name: 'myString',
				type: 'string',
				default: '',
				placeholder: 'Placeholder value',
				description: 'The description text',
			},
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
				],
				default: 'assistant',
				required: true
			},
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
			}
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let myString: string;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				myString = this.getNodeParameter('myString', itemIndex, '') as string;
				item = items[itemIndex];

				item.json.myString = myString;
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
