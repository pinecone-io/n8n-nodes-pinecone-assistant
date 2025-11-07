import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class PineconeApi implements ICredentialType {
    name = 'pineconeAssistantApi';

    displayName = 'Pinecone Assistant API';

    icon = {
            light: 'file:../nodes/PineconeAssistant/pinecone.svg',
            dark: 'file:../nodes/PineconeAssistant/pinecone.dark.svg',
    } as const;

    documentationUrl = 'https://github.com/pinecone-io/n8n-nodes-pinecone-assistant';

    properties: INodeProperties[] = [
            {
                    displayName: 'API Key',
                    name: 'apiKey',
                    type: 'string',
                    typeOptions: { password: true },
                    required: true,
                    default: '',
            },
    ];

    authenticate: IAuthenticateGeneric = {
            type: 'generic',
            properties: {
                    headers: {
                            'Api-key': '={{$credentials.apiKey}}',
                            'X-Pinecone-API-Version': '2025-04',
                            'User-Agent': 'source_tag=n8n:n8n_nodes_pinecone_assistant',
                    },
            },
    };

    test: ICredentialTestRequest = {
            request: {
                    baseURL: 'https://api.pinecone.io/assistant',
                    url: '/assistants',
            },
    };
}