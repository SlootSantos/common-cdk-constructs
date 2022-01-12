import { aws_iam } from "aws-cdk-lib";
import { Construct } from "constructs";

export const pipelineDeployerRole = (
  scope: Construct,
  assumeTargetRoleArn: string,
  targetAccount: string
) => {
  const deployerRole = new aws_iam.Role(
    scope,
    `deployer-role-${targetAccount}`,
    {
      assumedBy: new aws_iam.ServicePrincipal("codebuild.amazonaws.com"),
    }
  );

  deployerRole.addToPolicy(
    new aws_iam.PolicyStatement({
      resources: [assumeTargetRoleArn],
      actions: ["sts:assumeRole"],
    })
  );

  deployerRole.addToPolicy(
    new aws_iam.PolicyStatement({
      resources: ["*"],
      actions: ["ssm:GetParameter"],
    })
  );

  return deployerRole;
};
