import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

export class IaacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const handlerPath = 'lib/functions/handler.ts';

    // Sqs Queue
    const pendingOrdersQueue = new Queue(this, 'PendingOrdersQueue', {});
    const ordersToSendQueue = new Queue(this, 'ToSendOrdersQueue', {});

    // DynamoDB
    const ordersTable = new Table(this, 'OrdersTable', {
      billingMode: BillingMode.PROVISIONED,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      readCapacity: 2,
      writeCapacity: 1
    });

    // Lambda Function
    const newOrderFunction = new lambda.NodejsFunction(this, 'NewOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: handlerPath,
      handler: 'newOrder',
      environment: {
        PENDING_ORDERS_QUEUE_URL: pendingOrdersQueue.queueUrl,
        ORDERS_TABLE_NAME: ordersTable.tableName,
      }
    });

    // Permissions: Granting send messages from newOrderFunction to pendingOrdersQueue
    pendingOrdersQueue.grantSendMessages(newOrderFunction)

    // Lambda Function
    const getOrderFunction = new lambda.NodejsFunction(this, 'GetOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: handlerPath,
      handler: 'getOrder',
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
      }
    });

    // Lambda Function
    const prepOrderFunction = new lambda.NodejsFunction(this, 'PrepOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: handlerPath,
      handler: 'prepOrder',
      environment: {
        ORDERS_TABLE_NAME: ordersTable.tableName,
      }
    });

    // Lambda Function

    const sendOrderFunction = new lambda.NodejsFunction(this, 'SendOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: handlerPath,
      handler: 'sendOrder',
      environment: {
        ORDERS_TO_SEND_QUEUE_URL: ordersToSendQueue.queueUrl
      }
    })

    // Permissions: Granting send messages from sendOrderFunction to ordersToSendQueue
    ordersToSendQueue.grantSendMessages(sendOrderFunction);

    // Event Sourcing
    prepOrderFunction.addEventSource(new SqsEventSource(pendingOrdersQueue, {
      batchSize: 1 // Ejecuta llamada a función por cada mensaje en la queue
    }));

    // Permissions: Granting data writing from newOrderFunction to ordersTable
    ordersTable.grantWriteData(newOrderFunction);
    ordersTable.grantWriteData(prepOrderFunction);
    ordersTable.grantReadData(getOrderFunction);


    // Api Gateway Service
    const api = new apigateway.RestApi(this, 'OrderApi', {
      restApiName: 'Order CDK Service'
    });

    const orderResource = api.root.addResource('order');
    orderResource.addMethod('POST', new apigateway.LambdaIntegration(newOrderFunction));
    orderResource.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(getOrderFunction));

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'IaacQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
