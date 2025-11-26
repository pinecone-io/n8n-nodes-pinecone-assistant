/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import { NodeConnectionTypes, type INodeTypeDescription } from "n8n-workflow";

export const versionDescription: INodeTypeDescription = {
    displayName: 'Pinecone Assistant',
    name: 'pineconeAssistant',
    group: ['transform'],
    version: 1,
    description: 'A Pinecone Assistant node for n8n',
    defaults: {
        name: 'Pinecone Assistant',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
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
            default: 'contextSnippet',
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
            description: 'The name of the Pinecone Assistant to work with',
            noDataExpression: true
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
                    '@tool': [false],
                },
            },
            description: 'The query used to retrieve the context snippets',
        },
        {
            displayName: 'Query',
            name: 'query',
            type: 'string',
            default: '={{ /*n8n-auto-generated-fromAI-override*/ $fromAI("Query", "", "string") }}',
            required: true,
            displayOptions: {
                show: {
                    operation: ['getContextSnippets'],
                    resource: ['contextSnippet'],
                    '@tool': [true],
                },
            },
            description: 'The query used to retrieve the context snippets',
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFields',
            type: 'collection',
            placeholder: 'Add field',
            default: {},
            displayOptions: {
                show: {
                    operation: ['getContextSnippets'],
                    resource: ['contextSnippet'],
                },
            },
            options: [
                {
                    displayName: 'Top K',
                    name: 'topK',
                    type: 'number',
                    default: 16,
                    description: 'The maximum number of context snippets to return'
                },
                {
                    displayName: 'Snippet Size',
                    name: 'snippetSize',
                    type: 'number',
                    default: 2048,
                    description: 'The maximum context snippet size in tokens'

                },					
                {
                    displayName: 'Metadata Filter',
                    name: 'metadataFilter',
                    placeholder: 'Add metadata',
                    type: 'fixedCollection',
                    default: {},
                    typeOptions: {
                        multipleValues: true,
                    },
                    description: 'Limit the context snippets to only those from files matching the metadata filter',
                    options: [
                        {
                            name: 'metadataValues',
                            displayName: 'Metadata Filter',
                            values: [
                                {
                                    displayName: 'Key',
                                    name: 'key',
                                    type: 'string',
                                    default: '',
                                    description: 'Metadata key',
                                    required: true,
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                    description: 'Metadata value',
                                    required: true,
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Advanced Metadata Filter (JSON)',
                    name: 'advancedMetadataFilter',
                    type: 'json',
                    default: JSON.stringify({ year: { $gt: 2023 } }, null, 2),
                    description: 'Limit the context snippets to only those from files matching the metadata filter',
                    hint: 'Use advanced metadata filtering when you need support for operators like $or, $ne, $in, etc. Learn more about metadata filter expressions <a href="https://docs.pinecone.io/guides/search/filter-by-metadata#metadata-filter-expressions">in the Pinecone documentation</a>.',
                },					
            ],
        },
        {
            displayName: 'Input Data Field Name',
            name: 'inputDataFieldName',
            type: 'string',
            default: 'data',
            required: true,
            displayOptions: {
                show: {
                    operation: ['uploadFile', 'updateFile'],
                    resource: ['file'],
                },
            },
        },
        {
            displayName: 'External File ID',
            name: 'externalFileId',
            type: 'string',
            default: '',
            required: true,
            displayOptions: { 
                show: {
                    operation: ['deleteFile'],
                    resource: ['file'],
                },
            },
            description: 'The external file ID to identify the file in the Pinecone Assistant. If there are multiple files with the same external file ID, this operation will apply to all files.',
        },
        {
            displayName: 'External File ID',
            name: 'externalFileId',
            type: 'string',
            default: '',
            required: true,
            displayOptions: { 
                show: {
                    operation: ['uploadFile', 'updateFile'],
                    resource: ['file'],
                },
            },
            description: 'The external file ID to identify the file in the Pinecone Assistant. This should be unique for each file in Pinecone Assistant.',
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFields',
            type: 'collection',
            placeholder: 'Add field',
            default: {},
            displayOptions: {
                show: {
                    operation: ['uploadFile', 'updateFile'],
                    resource: ['file'],
                },
            },
            options: [
                {
                    displayName: 'Metadata',
                    name: 'metadata',
                    placeholder: 'Add metadata',
                    type: 'fixedCollection',
                    default: {},
                    typeOptions: {
                        multipleValues: true,
                    },
                    description: 'A collection of metadata to add to the file',
                    options: [
                        {
                            name: 'metadataValues',
                            displayName: 'Metadata',
                            values: [
                                {
                                    displayName: 'Key',
                                    name: 'key',
                                    type: 'string',
                                    default: '',
                                    description: 'Name of the metadata to add',
                                    required: true,
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                    description: 'Value to set for the metadata',
                                    required: true,
                                },
                            ],
                        },
                    ],
                }
            ],
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFields',
            type: 'collection',
            placeholder: 'Add field',
            default: {},
            displayOptions: {
                show: {
                    operation: ['listFiles'],
                    resource: ['file'],
                },
            },
            options: [					
                {
                    displayName: 'Metadata Filter',
                    name: 'metadataFilter',
                    placeholder: 'Add metadata',
                    type: 'fixedCollection',
                    default: {},
                    typeOptions: {
                        multipleValues: true,
                    },
                    description: 'Limit the list of files to only those matching the metadata filter',
                    options: [
                        {
                            name: 'metadataValues',
                            displayName: 'Metadata Filter',
                            values: [
                                {
                                    displayName: 'Key',
                                    name: 'key',
                                    type: 'string',
                                    default: '',
                                    description: 'Metadata key',
                                    required: true,
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                    description: 'Metadata value',
                                    required: true,
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Advanced Metadata Filter (JSON)',
                    name: 'advancedMetadataFilter',
                    type: 'json',
                    default: JSON.stringify({ year: { $gt: 2023 } }, null, 2),
                    description: 'Limit the list of files to only those matching the metadata filter',
                    hint: 'Use advanced metadata filtering when you need support for operators like $or, $ne, $in, etc. Learn more about metadata filter expressions <a href="https://docs.pinecone.io/guides/search/filter-by-metadata#metadata-filter-expressions">in the Pinecone documentation</a>.',
                },
            ],
        },
    ],
};