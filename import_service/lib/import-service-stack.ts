import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { IMPORT_BUCKET_NAME, UPLOADED_PREFIX } from "../constants/s3";

/**
 * Import Service stack (Task 5).
 * S3 bucket for CSV uploads is created in the AWS Console (see README).
 * Later tasks add Lambdas, SQS, and API routes here.
 */
export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucketName = IMPORT_BUCKET_NAME;

    new cdk.CfnOutput(this, "UploadedPrefix", {
      value: UPLOADED_PREFIX,
      description: "S3 object key prefix for uploaded CSV files",
    });

    if (importBucketName) {
      new cdk.CfnOutput(this, "ImportBucketName", {
        value: importBucketName,
        description: "S3 bucket for product import (from IMPORT_BUCKET_NAME)",
      });
    }
  }
}
