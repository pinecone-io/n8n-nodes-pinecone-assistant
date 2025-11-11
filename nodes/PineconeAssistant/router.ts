import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from "n8n-workflow";

import * as contextSnippets from './contextSnippets';
import * as assistants from './assistants';
import * as files from './files';

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
                    responseData = await contextSnippets.execute.call(this, i);
                } else if (resource === 'assistant' && operation === 'listAssistants') {
                    responseData = await assistants.execute.call(this);
                } else if (resource === 'file' && operation === 'listFiles') {
                    responseData = await files.execute.call(this, i);
                } else if (resource === 'file' && operation === 'uploadFile') {
                    responseData = await files.uploadFile.call(this, i);
                }
                 else {
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