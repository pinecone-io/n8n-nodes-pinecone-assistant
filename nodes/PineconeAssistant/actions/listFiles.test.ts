import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './listFiles';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	getFiles: jest.fn(),
}));

describe('listFiles.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockGetFiles = genericFunctions.getFiles as jest.MockedFunction<typeof genericFunctions.getFiles>;

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

		mockExecuteFunctions.getNodeParameter = jest.fn().mockImplementation((paramName: string) => {
			if (paramName === 'assistantData') {
				return assistantData;
			}
			if (paramName === 'additionalFields') {
				return {};
			}
			return undefined;
		});
		mockGetFiles.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('additionalFields', index);
		expect(mockGetFiles).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			undefined,
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

		mockExecuteFunctions.getNodeParameter = jest.fn().mockImplementation((paramName: string) => {
			if (paramName === 'assistantData') {
				return assistantData;
			}
			if (paramName === 'additionalFields') {
				return {};
			}
			return undefined;
		});
		mockGetFiles.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockGetFiles).toHaveBeenCalledWith(
			'empty-assistant',
			'https://prod-1-data.ke.pinecone.io',
			undefined,
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

		mockExecuteFunctions.getNodeParameter = jest.fn().mockImplementation((paramName: string) => {
			if (paramName === 'assistantData') {
				return assistantData;
			}
			if (paramName === 'additionalFields') {
				return {};
			}
			return undefined;
		});
		mockGetFiles.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockGetFiles).toHaveBeenCalledWith(
			'my-custom-assistant',
			'https://prod-1-data.ke.pinecone.io',
			undefined,
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

		mockExecuteFunctions.getNodeParameter = jest.fn().mockImplementation((paramName: string) => {
			if (paramName === 'assistantData') {
				return assistantData;
			}
			if (paramName === 'additionalFields') {
				return {};
			}
			return undefined;
		});
		mockGetFiles.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('API request failed');
		expect(mockGetFiles).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			undefined,
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should pass metadata filter to API call when provided', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const additionalFields = {
			metadataFilter: {
				metadataFilterValues: [
					{ key: 'category', value: 'documentation' }
				],
			},
		};
		const mockResponseData = [
			{ id: 'file1', name: 'test.pdf', metadata: { category: 'documentation', status: 'active' } },
		];
		const mockReturnData: INodeExecutionData[] = [
			{ json: { id: 'file1', name: 'test.pdf', metadata: { category: 'documentation', status: 'active' } } },
		];

		mockExecuteFunctions.getNodeParameter = jest.fn().mockImplementation((paramName: string) => {
			if (paramName === 'assistantData') {
				return assistantData;
			}
			if (paramName === 'additionalFields') {
				return additionalFields;
			}
			return undefined;
		});
		mockGetFiles.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('additionalFields', index);
		expect(mockGetFiles).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			additionalFields.metadataFilter,
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});
});

