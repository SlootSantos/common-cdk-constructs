import { Construct } from "constructs";
import { CodeBuildStep } from "aws-cdk-lib/pipelines";
import { aws_iam, CfnOutput, pipelines, StackProps } from "aws-cdk-lib";

export interface PipelineStageConfig {
  id: string;
  targetAccount: string;
  applicationName: string;
  requireApproval?: boolean;
}

export interface BasePipelineProps extends StackProps {
  config: {
    /**
     * Name to deploy the pipeline with.
     *
     * @default - none.
     * @stability stable
     */
    name: string;
    /**
     * The stages to deploy in the pipeline
     * stages will deploy the application provided into the targetaccounts provided
     *
     * @default - none.
     * @stability stable
     */
    stages: PipelineStageConfig[];
    /**
     * Application to be deployed in the individual stages into the targetaccounts provided
     *
     * @default - none.
     * @stability stable
     */
    application: IApplicationStack;
    /**
     * Main source code input
     * often will be the CDK package
     * this source package will be the root directory for following build steps
     *
     * @default - none.
     * @stability stable
     */
    mainInput: pipelines.CodePipelineSource;
    /**
     * Source code input that should be deployed into created infrastructure
     * often will be the asset package (nodejs application, go application etc)
     *
     * @default - none.
     * @stability stable
     */
    buildInput?: pipelines.CodePipelineSource;
    /**
     * Autobuild packages to trigger pipeline releases
     *
     * @default - {}
     * @stability stable
     */
    autobuilds?: Record<string, pipelines.CodePipelineSource>;
    /**
     * Commands to execute before the cdk build & synth commands
     *
     * @default - none.
     * @stability stable
     */
    prebuildCommands?: string[];
  };
}

/**
 * Interface for ApplicationStack Class props
 *
 * Optional parameters passed to the ApplicationStack class
 *
 * @stability stable
 */
export interface ApplicationStackProps extends StackProps {
  stageConfig: PipelineStageConfig;
}

/**
 * Interface for ApplicationStack Class
 *
 * Applications to be built into the pipeline need to implement this class
 *
 * @stability stable
 */
export interface IApplicationStack {
  new (
    scope: Construct,
    id: string,
    props?: ApplicationStackProps
  ): ApplicationStack;
}

export interface BaseCfnOutputs {
  deploymentRole: CfnOutput;
}

/**
 * Class type required by the base stage to be built into pipeline stages
 *
 * Applications to be built into the pipeline need to implement this class
 *
 * @stability stable
 */
export declare class ApplicationStack {
  constructor(scope: Construct, id?: string, props?: StackProps);
  baseName: string;
  stackCfnOutputs: { deploymentRole: CfnOutput };
  build(scope: Construct): void;
  getName(suffix: string): string;
  getBuildStep: (
    input: pipelines.CodePipelineSource,
    deployerRole: aws_iam.Role
  ) => CodeBuildStep | null;
}

/**
 * Function type used to construct resources within applications that implement the ApplicationStack class
 *
 * Applications to be built into the pipeline need to implement this class
 * Adds a permission to the role's default policy document.
 *
 * If there is no default policy attached to this role, it will be created.
 *
 * @param scope The cdk construct to be build into
 * @param getName The function to construct the resources name with a provided prefix
 * @param stackResources The object providing already build resources and to build the new resource into
 * @param stackOutputs The object providing already build CFN outputs and to build the new CFN output into
 *
 * @stability stable
 */
export type ResourceBuilder<Resources, Outputs> = (
  scope: Construct,
  getName: (suffix: string) => string,
  stackResources: Resources,
  stackOutputs: Outputs,
  customBuilderConfig?: Record<string, any>
) => void;
