import { Construct } from "constructs";
import { pipelines, Stage } from "aws-cdk-lib";

import {
  BasePipelineProps,
  IApplicationStack,
  PipelineStageConfig,
} from "./types";
import { BaseStage } from "./baseStage";
import { ComputeType } from "aws-cdk-lib/aws-codebuild";

export class BasePipeline {
  constructor(scope: Construct, id: string, props: BasePipelineProps) {
    const pipeline = this.buildPipeline(
      scope,
      props.config.name,
      props.config.mainInput,
      props.config.autobuilds,
      props.config.prebuildCommands
    );

    this.addGlobalStages(props.config.globalStages, pipeline);

    this.addApplicationStages(
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
      dockerEnabledForSynth: true,
      codeBuildDefaults: {
        buildEnvironment: {
          computeType: ComputeType.LARGE,
        },
      },
      synth: new pipelines.ShellStep("Synth", {
        input,
        additionalInputs: autobuilds,
        commands: buildCommands,
      }),
    });
  }

  addGlobalStages(
    globalStages: Stage[] | undefined,
    pipeline: pipelines.CodePipeline
  ) {
    if (globalStages?.length) {
      globalStages.forEach((stage) => {
        pipeline.addStage(stage);
      });
    }
  }

  addApplicationStages(
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
        stageConfig: stage,
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
