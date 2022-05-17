import { Construct } from "constructs";
import { pipelines, Stage, StageProps } from "aws-cdk-lib";

import {
  ApplicationStack,
  IApplicationStack,
  PipelineStageConfig,
} from "./types";
import { pipelineDeployerRole } from "../services/iam/pipelineDeployerRole";

interface BaseStageProps extends StageProps {
  applicationName: string;
  stack: IApplicationStack;
  stageConfig: PipelineStageConfig;
}

export class BaseStage extends Stage {
  public stack: ApplicationStack;
  private scope: Construct;

  constructor(scope: Construct, id: string, props: BaseStageProps) {
    super(scope, id, props);
    this.scope = scope;
    this.stack = new props.stack(this, props.applicationName, {
      stageConfig: props.stageConfig,
    });
  }

  getBuildStep(input: pipelines.CodePipelineSource, targetAccount: string) {
    const targetRoleArn = this.stack.stackCfnOutputs.deploymentRole.value;
    const deployerRole = pipelineDeployerRole(
      this.scope,
      targetRoleArn,
      targetAccount
    );

    return this.stack.getBuildStep(input, deployerRole);
  }
}
