import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import {
  PRODUCTS_TABLE_NAME,
  STOCKS_TABLE_NAME,
} from "../constants/dynamodb";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: PRODUCTS_TABLE_NAME,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stocksTable = new dynamodb.Table(this, "StocksTable", {
      tableName: STOCKS_TABLE_NAME,
      partitionKey: {
        name: "product_id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaEnv = {
      PRODUCTS_TABLE_NAME,
      STOCKS_TABLE_NAME,
    };

    const bundling = {
      minify: true,
      sourceMap: true,
    };

    const getProductsList = new NodejsFunction(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "getProductsList",
      entry: path.join(__dirname, "../src/lambda/getProductsList.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnv,
      bundling,
    });

    const getProductsById = new NodejsFunction(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "getProductsById",
      entry: path.join(__dirname, "../src/lambda/getProductsById.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnv,
      bundling,
    });

    const createProduct = new NodejsFunction(this, "createProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "createProduct",
      entry: path.join(__dirname, "../src/lambda/createProduct.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnv,
      bundling,
    });

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);
    createProduct.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:TransactWriteItems"],
        resources: [productsTable.tableArn, stocksTable.tableArn],
      }),
    );

    const api = new apigateway.RestApi(this, "ProductServiceApi", {
      restApiName: "Product Service",
      description: "Product Service API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const products = api.root.addResource("products");
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList),
    );
    products.addMethod("POST", new apigateway.LambdaIntegration(createProduct));

    const productById = products.addResource("{productId}");
    productById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsById),
    );

    new cdk.CfnOutput(this, "ProductServiceApiUrl", {
      value: api.urlForPath("/products"),
      description: "Base URL for /products (GET list, POST create)",
    });

    new cdk.CfnOutput(this, "ProductServiceApiId", {
      value: api.restApiId,
      description: "API Gateway REST API id",
    });

    new cdk.CfnOutput(this, "ProductsTableName", {
      value: productsTable.tableName,
      description: "DynamoDB products table name",
    });

    new cdk.CfnOutput(this, "StocksTableName", {
      value: stocksTable.tableName,
      description: "DynamoDB stocks table name",
    });
  }
}
