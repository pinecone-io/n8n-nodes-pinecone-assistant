import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './listAssistants';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	apiRequest: jest.fn(),
}));

describe('listAssistants.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockApiRequest = genericFunctions.apiRequest as jest.MockedFunction<typeof genericFunctions.apiRequest>;

	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();

		// Create a mock IExecuteFunctions object
		mockExecuteFunctions = {
			helpers: {
				returnJsonArray: jest.fn(),
			},
			getNodeParameter: jest.fn().mockReturnValue({}),
		} as unknown as jest.Mocked<IExecuteFunctions>;
	});

	it('should successfully fetch assistants', async () => {
		// Arrange
		const mockResponseData = [
			{ id: 'assistant1', name: 'Test Assistant 1' },
			{ id: 'assistant2', name: 'Test Assistant 2' },
		];
		const mockReturnData: INodeExecutionData[] = [
			{ json: { id: 'assistant1', name: 'Test Assistant 1' } },
			{ json: { id: 'assistant2', name: 'Test Assistant 2' } },
		];

		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, 0);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'GET',
			'https://api.pinecone.io',
			'assistants',
			{},
			{},
			undefined,
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should handle empty response data', async () => {
		// Arrange
		const mockResponseData: unknown[] = [];
		const mockReturnData: INodeExecutionData[] = [];

		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, 0);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'GET',
			'https://api.pinecone.io',
			'assistants',
			{},
			{},
			undefined,
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should handle API request errors', async () => {
		// Arrange
		const error = new Error('API request failed');

		mockApiRequest.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, 0)).rejects.toThrow('API request failed');
		expect(mockApiRequest).toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should handle single assistant response', async () => {
		// Arrange
		const mockResponseData = { id: 'assistant1', name: 'Single Assistant' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'assistant1', name: 'Single Assistant' } }];

		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, 0);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'GET',
			'https://api.pinecone.io',
			'assistants',
			{},
			{},
			undefined,
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});
});

