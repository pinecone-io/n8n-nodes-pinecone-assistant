import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './deleteFile';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	apiRequest: jest.fn(),
	getFileIdsByExternalFileId: jest.fn(),
}));

describe('deleteFile.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockApiRequest = genericFunctions.apiRequest as jest.MockedFunction<typeof genericFunctions.apiRequest>;
	const mockGetFileIdByExternalFileId = genericFunctions.getFileIdsByExternalFileId as jest.MockedFunction<typeof genericFunctions.getFileIdsByExternalFileId>;

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

	it('should successfully delete a file', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const externalFileId = 'external-123';
		const fileId = 'file-456';
		const mockReturnData: INodeExecutionData[] = [{ json: { deleted: true } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});
		mockGetFileIdByExternalFileId.mockResolvedValue([fileId]);
		mockApiRequest.mockResolvedValue(undefined);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('externalFileId', index);
		expect(mockGetFileIdByExternalFileId).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
		);
		expect(mockApiRequest).toHaveBeenCalledWith(
			'DELETE',
			'https://prod-1-data.ke.pinecone.io',
			'files/test-assistant/file-456',
			{},
			{},
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith([{ json: { deleted: true } }]);
		expect(result).toEqual(mockReturnData);
	});

	it('should throw an error if external file ID is missing', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const externalFileId = '';

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'External file ID is required to update a file.',
		);
		expect(mockGetFileIdByExternalFileId).not.toHaveBeenCalled();
		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should throw an error if external file ID is null', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const externalFileId = null;

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'External file ID is required to update a file.',
		);
		expect(mockGetFileIdByExternalFileId).not.toHaveBeenCalled();
		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should throw an error if file is not found', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const externalFileId = 'external-123';

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});
		mockGetFileIdByExternalFileId.mockResolvedValue([]);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'File with external file ID external-123 not found.',
		);
		expect(mockGetFileIdByExternalFileId).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
		);
		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should handle API request errors', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const externalFileId = 'external-123';
		const fileId = 'file-456';
		const error = new Error('API request failed');

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});
		mockGetFileIdByExternalFileId.mockResolvedValue([fileId]);
		mockApiRequest.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('API request failed');
		expect(mockGetFileIdByExternalFileId).toHaveBeenCalled();
		expect(mockApiRequest).toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should correctly construct endpoint with different assistant names and file IDs', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'my-custom-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const externalFileId = 'custom-external-id';
		const fileId = 'custom-file-id';
		const mockReturnData: INodeExecutionData[] = [{ json: { deleted: true } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});
		mockGetFileIdByExternalFileId.mockResolvedValue([fileId]);
		mockApiRequest.mockResolvedValue(undefined);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'DELETE',
			'https://prod-1-data.ke.pinecone.io',
			'files/my-custom-assistant/custom-file-id',
			{},
			{},
		);
	});

});

