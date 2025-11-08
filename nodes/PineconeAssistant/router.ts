import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from "n8n-workflow";

import * as contextSnippets from './contextSnippets';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    	const items = this.getInputData();
		this.logger.debug(`Items: ${JSON.stringify(items)}`);
        const returnData: INodeExecutionData[] = [];
        let responseData: IDataObject | IDataObject[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const assistantHostUrl = this.getNodeParameter('assistantHostUrl', 0) as string;
		
		this.logger.debug(`Resource: ${resource}`);
		this.logger.debug(`Operation: ${operation}`);
		this.logger.debug(`Assistant Host URL: ${assistantHostUrl}`);

        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'contextSnippet') {
                    responseData = await contextSnippets.execute.call(this, i);
                } else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: "${resource}"`, {
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