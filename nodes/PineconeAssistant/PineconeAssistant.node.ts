import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { PineconeAssistantV1 } from './v1/PineconeAssistantV1.node';

export class PineconeAssistant extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Pinecone Assistant',
			name: 'pineconeAssistant',
			icon: { light: 'file:pinecone.svg', dark: 'file:pinecone.dark.svg' },
			group: ['transform'],
			subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
			description: 'A Pinecone Assistant node for n8n',
			defaultVersion: 1,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new PineconeAssistantV1(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}