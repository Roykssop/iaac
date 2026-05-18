import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class IaacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const handlerPath = 'lib/functions/handler.ts';

    // Sqs Queue
    const pendingOrdersQueue = new Queue(this, 'PendingOrdersQueue', {});

    // Lambda Function
    const newOrderFunction = new lambda.NodejsFunction(this, 'NewOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: handlerPath,
      handler: 'newOrder',
    });

    // Lambda Function
    const getOrderFunction = new lambda.NodejsFunction(this, 'GetOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: handlerPath,
      handler: 'getOrder',
    });

    // Lambda Function
    const prepOrderFunction = new lambda.NodejsFunction(this, 'PrepOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: handlerPath,
      handler: 'prepOrder',
    });

    // Event Sourcing
    prepOrderFunction.addEventSource(new SqsEventSource(pendingOrdersQueue, {
      batchSize: 1 // Ejecuta llamada a función por cada mensaje en la queue
    }))


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
