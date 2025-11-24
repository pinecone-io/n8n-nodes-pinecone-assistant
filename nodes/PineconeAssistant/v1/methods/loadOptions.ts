import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { apiRequest, type AssistantData } from '../genericFunctions';

export async function getAssistants(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
}