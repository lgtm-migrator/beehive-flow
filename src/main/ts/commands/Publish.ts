import * as cs from 'cross-spawn-promise';
import { gitP } from 'simple-git';
import { PublishArgs } from '../args/BeehiveArgs';
import { getBranchDetails } from '../core/BranchLogic';
import * as NpmTags from '../core/NpmTags';
import * as Version from '../core/Version';

export const publish = async (args: PublishArgs): Promise<void> => {
  const dir = args.workingDir;
  const git = gitP(dir);
  const r = await getBranchDetails(dir);

  const tags = await NpmTags.pickTagsGit(r.currentBranch, r.branchState, git);
  const [ mainTag ] = tags;

  const dryRunArgs = args.dryRun ? [ '--dry-run' ] : [];

  const publishCmd = [ 'publish', '--tag', mainTag, ...dryRunArgs ];

  console.log([ 'npm', ...publishCmd ].join(' '));

  await cs('npm', publishCmd, { stdio: 'inherit', cwd: dir });

  /*
    Yes, we're setting the mainTag again in this loop.
    If this is the very first publish of a package, the --tag above is ignored
    and "latest" is used. At least on Verdaccio - need to test other NPM registries.
    Even if the extra dist-tag call is not required, it doesn't hurt.
   */
  if (args.dryRun) {
    console.log('dry run - not tagging');
    console.log('Would have added tags: ', tags);
  } else {
    for (const t of tags) {
      const fullPackageName = r.packageJson.name + '@' + Version.versionToString(r.version);
      const tagCmd = [ 'dist-tag', 'add', fullPackageName, t ];
      console.log([ 'npm', ...tagCmd ].join(' '));
      await cs('npm', tagCmd, { stdio: 'inherit', cwd: dir });
    }
  }
};