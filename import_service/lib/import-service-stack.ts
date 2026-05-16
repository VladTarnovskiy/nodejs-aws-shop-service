import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import { IMPORT_BUCKET_NAME, UPLOADED_PREFIX } from "../constants/s3";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = s3.Bucket.fromBucketName(
      this,
      "ImportBucket",
      IMPORT_BUCKET_NAME,
    );

    const importProductsFile = new NodejsFunction(this, "importProductsFile", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "importProductsFile",
      entry: path.join(__dirname, "../src/lambda/importProductsFile.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(10),
      environment: {
        IMPORT_BUCKET_NAME,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    importBucket.grantPut(importProductsFile);

    const importFileParser = new NodejsFunction(this, "importFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "importFileParser",
      entry: path.join(__dirname, "../src/lambda/importFileParser.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      environment: {
        IMPORT_BUCKET_NAME,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    importBucket.grantRead(importFileParser);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: UPLOADED_PREFIX },
    );

    const api = new apigateway.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service",
      description: "Import Service API (presigned S3 upload URLs)",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      },
    );

    new cdk.CfnOutput(this, "ImportServiceApiUrl", {
      value: api.urlForPath("/"),
      description: "Base URL for import API (append import?name=file.csv)",
    });

    new cdk.CfnOutput(this, "UploadedPrefix", {
      value: UPLOADED_PREFIX,
      description: "S3 object key prefix for uploaded CSV files",
    });

    new cdk.CfnOutput(this, "ImportBucketName", {
      value: IMPORT_BUCKET_NAME,
      description: "S3 bucket used for import (from constants/s3.ts)",
    });
  }
}
