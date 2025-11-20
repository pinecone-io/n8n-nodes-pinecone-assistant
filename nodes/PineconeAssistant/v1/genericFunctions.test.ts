import type {
	IExecuteFunctions,
	IDataObject,
} from 'n8n-workflow';
import { apiRequest, deleteFilesByIds, getFiles, getFileIdsByExternalFileId, uploadFile } from './genericFunctions';

describe('genericFunctions', () => {
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	let mockHttpRequest: jest.Mock;

	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();

		// Create mock for httpRequestWithAuthentication
		mockHttpRequest = jest.fn();

		// Create a mock IExecuteFunctions object
		mockExecuteFunctions = {
			helpers: {
				httpRequestWithAuthentication: mockHttpRequest,
			},
			logger: {
				debug: jest.fn(),
			},
		} as unknown as jest.Mocked<IExecuteFunctions>;
	});

	describe('apiRequest', () => {
		it('should make a GET request without file data', async () => {
			// Arrange
			const method = 'GET';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'assistants';
			const body = {};
			const query = { limit: 10 };
			const mockResponse = { assistants: [{ name: 'test-assistant' }] };

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await apiRequest.call(
				mockExecuteFunctions,
				method,
				baseUrl,
				endpoint,
				body,
				query,
			);

			// Assert
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'GET',
					url: `${baseUrl}/assistant/${endpoint}`,
					qs: query,
					json: true,
					headers: {
						'X-Pinecone-API-Version': '2025-04',
						'User-Agent': 'source_tag=n8n:n8n_nodes_pinecone_assistant',
					},
				}),
			);
			expect(mockHttpRequest.mock.calls[0][1]).not.toHaveProperty('body');
			expect(result).toEqual(mockResponse);
		});

		it('should make a POST request with JSON body', async () => {
			// Arrange
			const method = 'POST';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'files/test-assistant';
			const body = { name: 'test.pdf' };
			const mockResponse = { id: 'file1', name: 'test.pdf' };

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await apiRequest.call(
				mockExecuteFunctions,
				method,
				baseUrl,
				endpoint,
				body,
			);

			// Assert
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'POST',
					url: `${baseUrl}/assistant/${endpoint}`,
					body,
					qs: {},
					json: true,
					headers: {
						'X-Pinecone-API-Version': '2025-04',
						'User-Agent': 'source_tag=n8n:n8n_nodes_pinecone_assistant',
					},
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it('should make a POST request with file data (multipart/form-data)', async () => {
			// Arrange
			const method = 'POST';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'files/test-assistant';
			const fileBuffer = Buffer.from('test file content');
			const body = {
				file: {
					value: fileBuffer,
					options: {
						filename: 'test.pdf',
						contentType: 'application/pdf',
					},
				},
			};
			const mockResponse = { id: 'file1', name: 'test.pdf' };

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await apiRequest.call(
				mockExecuteFunctions,
				method,
				baseUrl,
				endpoint,
				body,
			);

			// Assert
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'POST',
					url: `${baseUrl}/assistant/${endpoint}`,
					body,
					qs: {},
					headers: {
						'X-Pinecone-API-Version': '2025-04',
						'User-Agent': 'source_tag=n8n:n8n_nodes_pinecone_assistant',
					},
				}),
			);
			// Should not have json: true for multipart requests
			expect(mockHttpRequest.mock.calls[0][1]).not.toHaveProperty('json');
			expect(result).toEqual(mockResponse);
		});

		it('should handle file data in old format (data property)', async () => {
			// Arrange
			const method = 'POST';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'files/test-assistant';
			const fileBuffer = Buffer.from('test file content');
			const body = {
				file: {
					data: fileBuffer,
					filename: 'test.pdf',
					contentType: 'application/pdf',
				},
			};
			const mockResponse = { id: 'file1', name: 'test.pdf' };

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await apiRequest.call(
				mockExecuteFunctions,
				method,
				baseUrl,
				endpoint,
				body,
			);

			// Assert
			expect(mockHttpRequest.mock.calls[0][1]).not.toHaveProperty('json');
			expect(result).toEqual(mockResponse);
		});

		it('should handle nested file data', async () => {
			// Arrange
			const method = 'POST';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'files/test-assistant';
			const fileBuffer = Buffer.from('test file content');
			const body = {
				nested: {
					file: {
						value: fileBuffer,
						options: {
							filename: 'test.pdf',
						},
					},
				},
			};
			const mockResponse = { id: 'file1', name: 'test.pdf' };

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await apiRequest.call(
				mockExecuteFunctions,
				method,
				baseUrl,
				endpoint,
				body,
			);

			// Assert
			expect(mockHttpRequest.mock.calls[0][1]).not.toHaveProperty('json');
			expect(result).toEqual(mockResponse);
		});

		it('should handle direct Buffer values', async () => {
			// Arrange
			const method = 'POST';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'files/test-assistant';
			const fileBuffer = Buffer.from('test file content');
			const body = {
				file: fileBuffer,
			};
			const mockResponse = { id: 'file1', name: 'test.pdf' };

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await apiRequest.call(
				mockExecuteFunctions,
				method,
				baseUrl,
				endpoint,
				body,
			);

			// Assert
			expect(mockHttpRequest.mock.calls[0][1]).not.toHaveProperty('json');
			expect(result).toEqual(mockResponse);
		});

		it('should use default empty query object when query is not provided', async () => {
			// Arrange
			const method = 'GET';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'assistants';
			const body = {};
			const mockResponse = { assistants: [] };

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await apiRequest.call(
				mockExecuteFunctions,
				method,
				baseUrl,
				endpoint,
				body,
			);

			// Assert
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					qs: {},
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it('should handle API request errors', async () => {
			// Arrange
			const method = 'GET';
			const baseUrl = 'https://prod-1-data.ke.pinecone.io';
			const endpoint = 'assistants';
			const body = {};
			const error = new Error('API request failed');

			mockHttpRequest.mockRejectedValue(error);

			// Act & Assert
			await expect(
				apiRequest.call(mockExecuteFunctions, method, baseUrl, endpoint, body),
			).rejects.toThrow('API request failed');
			expect(mockHttpRequest).toHaveBeenCalled();
		});
	});

	describe('getFiles', () => {
		it('should fetch files without filter values', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const filterValues = undefined;
			const mockResponse = [
				{ id: 'file1', name: 'test.pdf' },
				{ id: 'file2', name: 'document.docx' },
			];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFiles.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				filterValues,
			);

			// Assert
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'GET',
					url: `${assistantHostUrl}/assistant/files/${assistantName}`,
					qs: {},
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it('should fetch files with multiple filter values', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const filterValues: IDataObject = {
				category: 'documentation',
				status: 'active',
			};
			const mockResponse = [
				{
					id: 'file1',
					name: 'test.pdf',
					metadata: { category: 'documentation', status: 'active' },
				},
			];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFiles.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				filterValues,
			);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			expect(callArgs.url).toContain(encodeURIComponent(JSON.stringify({ category: 'documentation', status: 'active' })));
			expect(result).toEqual(mockResponse);
		});		

		it('should handle filter values with single value', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const filterValues: IDataObject = {
				category: 'documentation',
			};
			const mockResponse = [{ id: 'file1', name: 'test.pdf' }];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFiles.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				filterValues,
			);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			const filterParam = callArgs.url.split('?filter=')[1];
			const decodedFilter = JSON.parse(decodeURIComponent(filterParam));
			expect(decodedFilter).toEqual({ category: 'documentation' });
			expect(result).toEqual(mockResponse);
		});

        it('should not add filter parameter when filterValues is null', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const filterValues = null;
			const mockResponse: unknown[] = [];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			await getFiles.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				filterValues,
			);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toBe(`${assistantHostUrl}/assistant/files/${assistantName}`);
			expect(callArgs.url).not.toContain('?filter=');
		});

		it('should not add filter parameter when filterValues is undefined', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const filterValues = undefined;
			const mockResponse: unknown[] = [];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			await getFiles.call(mockExecuteFunctions, assistantName, assistantHostUrl, filterValues);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toBe(`${assistantHostUrl}/assistant/files/${assistantName}`);
			expect(callArgs.url).not.toContain('?filter=');
		});

		it('should not add filter parameter when filterValues is empty object', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const filterValues: IDataObject = {};
			const mockResponse: unknown[] = [];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			await getFiles.call(mockExecuteFunctions, assistantName, assistantHostUrl, filterValues);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toBe(`${assistantHostUrl}/assistant/files/${assistantName}`);
			expect(callArgs.url).not.toContain('?filter=');
		});
	});

	describe('getFileIdByExternalFileId', () => {
		it('should return list of file IDs when exactly one file is found', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const externalFileId = 'external-123';
			const mockResponse = {
				files: [
					{ id: 'file-456', name: 'test.pdf', metadata: { external_file_id: 'external-123' } },
				],
			};

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFileIdsByExternalFileId.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				externalFileId,
			);

			// Assert
			expect(result).toEqual(['file-456']);
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			const filterParam = callArgs.url.split('?filter=')[1];
			const decodedFilter = JSON.parse(decodeURIComponent(filterParam));
			expect(decodedFilter).toEqual({ external_file_id: 'external-123' });
		});

		it('should return empty array when no files are found', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const externalFileId = 'external-123';
			const mockResponse = {
				files: [],
			};

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFileIdsByExternalFileId.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				externalFileId,
			);

			// Assert
			expect(result).toEqual([]);
		});

		it('should return list of file IDs when more than one file is found', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const externalFileId = 'external-123';
			const mockResponse = {
				files: [
					{ id: 'file-456', name: 'test.pdf', metadata: { external_file_id: 'external-123' } },
					{ id: 'file-789', name: 'test2.pdf', metadata: { external_file_id: 'external-123' } },
				],
			};

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFileIdsByExternalFileId.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				externalFileId,
			);

			// Assert
			expect(result).toEqual(['file-456', 'file-789']);
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			const filterParam = callArgs.url.split('?filter=')[1];
			const decodedFilter = JSON.parse(decodeURIComponent(filterParam));
			expect(decodedFilter).toEqual({ external_file_id: 'external-123' });
		});
	});

	describe('uploadFile', () => {
		let mockExecuteFunctionsForUpload: jest.Mocked<IExecuteFunctions>;
		let mockHttpRequestForUpload: jest.Mock;

		beforeEach(() => {
			// Reset mocks
			jest.clearAllMocks();

			// Create mock for httpRequestWithAuthentication
			mockHttpRequestForUpload = jest.fn();

			// Create a mock IExecuteFunctions object with binary data helpers
			mockExecuteFunctionsForUpload = {
				helpers: {
					assertBinaryData: jest.fn(),
					getBinaryDataBuffer: jest.fn(),
					httpRequestWithAuthentication: mockHttpRequestForUpload,
				},
				logger: {
					debug: jest.fn(),
				},
			} as unknown as jest.Mocked<IExecuteFunctions>;
		});

		it('should upload file without additional metadata', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const externalFileId = 'external-123';
			const additionalFields = undefined;
			const index = 0;
			const inputDataFieldName = 'binary';
			const mockBinaryData = {
				fileName: 'test.pdf',
				mimeType: 'application/pdf',
			};
			const mockFileBuffer = Buffer.from('test file content');
			const mockResponse = { id: 'file1', name: 'test.pdf' };

			mockExecuteFunctionsForUpload.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
			mockExecuteFunctionsForUpload.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
			mockHttpRequestForUpload.mockResolvedValue(mockResponse);

			// Act
			const result = await uploadFile.call(
				mockExecuteFunctionsForUpload,
				assistantName,
				assistantHostUrl,
				externalFileId,
				additionalFields,
				index,
				inputDataFieldName,
			);

			// Assert
			expect(mockExecuteFunctionsForUpload.helpers.assertBinaryData).toHaveBeenCalledWith(index, inputDataFieldName);
			expect(mockExecuteFunctionsForUpload.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(index, inputDataFieldName);
			expect(mockHttpRequestForUpload).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'POST',
					url: expect.stringContaining('files/test-assistant?metadata='),
					body: expect.any(FormData),
					qs: {},
				}),
			);
			const callArgs = mockHttpRequestForUpload.mock.calls[0][1];
			const url = callArgs.url as string;
			expect(url).toContain('files/test-assistant?metadata=');
			const metadataParam = url.split('?metadata=')[1];
			const decodedMetadata = JSON.parse(decodeURIComponent(metadataParam));
			expect(decodedMetadata).toEqual({ external_file_id: 'external-123' });
			expect(result).toEqual(mockResponse);
		});

		it('should upload file with additional metadata', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const externalFileId = 'external-123';
			const additionalFields: IDataObject = {
				metadata: {
					metadataValues: [
						{ key: 'category', value: 'document' },
						{ key: 'source', value: 'test' },
					],
				},
			};
			const index = 0;
			const inputDataFieldName = 'binary';
			const mockBinaryData = {
				fileName: 'test.pdf',
				mimeType: 'application/pdf',
			};
			const mockFileBuffer = Buffer.from('test file content');
			const mockResponse = { id: 'file1', name: 'test.pdf' };

			mockExecuteFunctionsForUpload.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
			mockExecuteFunctionsForUpload.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
			mockHttpRequestForUpload.mockResolvedValue(mockResponse);

			// Act
			const result = await uploadFile.call(
				mockExecuteFunctionsForUpload,
				assistantName,
				assistantHostUrl,
				externalFileId,
				additionalFields,
				index,
				inputDataFieldName,
			);

			// Assert
			const callArgs = mockHttpRequestForUpload.mock.calls[0][1];
			const url = callArgs.url as string;
			expect(url).toContain('files/test-assistant?metadata=');
			const metadataParam = url.split('?metadata=')[1];
			const decodedMetadata = JSON.parse(decodeURIComponent(metadataParam));
			expect(decodedMetadata).toEqual({
				external_file_id: 'external-123',
				category: 'document',
				source: 'test',
			});
			expect(result).toEqual(mockResponse);
		});

		it('should upload file with empty metadata values array', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const externalFileId = 'external-123';
			const additionalFields: IDataObject = {
				metadata: {
					metadataValues: [],
				},
			};
			const index = 0;
			const inputDataFieldName = 'binary';
			const mockBinaryData = {
				fileName: 'test.pdf',
				mimeType: 'application/pdf',
			};
			const mockFileBuffer = Buffer.from('test file content');
			const mockResponse = { id: 'file1' };

			mockExecuteFunctionsForUpload.helpers.assertBinaryData = jest.fn().mockReturnValue(mockBinaryData);
			mockExecuteFunctionsForUpload.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockFileBuffer);
			mockHttpRequestForUpload.mockResolvedValue(mockResponse);

			// Act
			const result = await uploadFile.call(
				mockExecuteFunctionsForUpload,
				assistantName,
				assistantHostUrl,
				externalFileId,
				additionalFields,
				index,
				inputDataFieldName,
			);

			// Assert
			const callArgs = mockHttpRequestForUpload.mock.calls[0][1];
			const url = callArgs.url as string;
			expect(url).toContain('files/test-assistant?metadata=');
			const metadataParam = url.split('?metadata=')[1];
			const decodedMetadata = JSON.parse(decodeURIComponent(metadataParam));
			expect(decodedMetadata).toEqual({ external_file_id: 'external-123' });
			expect(result).toEqual(mockResponse);
		});
	});

	describe('deleteFilesByIds', () => {
		it('should delete a single file by ID', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const fileIds = ['file-456'];

			mockHttpRequest.mockResolvedValue(undefined);

			// Act
			await deleteFilesByIds.call(mockExecuteFunctions, assistantName, assistantHostUrl, fileIds);

			// Assert
			expect(mockHttpRequest).toHaveBeenCalledTimes(1);
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'DELETE',
					url: `${assistantHostUrl}/assistant/files/${assistantName}/${fileIds[0]}`,
					body: {},
					qs: {},
					json: true,
				}),
			);
		});

		it('should delete multiple files by IDs', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const fileIds = ['file-456', 'file-789', 'file-101'];

			mockHttpRequest.mockResolvedValue(undefined);

			// Act
			await deleteFilesByIds.call(mockExecuteFunctions, assistantName, assistantHostUrl, fileIds);

			// Assert
			expect(mockHttpRequest).toHaveBeenCalledTimes(3);
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'DELETE',
					url: `${assistantHostUrl}/assistant/files/${assistantName}/file-456`,
				}),
			);
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'DELETE',
					url: `${assistantHostUrl}/assistant/files/${assistantName}/file-789`,
				}),
			);
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'pineconeAssistantApi',
				expect.objectContaining({
					method: 'DELETE',
					url: `${assistantHostUrl}/assistant/files/${assistantName}/file-101`,
				}),
			);
		});

		it('should handle empty file IDs array', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const fileIds: string[] = [];

			// Act
			await deleteFilesByIds.call(mockExecuteFunctions, assistantName, assistantHostUrl, fileIds);

			// Assert
			expect(mockHttpRequest).not.toHaveBeenCalled();
		});

		it('should handle API request errors', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const fileIds = ['file-456'];
			const error = new Error('Delete API request failed');

			mockHttpRequest.mockRejectedValue(error);

			// Act & Assert
			await expect(
				deleteFilesByIds.call(mockExecuteFunctions, assistantName, assistantHostUrl, fileIds),
			).rejects.toThrow('Delete API request failed');
			expect(mockHttpRequest).toHaveBeenCalled();
		});

		it('should handle errors when deleting multiple files', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const fileIds = ['file-456', 'file-789'];
			const error = new Error('Delete API request failed');

			mockHttpRequest
				.mockResolvedValueOnce(undefined)
				.mockRejectedValueOnce(error);

			// Act & Assert
			await expect(
				deleteFilesByIds.call(mockExecuteFunctions, assistantName, assistantHostUrl, fileIds),
			).rejects.toThrow('Delete API request failed');
			expect(mockHttpRequest).toHaveBeenCalledTimes(2);
		});
	});
});

