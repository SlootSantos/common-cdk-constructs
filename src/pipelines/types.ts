import { Construct } from "constructs";
import { CodeBuildStep } from "aws-cdk-lib/pipelines";
import { aws_iam, CfnOutput, pipelines, StackProps } from "aws-cdk-lib";

export interface IApplicationStack {
  new (scope: Construct, id: string, props?: StackProps): ApplicationStack;
}

export interface BaseCfnOutputs {
  deploymentRole: CfnOutput;
}
export declare class ApplicationStack {
  constructor(scope: Construct, id?: string, props?: StackProps);
  baseName: string;
  stackCfnOutputs: { deploymentRole: CfnOutput };
  build(scope: Construct): void;
  getName(suffix: string): string;
  getBuildStep: (
    input: pipelines.CodePipelineSource,
    deployerRole: aws_iam.Role
  ) => CodeBuildStep;
}

export type ResourceBuilder<Resources, Outputs> = (
  scope: Construct,
  getName: (suffix: string) => string,
  stackResources: Resources,
  stackOutputs: Outputs
) => void;
