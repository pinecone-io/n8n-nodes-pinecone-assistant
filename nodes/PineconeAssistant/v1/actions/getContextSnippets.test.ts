import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { execute } from './getContextSnippets';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	apiRequest: jest.fn(),
	constructMetadataValues: jest.fn(),
}));

describe('getContextSnippets.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockApiRequest = genericFunctions.apiRequest as jest.MockedFunction<typeof genericFunctions.apiRequest>;
	const mockConstructMetadataValues = genericFunctions.constructMetadataValues as jest.MockedFunction<typeof genericFunctions.constructMetadataValues>;

	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();

		// Default mock for mockConstructMetadataValues (returns empty object when no metadata values)
		mockConstructMetadataValues.mockReturnValue({});

		// Create a mock IExecuteFunctions object
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getNode: jest.fn().mockReturnValue({ name: 'test-node' }),
			helpers: {
				returnJsonArray: jest.fn(),
			},
		} as unknown as jest.Mocked<IExecuteFunctions>;
	});

	it('should successfully fetch context snippets for a query', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'What is machine learning?';
		const topK = 10;
		const snippetSize = 500;
		const mockResponseData = [
			{ snippet: 'Machine learning is a subset of AI...', score: 0.95 },
			{ snippet: 'ML algorithms learn from data...', score: 0.89 },
		];
		const mockReturnData: INodeExecutionData[] = [
			{ json: { snippet: 'Machine learning is a subset of AI...', score: 0.95 } },
			{ json: { snippet: 'ML algorithms learn from data...', score: 0.89 } },
		];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'additionalFields') return { topK, snippetSize };
				return undefined;
			});
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('query', index);
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'chat/test-assistant/context',
			{ query: 'What is machine learning?', top_k: topK, snippet_size: snippetSize },
			{},
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should handle empty response data', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'test query';
		const topK = 10;
		const snippetSize = 500;
		const mockResponseData: unknown[] = [];
		const mockReturnData: INodeExecutionData[] = [];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'additionalFields') return { topK, snippetSize };
				return undefined;
			});
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'chat/test-assistant/context',
			{ query: 'test query', top_k: topK, snippet_size: snippetSize },
			{},
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should correctly construct endpoint with different assistant names', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'my-custom-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'custom query';
		const topK = 10;
		const snippetSize = 500;
		const mockResponseData = [{ snippet: 'test snippet' }];
		const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'additionalFields') return { topK, snippetSize };
				return undefined;
			});
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'chat/my-custom-assistant/context',
			{ query: 'custom query', top_k: topK, snippet_size: snippetSize },
			{},
		);
	});

	it('should handle API request errors', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'test query';
		const topK = 10;
		const snippetSize = 500;
		const error = new Error('API request failed');

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'additionalFields') return { topK, snippetSize };
				return undefined;
			});
		mockApiRequest.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('API request failed');
		expect(mockApiRequest).toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should handle queries with special characters', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'What is "machine learning" & AI?';
		const topK = 10;
		const snippetSize = 500;
		const mockResponseData = [{ snippet: 'test' }];
		const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'additionalFields') return { topK, snippetSize };
				return undefined;
			});
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'chat/test-assistant/context',
			{ query: 'What is "machine learning" & AI?', top_k: topK, snippet_size: snippetSize },
			{},
		);
	});

	it('should throw an error if the query is empty', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = '';

		mockExecuteFunctions.getNodeParameter = jest
		.fn()
		.mockImplementation((paramName: string) => {
			if (paramName === 'assistantData') return assistantData;
			if (paramName === 'query') return query;
			return undefined;
		});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'Query parameter is required and cannot be empty',
		);
		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should throw an error if the query is null', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = null;

			mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				return undefined;
			});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'Query parameter is required and cannot be empty',
		);
		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should throw an error if the query is only whitespace', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = '   ';

			mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				return undefined;
			});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'Query parameter is required and cannot be empty',
		);
		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should throw an error if both metadataFilter and advancedMetadataFilter are set', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'test query';
		const metadataFilter = {
			metadataValues: [
				{ key: 'category', value: 'technology' },
			],
		};
		const advancedMetadataFilter = { $and: [{ category: { $eq: 'technology' } }] };

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'additionalFields') return { metadataFilter, advancedMetadataFilter };
				return undefined;
			});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'Only one of metadataFilter or advancedMetadataFilter can be set, not both',
		);
		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
		expect(mockConstructMetadataValues).not.toHaveBeenCalled();
	});

	it('should not include topK and snippetSize in body when they are not set', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'test query';
		const mockResponseData = [{ snippet: 'test snippet' }];
		const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'additionalFields') return {};
				// topK and snippetSize return undefined (not set)
				return undefined;
			});
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'chat/test-assistant/context',
			{ query: 'test query' },
			{},
		);
		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		const callArgs = mockApiRequest.mock.calls[0];
		const requestBody = callArgs[3] as IDataObject;
		expect(requestBody).not.toHaveProperty('top_k');
		expect(requestBody).not.toHaveProperty('snippet_size');
		expect(requestBody).toHaveProperty('query');
	});

	it('should not include topK or snippetSize when they are explicitly null', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const query = 'test query';
		const mockResponseData = [{ snippet: 'test snippet' }];
		const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
				if (paramName === 'topK') return null;
				if (paramName === 'snippetSize') return null;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'chat/test-assistant/context',
			{ query: 'test query' },
			{},
		);
		const callArgs = mockApiRequest.mock.calls[0];
		const requestBody = callArgs[3] as IDataObject;
		expect(requestBody).not.toHaveProperty('top_k');
		expect(requestBody).not.toHaveProperty('snippet_size');
		expect(requestBody).toHaveProperty('query');
	});

	describe('metadataFilter functionality', () => {
		it('should set body.filter when metadataFilter is provided with valid values', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const metadataFilter = {
				metadataValues: [
					{ key: 'category', value: 'technology' },
					{ key: 'status', value: 'active' },
				],
			};
			const mockFilterResult = { category: 'technology', status: 'active' };
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { metadataFilter };
					return undefined;
				});
			mockConstructMetadataValues.mockReturnValue(mockFilterResult);
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockConstructMetadataValues).toHaveBeenCalledWith(metadataFilter);
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{ query: 'test query', filter: mockFilterResult },
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			expect(requestBody).toHaveProperty('filter');
			expect(requestBody.filter).toEqual(mockFilterResult);
		});

		it('should not set body.filter when metadataFilter is not provided', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return {};
					return undefined;
				});
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockConstructMetadataValues).not.toHaveBeenCalled();
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{ query: 'test query' },
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			expect(requestBody).not.toHaveProperty('filter');
		});

		it('should not set body.filter when metadataFilter is an empty object', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const metadataFilter = {};
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { metadataFilter };
					return undefined;
				});
				mockConstructMetadataValues.mockReturnValue(null);
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockConstructMetadataValues).toHaveBeenCalledWith(metadataFilter);
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{ query: 'test query' },
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			// When constructMetadataValues returns null, body.filter should not be set
			expect(requestBody).not.toHaveProperty('filter');
		});

		it('should not set body.filter when metadataFilter.metadataValues is empty array', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const metadataFilter = {
				metadataValues: [],
			};
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { metadataFilter };
					return undefined;
				});
				mockConstructMetadataValues.mockReturnValue(null);
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockConstructMetadataValues).toHaveBeenCalledWith(metadataFilter);
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{ query: 'test query' },
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			// When constructMetadataValues returns null, body.filter should not be set
			expect(requestBody).not.toHaveProperty('filter');
		});

		it('should not set body.filter when metadataFilter is undefined in additionalFields', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const topK = 10;
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { topK };
					return undefined;
				});
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockConstructMetadataValues).not.toHaveBeenCalled();
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{ query: 'test query', top_k: topK },
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			expect(requestBody).not.toHaveProperty('filter');
		});

		it('should set body.filter when metadataFilter is provided and constructMetadataValues returns valid filter', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const metadataFilter = {
				metadataValues: [
					{ key: 'source', value: 'documentation' },
				],
			};
			const mockFilterResult = { source: 'documentation' };
			const topK = 5;
			const snippetSize = 300;
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { metadataFilter, topK, snippetSize };
					return undefined;
				});
				mockConstructMetadataValues.mockReturnValue(mockFilterResult);
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockConstructMetadataValues).toHaveBeenCalledWith(metadataFilter);
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{
					query: 'test query',
					filter: mockFilterResult,
					top_k: topK,
					snippet_size: snippetSize,
				},
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			expect(requestBody).toHaveProperty('filter');
			expect(requestBody.filter).toEqual(mockFilterResult);
		});
	});

	describe('advancedMetadataFilter functionality', () => {
		it('should set body.filter when advancedMetadataFilter is provided with valid JSON string', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const advancedMetadataFilter = JSON.stringify({
				$and: [
					{ category: { $eq: 'technology' } },
					{ year: { $gte: 2023 } },
				],
			});
			const expectedFilter = {
				$and: [
					{ category: { $eq: 'technology' } },
					{ year: { $gte: 2023 } },
				],
			};
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { advancedMetadataFilter };
					return undefined;
				});
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{ query: 'test query', filter: expectedFilter },
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			expect(requestBody).toHaveProperty('filter');
			expect(requestBody.filter).toEqual(expectedFilter);
			expect(mockConstructMetadataValues).not.toHaveBeenCalled();
		});

		it('should set body.filter when advancedMetadataFilter is provided with simple filter expression', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const advancedMetadataFilter = JSON.stringify({
				category: { $eq: 'documentation' },
			});
			const expectedFilter = {
				category: { $eq: 'documentation' },
			};
			const mockResponseData = [{ snippet: 'test snippet' }];
			const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { advancedMetadataFilter };
					return undefined;
				});
			mockApiRequest.mockResolvedValue(mockResponseData);
			mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

			// Act
			await execute.call(mockExecuteFunctions, index);

			// Assert
			expect(mockApiRequest).toHaveBeenCalledWith(
				'POST',
				'https://prod-1-data.ke.pinecone.io',
				'chat/test-assistant/context',
				{ query: 'test query', filter: expectedFilter },
				{},
			);
			const callArgs = mockApiRequest.mock.calls[0];
			const requestBody = callArgs[3] as IDataObject;
			expect(requestBody).toHaveProperty('filter');
			expect(requestBody.filter).toEqual(expectedFilter);
		});

		it('should throw an error when advancedMetadataFilter contains invalid JSON', async () => {
			// Arrange
			const index = 0;
			const assistantData = JSON.stringify({
				name: 'test-assistant',
				host: 'https://prod-1-data.ke.pinecone.io',
			});
			const query = 'test query';
			const advancedMetadataFilter = '{ invalid json }';

			mockExecuteFunctions.getNodeParameter = jest
				.fn()
				.mockImplementation((paramName: string) => {
					if (paramName === 'assistantData') return assistantData;
					if (paramName === 'query') return query;
					if (paramName === 'additionalFields') return { advancedMetadataFilter };
					return undefined;
				});

			// Act & Assert
			await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
				'Invalid JSON in advancedMetadataFilter',
			);
			expect(mockApiRequest).not.toHaveBeenCalled();
			expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
			expect(mockConstructMetadataValues).not.toHaveBeenCalled();
		});
	});
});

