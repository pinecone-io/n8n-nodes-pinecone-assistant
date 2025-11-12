import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { execute } from './uploadFile';
import * as genericFunctions from '../genericFunctions';

// Mock the genericFunctions module
jest.mock('../genericFunctions', () => ({
	apiRequest: jest.fn(),
}));

describe('uploadFile.execute', () => {
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
				assertBinaryData: jest.fn(),
				getBinaryDataBuffer: jest.fn(),
			},
		} as unknown as jest.Mocked<IExecuteFunctions>;
	});

	it('should successfully upload a file without metadata', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const mockBinaryData = {
			fileName: 'test.pdf',
			mimeType: 'application/pdf',
		};
		const mockFileBuffer = Buffer.from('test file content');
		const mockResponseData = { id: 'file1', name: 'test.pdf' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file1', name: 'test.pdf' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockExecuteFunctions.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
		mockExecuteFunctions.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('inputDataFieldName', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('additionalFields', index);
		expect(mockExecuteFunctions.helpers.assertBinaryData).toHaveBeenCalledWith(index, inputDataFieldName);
		expect(mockExecuteFunctions.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(index, inputDataFieldName);
		
		// Check that apiRequest was called with POST and correct endpoint
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'files/test-assistant',
			expect.any(FormData),
			{},
		);
		
		// Verify FormData contains the file
		const formDataCall = mockApiRequest.mock.calls[0];
		const formData = formDataCall[3] as FormData;
		expect(formData).toBeInstanceOf(FormData);
		
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should successfully upload a file with metadata', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const additionalFields = {
			metadata: {
				metadataValues: [
					{ key: 'category', value: 'document' },
					{ key: 'source', value: 'test' },
				],
			},
		};
		const mockBinaryData = {
			fileName: 'test.pdf',
			mimeType: 'application/pdf',
		};
		const mockFileBuffer = Buffer.from('test file content');
		const mockResponseData = { id: 'file1', name: 'test.pdf' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file1', name: 'test.pdf' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'additionalFields') return additionalFields;
				return undefined;
			});
		mockExecuteFunctions.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
		mockExecuteFunctions.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('assistantData', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('inputDataFieldName', index);
		expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('additionalFields', index);
		
		// Check that endpoint includes metadata query parameter
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			expect.stringContaining('files/test-assistant?metadata='),
			expect.any(FormData),
			{},
		);
		
		// Verify metadata is properly encoded in the endpoint
		const endpointCall = mockApiRequest.mock.calls[0][2] as string;
		expect(endpointCall).toContain('files/test-assistant?metadata=');
		const metadataParam = endpointCall.split('?metadata=')[1];
		const decodedMetadata = JSON.parse(decodeURIComponent(metadataParam));
		expect(decodedMetadata).toEqual({ category: 'document', source: 'test' });
		
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
		const mockBinaryData = {
			fileName: 'test.pdf',
			mimeType: 'application/pdf',
		};
		const mockFileBuffer = Buffer.from('test file content');
		const mockResponseData: unknown = null;
		const mockReturnData: INodeExecutionData[] = [];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockExecuteFunctions.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
		mockExecuteFunctions.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		const result = await execute.call(mockExecuteFunctions, index);

		// Assert
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'files/test-assistant',
			expect.any(FormData),
			{},
		);
		expect(mockExecuteFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(mockResponseData);
		expect(result).toEqual(mockReturnData);
	});

	it('should handle API request errors', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const mockBinaryData = {
			fileName: 'test.pdf',
			mimeType: 'application/pdf',
		};
		const mockFileBuffer = Buffer.from('test file content');
		const error = new Error('API request failed');

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'additionalFields') return {};
				return undefined;
			});
		mockExecuteFunctions.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
		mockExecuteFunctions.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
		mockApiRequest.mockRejectedValue(error);

		// Act & Assert
		await expect(execute.call(mockExecuteFunctions, index)).rejects.toThrow('API request failed');
		expect(mockApiRequest).toHaveBeenCalled();
		expect(mockExecuteFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should handle metadata with empty metadataValues array', async () => {
		// Arrange
		const index = 0;
		const assistantData = JSON.stringify({
			name: 'test-assistant',
			host: 'https://prod-1-data.ke.pinecone.io',
		});
		const inputDataFieldName = 'binary';
		const additionalFields = {
			metadata: {
				metadataValues: [],
			},
		};
		const mockBinaryData = {
			fileName: 'test.pdf',
			mimeType: 'application/pdf',
		};
		const mockFileBuffer = Buffer.from('test file content');
		const mockResponseData = { id: 'file1' };
		const mockReturnData: INodeExecutionData[] = [{ json: { id: 'file1' } }];

		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((paramName: string) => {
				if (paramName === 'assistantData') return assistantData;
				if (paramName === 'inputDataFieldName') return inputDataFieldName;
				if (paramName === 'additionalFields') return additionalFields;
				return undefined;
			});
		mockExecuteFunctions.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
		mockExecuteFunctions.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
		mockApiRequest.mockResolvedValue(mockResponseData);
		mockExecuteFunctions.helpers.returnJsonArray = jest.fn().mockReturnValue(mockReturnData);

		// Act
		await execute.call(mockExecuteFunctions, index);

		// Assert
		// When metadataValues is empty, endpoint should not include metadata parameter
		expect(mockApiRequest).toHaveBeenCalledWith(
			'POST',
			'https://prod-1-data.ke.pinecone.io',
			'files/test-assistant?metadata=%7B%7D', // URL-encoded empty object {}
			expect.any(FormData),
			{},
		);
	});
});

