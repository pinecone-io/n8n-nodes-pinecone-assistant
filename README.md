# n8n-nodes-pinecone-assistant

This is the official [n8n](https://n8n.io/) community node for interacting with [Pinecone](https://www.pinecone.io/) Assistant in your workflows.

[Pinecone Assistant](https://docs.pinecone.io/guides/assistant/overview) allows you to build production-grade chat and agent-based applications quickly. It abstracts the complexities of implementing retrieval-augmented (RAG) systems by managing the chunking, embedding, storage, query planning, vector search, model orchestration, reranking for you.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Assistants

#### List Assistants

**Purpose:** Retrieves a list of all Pinecone Assistants in your project. Use this operation to discover available assistants or populate assistant selection fields in your workflows.

**Fields:**
- **Additional Fields:**
  - **Source Tag** (optional): Specify a source tag to attribute usage to this integration. This is primarily used for Pinecone integration partners. Read more in the [Pinecone documentation](https://docs.pinecone.io/integrations/build-integration/attribute-usage-to-your-integration).

**Output:** Returns an array of assistant objects containing assistant names and host URLs.

### Files

#### List Files

**Purpose:** Retrieves all files associated with a specific Pinecone Assistant. Use this to see what files are available in an assistant, filter files by metadata, or verify file uploads.

**Fields:**
- **Assistant Name** (required): The name of the Pinecone Assistant to query. This list is populated dynamically based on your available assistants.
- **Additional Fields:**
  - **Metadata Filter** (optional): Limit the list of files to only those matching the metadata filter. Add key-value pairs to filter by specific metadata.
  - **Advanced Metadata Filter (JSON)** (optional): Use advanced metadata filtering when you need support for operators like `$or`, `$ne`, `$in`, etc. Provide a JSON object with filter expressions. Learn more about metadata filter expressions in the [Pinecone documentation](https://docs.pinecone.io/guides/search/filter-by-metadata#metadata-filter-expressions).
  - **Source Tag** (optional): Specify a source tag to attribute usage to this integration. This is primarily used for Pinecone integration partners. Read more in the [Pinecone documentation](https://docs.pinecone.io/integrations/build-integration/attribute-usage-to-your-integration).

**Note:** Only one of Metadata Filter or Advanced Metadata Filter can be set, not both.

**Output:** Returns an array of file objects with their metadata and external file IDs.

#### Upload File

**Purpose:** Uploads a new file to a Pinecone Assistant. Assistant automatically chunks, embeds, and indexes the file for retrieval. Use this to add new documents or content to your assistant's knowledge.

**Fields:**
- **Assistant Name** (required): The name of the Pinecone Assistant to upload the file to. This list is populated dynamically based on your available assistants.
- **External File ID** (required): A unique identifier for the file in the Pinecone Assistant. This should be unique for each file.
- **Input Data Field Name** (required): The name of the field in the input item that contains the file data. Default is "data".
- **Additional Fields:**
  - **Metadata** (optional): A collection of key-value pairs to add as metadata to the file. This metadata can be used later for filtering files or context snippets.
  - **Source Tag** (optional): Specify a source tag to attribute usage to this integration. This is primarily used for Pinecone integration partners. Read more in the [Pinecone documentation](https://docs.pinecone.io/integrations/build-integration/attribute-usage-to-your-integration).

**Note:** There is no need to specify External File ID in the metadata field directly as this operation will make sure it's set.

**Output:** Returns the uploaded file information.

#### Update File

**Purpose:** Updates an existing file in a Pinecone Assistant. This operation deletes the existing file(s) with the specified external file ID and uploads the new version.

**Fields:**
- **Assistant Name** (required): The name of the Pinecone Assistant containing the file to update. This list is populated dynamically based on your available assistants.
- **External File ID** (required): The external file ID of the file to update. If the existing file does not exist, a new file will be uploaded. Use this to refresh or modify content in your assistant's knowledge base. If there are multiple files with the same external file ID, all will be updated.
- **Input Data Field Name** (required): The name of the field in the input item that contains the updated file data. Default is "data".
- **Additional Fields:**
  - **Metadata** (optional): A collection of key-value pairs to update the file's metadata.
  - **Source Tag** (optional): Specify a source tag to attribute usage to this integration. This is primarily used for Pinecone integration partners. Read more in the [Pinecone documentation](https://docs.pinecone.io/integrations/build-integration/attribute-usage-to-your-integration).

**Output:** Returns the updated file information.

#### Delete File

**Purpose:** Deletes a file from a Pinecone Assistant. Use this to remove outdated or unwanted content from your assistant's knowledge.

**Fields:**
- **Assistant Name** (required): The name of the Pinecone Assistant containing the file to delete. This list is populated dynamically based on your available assistants.
- **External File ID** (required): The external file ID to identify the file in the Pinecone Assistant. If there are multiple files with the same external file ID, this operation will delete all of them.
- **Additional Fields:**
  - **Source Tag** (optional): Specify a source tag to attribute usage to this integration. This is primarily used for Pinecone integration partners. Read more in the [Pinecone documentation](https://docs.pinecone.io/integrations/build-integration/attribute-usage-to-your-integration).

**Output:** Returns a confirmation object with `deleted: true`.

### Context Snippets

#### Get Context Snippets

**Purpose:** Retrieves relevant context snippets from a Pinecone Assistant based on a query. This is the core RAG (Retrieval-Augmented Generation) operation that finds and returns the most relevant chunks of text from your assistant's files that match your query. Use this to provide context to LLMs or to retrieve relevant information for your applications.

**Fields:**
- **Assistant Name** (required): The name of the Pinecone Assistant to query for context snippets. This list is populated dynamically based on your available assistants.
- **Query** (required): The query text used to retrieve relevant context snippets. This is the search term that will be used to find matching content in your assistant's files.
- **Additional Fields:**
  - **Top K** (optional): The maximum number of context snippets to return. Default is 16.
  - **Snippet Size** (optional): The maximum context snippet size in tokens. Default is 2048.
  - **Metadata Filter** (optional): Limit the context snippets to only those from files matching the metadata filter. Add key-value pairs to filter by specific metadata.
  - **Advanced Metadata Filter (JSON)** (optional): Use advanced metadata filtering when you need support for operators like `$or`, `$ne`, `$in`, etc. Provide a JSON object with filter expressions. Learn more about metadata filter expressions in the [Pinecone documentation](https://docs.pinecone.io/guides/search/filter-by-metadata#metadata-filter-expressions).
  - **Source Tag** (optional): Specify a source tag to attribute usage to this integration. This is primarily used for Pinecone integration partners. Read more in the [Pinecone documentation](https://docs.pinecone.io/integrations/build-integration/attribute-usage-to-your-integration).

**Note:** Only one of Metadata Filter or Advanced Metadata Filter can be set, not both.

**Output:** Returns an array of context snippets with their text content, relevance scores, and associated metadata.

## Credentials

To use the Pinecone Assistant node, you'll need a Pinecone account and an API key. You can get started for free on the Starter plan (refer to [current pricing and limits](https://docs.pinecone.io/guides/assistant/pricing-and-limits) for more info).

1. Sign up for a [Pinecone account](https://app.pinecone.io/)
2. Create an [API key](https://app.pinecone.io/organizations/-/projects/-/keys)

## Compatibility

This node was tested locally against n8n 1.121.3.

## Usage

Refer to our [Pinecone Assistant quickstart](https://docs.pinecone.io/guides/assistant/quickstart#n8n) for n8n to get started with a pre-built workflow using this node, an Assistant, and Open AI.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* _Link to app/service documentation._

## Version history

- V1

## Node development

To develop, build, and run this node locally, use the `n8n-node` cli tool or `pnpm`. For more info on `n8n-node`, refer [here](https://docs.n8n.io/integrations/creating-nodes/build/n8n-node/).

1. Install dependencies

```bash
$ cd n8n-nodes-pinecone-assistant
$ pnpm install
```
2. Build the node

This compiles Typescript files and bundles project assets into the `dist` folder.

```bash
$ pnpm run build
```

Running this will clean the `dist` folder.

3. Test the node

This runs a local instance of n8n with the node. It watches the project directory and automatically rebuilds when changes are detected.

```bash
$ pnpm run dev
```

Head over to http://localhost:5678 to test the node in a workflow.

4. Run tests

Run the unit test suite.

```bash
$ pnpm test
```

5. Versioning the node

When making changes to a version of the node, ensure backwards compatibility with the current version. If it cannot be backwards compatible, create a new version:

- In `PineconeAssistant.node.ts`, change `defaultVersion` to the new version number
- In `PineconeAssistant.node.ts`, update the list of `nodeVersions`
- Add a new version directory, named `v#` (i.e. `v2`)
- In the new version directory, add the versioned node, `PineconeAssistantV2.node.ts` and all all functionality.


6. Release the node and publish to npm

Login to npm.

```bash
$ pnpm login
```

The release command builds, lints, updates the changelog, updates the version number in `package.json` and `version.json`, creates git tags, creates a GitHub release, and publishes the package to npm.

Note: This executes the same steps as `n8n-node release` plus updates the `version.json` file.

```bash
$ pnpm run release
```

## Contributing

We welcome contributions! Please feel free to:
- Submit issues and bug reports
- Propose new features and improvements
- Contribute code via pull requests
- Share your use cases and success stories

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.