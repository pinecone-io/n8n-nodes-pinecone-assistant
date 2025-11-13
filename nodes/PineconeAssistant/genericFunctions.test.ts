import type {
	IExecuteFunctions,
	IDataObject,
} from 'n8n-workflow';
import { apiRequest, getFiles, getFileIdByExternalFileId } from './genericFunctions';

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
		it('should fetch files without metadata filter', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const metadataFilter = undefined;
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
				metadataFilter,
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

		it('should fetch files with multiple metadata filters', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const metadataFilter: IDataObject = {
				metadataFilterValues: [
					{ key: 'category', value: 'documentation' },
					{ key: 'status', value: 'active' },
				],
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
				metadataFilter,
			);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			expect(callArgs.url).toContain(encodeURIComponent(JSON.stringify({ category: 'documentation', status: 'active' })));
			expect(result).toEqual(mockResponse);
		});		

		it('should handle metadata filter with single metadata filter', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const metadataFilter: IDataObject = {
				metadataFilterValues: [{ key: 'category', value: 'documentation' }],
			};
			const mockResponse = [{ id: 'file1', name: 'test.pdf' }];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFiles.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				metadataFilter,
			);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			const filterParam = callArgs.url.split('?filter=')[1];
			const decodedFilter = JSON.parse(decodeURIComponent(filterParam));
			expect(decodedFilter).toEqual({ category: 'documentation' });
			expect(result).toEqual(mockResponse);
		});

        it('should handle empty metadata filter values array', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const metadataFilter: IDataObject = {
				metadataFilterValues: [],
			};
			const mockResponse: unknown[] = [];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			await getFiles.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				metadataFilter,
			);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toBe(`${assistantHostUrl}/assistant/files/${assistantName}`);
			expect(callArgs.url).not.toContain('?filter=');
		});

		it('should not add filter parameter when metadataFilter is undefined', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const metadataFilter = undefined;
			const mockResponse: unknown[] = [];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			await getFiles.call(mockExecuteFunctions, assistantName, assistantHostUrl, metadataFilter);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toBe(`${assistantHostUrl}/assistant/files/${assistantName}`);
			expect(callArgs.url).not.toContain('?filter=');
		});

		it('should not add filter parameter when metadataFilterValues is missing', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const metadataFilter: IDataObject = {};
			const mockResponse: unknown[] = [];

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			await getFiles.call(mockExecuteFunctions, assistantName, assistantHostUrl, metadataFilter);

			// Assert
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toBe(`${assistantHostUrl}/assistant/files/${assistantName}`);
			expect(callArgs.url).not.toContain('?filter=');
		});
	});

	describe('getFileIdByExternalFileId', () => {
		it('should return file ID when exactly one file is found', async () => {
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
			const result = await getFileIdByExternalFileId.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				externalFileId,
			);

			// Assert
			expect(result).toBe('file-456');
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			const filterParam = callArgs.url.split('?filter=')[1];
			const decodedFilter = JSON.parse(decodeURIComponent(filterParam));
			expect(decodedFilter).toEqual({ external_file_id: 'external-123' });
		});

		it('should return undefined when no files are found', async () => {
			// Arrange
			const assistantName = 'test-assistant';
			const assistantHostUrl = 'https://prod-1-data.ke.pinecone.io';
			const externalFileId = 'external-123';
			const mockResponse = {
				files: [],
			};

			mockHttpRequest.mockResolvedValue(mockResponse);

			// Act
			const result = await getFileIdByExternalFileId.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				externalFileId,
			);

			// Assert
			expect(result).toBeUndefined();
		});

		it('should return undefined when more than one file is found', async () => {
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
			const result = await getFileIdByExternalFileId.call(
				mockExecuteFunctions,
				assistantName,
				assistantHostUrl,
				externalFileId,
			);

			// Assert
			expect(result).toBeUndefined();
			const callArgs = mockHttpRequest.mock.calls[0][1];
			expect(callArgs.url).toContain('files/test-assistant?filter=');
			const filterParam = callArgs.url.split('?filter=')[1];
			const decodedFilter = JSON.parse(decodeURIComponent(filterParam));
			expect(decodedFilter).toEqual({ external_file_id: 'external-123' });
		});
	});
});

