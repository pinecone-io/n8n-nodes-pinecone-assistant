import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './updateFile';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	deleteFilesByIds: jest.fn(),
	getFileIdsByExternalFileId: jest.fn(),
	uploadFile: jest.fn(),
}));

describe('updateFile.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockDeleteFilesByIds = genericFunctions.deleteFilesByIds as jest.MockedFunction<typeof genericFunctions.deleteFilesByIds>;
	const mockGetFileIdsByExternalFileId = genericFunctions.getFileIdsByExternalFileId as jest.MockedFunction<typeof genericFunctions.getFileIdsByExternalFileId>;
	const mockUploadFile = genericFunctions.uploadFile as jest.MockedFunction<typeof genericFunctions.uploadFile>;

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

	it('should successfully update a file by deleting and uploading', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const fileId = 'file-456';
		const additionalFields = {};
		const mockUploadResponse = { id: 'file-789', name: 'test.pdf' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file-789', name: 'test.pdf' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return additionalFields;
				return undefined;
			});
		mockGetFileIdsByExternalFileId.mockResolvedValue([fileId]);
		mockDeleteFilesByIds.mockResolvedValue(undefined);
		mockUploadFile.mockResolvedValue(mockUploadResponse);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('inputDataFieldName', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('externalFileId', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('additionalFields', index);
		
		expect(mockGetFileIdsByExternalFileId).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
			undefined,
		);

		expect(mockDeleteFilesByIds).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			[fileId],
			undefined,
		);

		expect(mockUploadFile).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
			additionalFields,
			index,
			inputDataFieldName,
			undefined,
		);
		
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockUploadResponse);
		expect(result).toEqual(mockReturnData);
	});

	it('should upload file even when no files are found to delete', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const additionalFields = {};
		const mockUploadResponse = { id: 'file-new', name: 'test.pdf' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file-new', name: 'test.pdf' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return additionalFields;
				return undefined;
			});
		mockGetFileIdsByExternalFileId.mockResolvedValue([]);
		mockDeleteFilesByIds.mockResolvedValue(undefined);
		mockUploadFile.mockResolvedValue(mockUploadResponse);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockDeleteFilesByIds).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			[],
			undefined,
		);
		expect(mockUploadFile).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
			additionalFields,
			index,
			inputDataFieldName,
			undefined,
		);
		expect(result).toEqual(mockReturnData);
	});

	it('should successfully update a file with additional metadata', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const fileId = 'file-456';
		const additionalFields = {
			metadata: {
				metadataValues: [
					{ key: 'category', value: 'document' },
					{ key: 'source', value: 'test' },
				],
			},
		};
		const mockUploadResponse = { id: 'file-789', name: 'test.pdf' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file-789', name: 'test.pdf' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return additionalFields;
				return undefined;
			});
		mockGetFileIdsByExternalFileId.mockResolvedValue([fileId]);
		mockDeleteFilesByIds.mockResolvedValue(undefined);
		mockUploadFile.mockResolvedValue(mockUploadResponse);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockUploadFile).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
			additionalFields,
			index,
			inputDataFieldName,
			undefined,
		);
		expect(result).toEqual(mockReturnData);
	});

	it('should throw an error if external file ID is missing', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = '';

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'External file ID is required to update a file.',
		);
		expect(mockGetFileIdsByExternalFileId).not.toHaveBeenCalled();
		expect(mockDeleteFilesByIds).not.toHaveBeenCalled();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should throw an error if external file ID is null', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = null;

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				return undefined;
			});

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow(
			'External file ID is required to update a file.',
		);
		expect(mockGetFileIdsByExternalFileId).not.toHaveBeenCalled();
		expect(mockDeleteFilesByIds).not.toHaveBeenCalled();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should handle API request errors during delete', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const fileId = 'file-456';
		const error = new Error('Delete API request failed');

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockGetFileIdsByExternalFileId.mockResolvedValue([fileId]);
		mockDeleteFilesByIds.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('Delete API request failed');
		expect(mockGetFileIdsByExternalFileId).toHaveBeenCalled();
		expect(mockDeleteFilesByIds).toHaveBeenCalled();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should handle API request errors during upload', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const fileId = 'file-456';
		const error = new Error('Upload API request failed');

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockGetFileIdsByExternalFileId.mockResolvedValue([fileId]);
		mockDeleteFilesByIds.mockResolvedValue(undefined);
		mockUploadFile.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('Upload API request failed');
		expect(mockGetFileIdsByExternalFileId).toHaveBeenCalled();
		expect(mockDeleteFilesByIds).toHaveBeenCalled();
		expect(mockUploadFile).toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should handle errors from getFileIdsByExternalFileId', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const error = new Error('Failed to get file IDs');

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockGetFileIdsByExternalFileId.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('Failed to get file IDs');
		expect(mockGetFileIdsByExternalFileId).toHaveBeenCalled();
		expect(mockDeleteFilesByIds).not.toHaveBeenCalled();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});
});

