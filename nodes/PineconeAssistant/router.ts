import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from "n8n-workflow";

import * as getContextSnippets from './actions/getContextSnippets';
import * as listAssistants from './actions/listAssistants';
import * as listFiles from './actions/listFiles';
import * as uploadFile from './actions/uploadFile';
import * as updateFile from './actions/updateFile';
import * as deleteFile from './actions/deleteFile';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        this.logger.debug(`Router called`);
    	const items = this.getInputData();
		this.logger.debug(`Items: ${JSON.stringify(items)}`);
        const returnData: INodeExecutionData[] = [];
        let responseData: IDataObject | IDataObject[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
				
		this.logger.debug(`Resource: ${resource}`);
		this.logger.debug(`Operation: ${operation}`);
		
        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'contextSnippet' && operation === 'getContextSnippets') {
                    responseData = await getContextSnippets.execute.call(this, i);
                } else if (resource === 'assistant' && operation === 'listAssistants') {
                    responseData = await listAssistants.execute.call(this);
                } else if (resource === 'file' && operation === 'listFiles') {
                    responseData = await listFiles.execute.call(this, i);
                } else if (resource === 'file' && operation === 'uploadFile') {
                    responseData = await uploadFile.execute.call(this, i);
                } else if (resource === 'file' && operation === 'updateFile') {
                    responseData = await updateFile.execute.call(this, i);
                } else if (resource === 'file' && operation === 'deleteFile') {
                    responseData = await deleteFile.execute.call(this, i);
                } else {
					throw new NodeOperationError(this.getNode(), `Unhandled resource/operation: "${resource}" / "${operation}"`, {
						itemIndex: i,
					});
				}
    
                const executionData = this.helpers.constructExecutionMetaData(
                    this.helpers.returnJsonArray(responseData),
                    { itemData: { item: i } },
                );
                returnData.push(...executionData);
            } catch (err) {
                if (this.continueOnFail()) {
                    returnData.push({ json: this.getInputData(i)[0].json, error: err });
                } else {
                    if (err.context) err.context.itemIndex = i;
                    throw err;
                }
            }
        }

    return [returnData];
}