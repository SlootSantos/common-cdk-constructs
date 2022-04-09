import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { pipelines, StackProps } from "aws-cdk-lib";

import { BaseStage } from "./baseStage";
import { IApplicationStack } from "./types";

interface PipelineStageConfig {
  id: string;
  targetAccount: string;
  applicationName: string;
  requireApproval?: boolean;
}

interface BasePipelineProps extends StackProps {
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

export class BasePipeline {
  constructor(scope: Construct, id: string, props: BasePipelineProps) {
    const pipeline = this.buildPipeline(
      scope,
      props.config.name,
      props.config.mainInput,
      props.config.autobuilds,
      props.config.prebuildCommands
    );

    this.addStages(
      scope,
      props.config.stages,
      props.config.application,
      props.config.buildInput,
      pipeline
    );
  }

  buildPipeline(
    scope: Construct,
    name: string,
    input: pipelines.CodePipelineSource,
    autobuilds: Record<string, pipelines.CodePipelineSource> = {},
    prebuildCommands?: string[]
  ) {
    const buildCommands = prebuildCommands?.length
      ? ["pwd", "npm ci", ...prebuildCommands, "npm run build", "npx cdk synth"]
      : ["pwd", "npm ci", "npm run build", "npx cdk synth"];

    return new pipelines.CodePipeline(scope, name, {
      crossAccountKeys: true,
      synth: new pipelines.ShellStep("Synth", {
        input,
        additionalInputs: autobuilds,
        commands: buildCommands,
      }),
    });
  }

  addStages(
    scope: Construct,
    stages: PipelineStageConfig[],
    application: IApplicationStack,
    buildInput: pipelines.CodePipelineSource = null,
    pipeline: pipelines.CodePipeline
  ) {
    const manualApprovalStep = {
      pre: [new pipelines.ManualApprovalStep("BlockPromotion")],
    };

    stages.forEach((stage) => {
      const appStage = new BaseStage(scope, stage.id, {
        stack: application,
        applicationName: stage.applicationName,
        env: {
          account: stage.targetAccount,
          region: "eu-central-1",
        },
      });

      const pipelineStage = pipeline.addStage(
        appStage,
        stage.requireApproval ? manualApprovalStep : undefined
      );

      const postBuildStep = appStage.getBuildStep(
        buildInput,
        stage.targetAccount
      );

      if (postBuildStep) {
        pipelineStage.addPost(postBuildStep);
      }
    });
  }
}
