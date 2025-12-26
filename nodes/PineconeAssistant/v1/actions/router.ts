import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from "n8n-workflow";

import * as getContextSnippets from './getContextSnippets';
import * as listAssistants from './listAssistants';
import * as listFiles from './listFiles';
import * as uploadFile from './uploadFile';
import * as updateFile from './updateFile';
import * as deleteFile from './deleteFile';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    	const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        let responseData: IDataObject | IDataObject[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		
        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'contextSnippet' && operation === 'getContextSnippets') {
                    responseData = await getContextSnippets.execute.call(this, i);
                } else if (resource === 'assistant' && operation === 'listAssistants') {
                    responseData = await listAssistants.execute.call(this, i);
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