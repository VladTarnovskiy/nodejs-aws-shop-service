import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import { resolveAuthorizerCredentials } from "../utils/resolveAuthorizerCredentials";

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizerCredentials = resolveAuthorizerCredentials();

    this.basicAuthorizer = new NodejsFunction(this, "basicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "basicAuthorizer",
      entry: path.join(__dirname, "../src/lambda/basicAuthorizer.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(5),
      environment: authorizerCredentials,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    new cdk.CfnOutput(this, "BasicAuthorizerArn", {
      value: this.basicAuthorizer.functionArn,
      description: "ARN of basicAuthorizer Lambda (for API Gateway TOKEN authorizer)",
    });

    new cdk.CfnOutput(this, "BasicAuthorizerName", {
      value: this.basicAuthorizer.functionName,
      description: "Name of basicAuthorizer Lambda",
    });
  }
}
