import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

import * as packageInfo from '../nodes/PineconeAssistant/version.json';

export class PineconeApi implements ICredentialType {
    name = 'pineconeAssistantApi';

    // eslint-disable-next-line n8n-nodes-base/cred-class-field-display-name-missing-api
    displayName = 'Pinecone Assistant API - DEPRECATED';

    icon = {
            light: 'file:../nodes/PineconeAssistant/pinecone.svg',
            dark: 'file:../nodes/PineconeAssistant/pinecone.dark.svg',
    } as const;

    documentationUrl = 'https://github.com/pinecone-io/n8n-nodes-pinecone-assistant';

    properties: INodeProperties[] = [
            {
                displayName:
                        "This credential type is deprecated. Please update to the latest version of the Pinecone Assistant node.",
                name: 'notice',
                type: 'notice',
                default: '',
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
            },
            {
                displayName:
                        "Start building with Pinecone before May 1, 2026 to receive platform credits when upgrading to Pinecone's Standard plan. Learn more and claim this offer <a href='https://app.pinecone.io/?integration=pinecone-n8n-assistant-node'>here<a/>.",
                name: 'notice',
                type: 'notice',
                default: '',
                displayOptions: {
                        hideOnCloud: true
                }
            },
    ];

    authenticate: IAuthenticateGeneric = {
            type: 'generic',
            properties: {
                    headers: {
                            'Api-key': '={{$credentials.apiKey}}',
                    },
            },
    };

    test: ICredentialTestRequest = {
            request: {
                    baseURL: 'https://api.pinecone.io/assistant',
                    url: '/assistants',
                    headers: {
                        'X-Pinecone-API-Version': '2025-10',
                        'User-Agent': `${packageInfo.name} v${packageInfo.version}; source_tag=${packageInfo.defaultSourceTag}:credentials`,
                    },
            },
    };
}