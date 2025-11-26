# n8n-nodes-pinecone-assistant

This is the official [n8n](https://n8n.io/) community node for interacting with [Pinecone](https://www.pinecone.io/) Assistant in your workflows.

[Pinecone Assistant](https://docs.pinecone.io/guides/assistant/overview) allows you to build production-grade chat and agent-based applications quickly. It abstracts the complexities of implementing retrieval-augmented (RAG) systems by managing the chunking, embedding, storage, query planning, vector search, model orchestration, reranking for you.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Assistants

- List all the Assistants in the your project

### Files

- List all files for an Assistant
- Upload a file to an Assistant
- Update a file in an Assistant
- Delete file from an Assistant

### Context Snippets

- Get context snippets from an Assistant

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

The release command builds, lints, updates the changelog, creates git tags, creates a GitHub release, and publishes the package to npm.

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