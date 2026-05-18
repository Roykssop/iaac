import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class IaacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Function
    const newOrderFunction = new lambda.NodejsFunction(this, 'NewOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: path.join(__dirname, 'functions/handler.ts'),
      handler: 'newOrder',
    });

    // Lambda Function
    const getOrderFunction = new lambda.NodejsFunction(this, 'GetOrderFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: path.join(__dirname, 'functions/handler.ts'),
      handler: 'getOrder',
    });

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
