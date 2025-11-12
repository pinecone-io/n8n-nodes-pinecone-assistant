import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './listFiles';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	apiRequest: jest.fn(),
}));

describe('listFiles.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockApiRequest = genericFunctions.apiRequest as jest.MockedFunction<typeof genericFunctions.apiRequest>;

	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();

		// Create a mock IExecuteFunctions object
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			helpers: {
				returnJsonArray: jest.fn(),
			},
		} as unknown as jest.Mocked<IExecuteFunctions>;
	});

	it('should successfully fetch files for an assistant', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const mockResponseData = [
			{ id: 'file1', name: 'test.pdf' },
			{ id: 'file2', name: 'document.docx' },
		];
		const mockReturnData: INodeExecutionData[] = [
			{ json: { id: 'file1', name: 'test.pdf' } },
			{ json: { id: 'file2', name: 'document.docx' } },
		];

		mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValue(assistantData);
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockApiRequest).toHaveBeenCalledWith(
			'GET',
			'https://prod-1-data.ke.pinecone.io',
			'files/test-assistant',
			{},
			{},
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should handle empty response data', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'empty-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const mockResponseData: unknown[] = [];
		const mockReturnData: INodeExecutionData[] = [];

		mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValue(assistantData);
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'GET',
			'https://prod-1-data.ke.pinecone.io',
			'files/empty-assistant',
			{},
			{},
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should correctly parse assistant data and construct endpoint', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'my-custom-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const mockResponseData = [{ id: 'file1' }];
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file1' } }];

		mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValue(assistantData);
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'GET',
			'https://prod-1-data.ke.pinecone.io',
			'files/my-custom-assistant',
			{},
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
		const error = new Error('API request failed');

		mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValue(assistantData);
		mockApiRequest.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('API request failed');
		expect(mockApiRequest).toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});
});

