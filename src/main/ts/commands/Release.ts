import { ReleaseArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import * as PackageJson from '../core/PackageJson';
import * as PromiseUtils from '../utils/PromiseUtils';
import { BranchState, getBranchDetails } from '../core/BranchLogic';
import { printHeaderMessage } from '../core/Messages';

type Version = Version.Version;
const { versionToString } = Version;

export const updateVersion = (version: Version): Version => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch
});

export const release = async (args: ReleaseArgs): Promise<void> => {
  printHeaderMessage(args);
  const gitUrl = await Git.resolveGitUrl(args.gitUrl, args.workingDir);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, args.temp);

  await Git.checkout(git, args.branchName);

  const branchDetails = await getBranchDetails(dir);
  if (branchDetails.branchState !== BranchState.ReleaseCandidate) {
    return PromiseUtils.fail('Branch is not in Release Candidate state - can\'t release.');
  }

  const newVersion = updateVersion(branchDetails.version);
  console.log(`Updating version from ${versionToString(branchDetails.version)} to ${versionToString(newVersion)}`);

  await PackageJson.writePackageJsonFileWithNewVersion(branchDetails.packageJson, newVersion, branchDetails.packageJsonFile);

  await git.add(branchDetails.packageJsonFile);
  await git.commit('Branch is ready for release - setting release version');

  await Git.pushUnlessDryRun(dir, git, args.dryRun);
};
