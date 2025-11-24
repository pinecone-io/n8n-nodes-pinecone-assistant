import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';

import { router } from './actions/router';
import { versionDescription } from './actions/versionDescription';
import { loadOptions } from './methods';

// eslint-disable-next-line @n8n/community-nodes/icon-validation
export class PineconeAssistantV1 implements INodeType { 
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
			usableAsTool: true,
		};
	}

	methods = { loadOptions };

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
