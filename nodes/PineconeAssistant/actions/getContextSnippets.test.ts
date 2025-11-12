import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './getContextSnippets';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	apiRequest: jest.fn(),
}));

describe('getContextSnippets.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockApiRequest = genericFunctions.apiRequest as jest.MockedFunction<typeof genericFunctions.apiRequest>;

	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();

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
			{ query: 'What is machine learning?' },
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
		const mockResponseData: unknown[] = [];
		const mockReturnData: INodeExecutionData[] = [];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
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
			{ query: 'test query' },
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
		const mockResponseData = [{ snippet: 'test snippet' }];
		const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test snippet' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
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
			{ query: 'custom query' },
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
		const error = new Error('API request failed');

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
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
		const mockResponseData = [{ snippet: 'test' }];
		const mockReturnData: INodeExecutionData[] = [{ json: { snippet: 'test' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'query') return query;
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
			{ query: 'What is "machine learning" & AI?' },
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
});

