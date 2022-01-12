import { Construct } from "constructs";
import { pipelines, Stage, StageProps } from "aws-cdk-lib";

import { ApplicationStack, IApplicationStack } from "./types";
import { pipelineDeployerRole } from "../services/iam/pipelineDeployerRole";

interface BaseStageProps extends StageProps {
  applicationName: string;
  stack: IApplicationStack;
}

export class BaseStage extends Stage {
  public stack: ApplicationStack;

  constructor(scope: Construct, id: string, props: BaseStageProps) {
    super(scope, id, props);
    this.stack = new props.stack(this, props.applicationName);
  }

  getBuildStep(input: pipelines.CodePipelineSource, targetAccount: string) {
    const targetRoleArn = this.stack.stackCfnOutputs.deploymentRole.value;
    const deployerRole = pipelineDeployerRole(
      this,
      targetRoleArn,
      targetAccount
    );

    return this.stack.getBuildStep(input, deployerRole);
  }
}
