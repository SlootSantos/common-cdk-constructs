import { Construct } from "constructs";
import { pipelines, StackProps } from "aws-cdk-lib";

import { BaseStage } from "./baseStage";
import { IApplicationStack } from "./types";

interface PipelineStageConfig {
  id: string;
  targetAccount: string;
  requireApproval?: boolean;
}

interface BasePipelineProps extends StackProps {
  config: {
    name: string;
    stages: PipelineStageConfig[];
    application: IApplicationStack;
    mainInput: pipelines.CodePipelineSource;
    buildInput: pipelines.CodePipelineSource;
    autobuilds: Record<string, pipelines.CodePipelineSource>;
  };
}

export class BasePipeline {
  constructor(scope: Construct, id: string, props: BasePipelineProps) {
    const pipeline = this.buildPipeline(
      scope,
      props.config.name,
      props.config.mainInput,
      props.config.autobuilds
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
    autobuilds: Record<string, pipelines.CodePipelineSource>
  ) {
    return new pipelines.CodePipeline(scope, name, {
      crossAccountKeys: true,
      synth: new pipelines.ShellStep("Synth", {
        input,
        additionalInputs: autobuilds,
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });
  }

  addStages(
    scope: Construct,
    stages: PipelineStageConfig[],
    application: IApplicationStack,
    buildInput: pipelines.CodePipelineSource,
    pipeline: pipelines.CodePipeline
  ) {
    const manualApprovalStep = {
      pre: [new pipelines.ManualApprovalStep("BlockPromotion")],
    };

    stages.forEach((stage) => {
      const appStage = new BaseStage(scope, stage.id, {
        stack: application,
        env: {
          account: stage.targetAccount,
        },
      });

      const pipelineStage = pipeline.addStage(
        appStage,
        stage.requireApproval ? manualApprovalStep : undefined
      );

      pipelineStage.addPost(
        appStage.getBuildStep(buildInput, stage.targetAccount)
      );
    });
  }
}
