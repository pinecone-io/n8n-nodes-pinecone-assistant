import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './uploadFile';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	uploadFile: jest.fn(),
}));

describe('uploadFile.execute', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	const mockUploadFile = genericFunctions.uploadFile as jest.MockedFunction<typeof genericFunctions.uploadFile>;

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

	it('should successfully upload a file without additional metadata including external file id', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const mockResponseData = { id: 'file1', name: 'test.pdf' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file1', name: 'test.pdf' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockUploadFile.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('inputDataFieldName', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('externalFileId', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('additionalFields', index);
		expect(mockUploadFile).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
			{},
			index,
			inputDataFieldName,
			undefined,
		);
		
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should successfully upload a file with metadata including external file id', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const additionalFields = {
			metadata: {
				metadataValues: [
					{ key: 'category', value: 'document' },
					{ key: 'source', value: 'test' },
				],
			},
		};
		const mockResponseData = { id: 'file1', name: 'test.pdf' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file1', name: 'test.pdf' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return additionalFields;
				return undefined;
			});
		mockUploadFile.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('inputDataFieldName', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('externalFileId', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('additionalFields', index);
		expect(mockUploadFile).toHaveBeenCalledWith(
			'test-assistant',
			'https://prod-1-data.ke.pinecone.io',
			'external-123',
			additionalFields,
			index,
			inputDataFieldName,
			undefined,
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
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const mockResponseData: unknown = null;
		const mockReturnData: INodeExecutionData[] = [];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockUploadFile.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should handle metadata with empty metadataValues array', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const externalFileId = 'external-123';
		const additionalFields = {
			metadata: {
				metadataValues: [],
			},
		};
		const mockResponseData = { id: 'file1' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file1' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'externalFileId') return externalFileId;
				if (paramName === 'additionalFields') return additionalFields;
				return undefined;
			});
		mockUploadFile.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

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
	});
});

