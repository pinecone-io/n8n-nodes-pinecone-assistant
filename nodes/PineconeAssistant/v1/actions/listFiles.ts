import { type IExecuteFunctions, type IDataObject, type INodeExecutionData, NodeOperationError, jsonParse } from 'n8n-workflow';

import { getFiles, constructMetadataValues, type AssistantData } from '../genericFunctions';

export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {	
	const assistantData = this.getNodeParameter('assistantData', index) as string;
	const { name: assistantName, host: assistantHostUrl } = JSON.parse(assistantData) as AssistantData;

	// Handle additional fields
	const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

	// Only one of metadataFilter or advancedMetadataFilter can be set, not both
	if (additionalFields?.metadataFilter && additionalFields?.advancedMetadataFilter) {
		throw new NodeOperationError(
			this.getNode(),
			'Only one of metadataFilter or advancedMetadataFilter can be set, not both',
			{ itemIndex: index },
		);
	}

	// Simple metadata filter
	let filterValues: IDataObject | null | undefined;
	if (additionalFields && additionalFields.metadataFilter) {
		const metadataFilter = additionalFields.metadataFilter as IDataObject;
		filterValues = constructMetadataValues(metadataFilter);
	}

	// Advanced metadata filter
	if (additionalFields?.advancedMetadataFilter) {
		const filterValue = additionalFields.advancedMetadataFilter;

		try {
			filterValues = jsonParse<IDataObject>(filterValue as string);
		} catch (parseError) {
			throw new NodeOperationError(this.getNode(), `Invalid JSON in advancedMetadataFilter: ${parseError.message}. Please ensure it is valid JSON.`, { itemIndex: index });
		}
	}
	
	const responseData = await getFiles.call(this, assistantName, assistantHostUrl, filterValues);

	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}