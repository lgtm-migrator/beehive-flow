# beehive-flow

Beehive Flow is a git branching process and a supporting CLI tool. It is designed for packaged software and libraries, 
particularly those with many past versions requiring active support. Beehive Flow is prescriptive about what the project's
version numbers are and how they change through the branching process. CI is explicitly considered in the process, 
with a set of commands to be run at different stages of the build. 

Beehive Flow is designed to support publishing prerelease versions of each build of each branch. It does this by timestamping
version numbers at the start of a build. 

Beehive Flow is similar to [GitLab flow with release versions](https://docs.gitlab.com/ee/topics/gitlab_flow.html#release-branches-with-gitlab-flow),
and is compatible with Semantic Versioning. It also takes inspiration from [git-flow](https://nvie.com/posts/a-successful-git-branching-model/). 

This readme is the canonical definition of the branching process. This git repo implements the branch process for NPM projects. 
Support for monorepos using yarn workspaces is planned.

## Key concepts

- All new work happens in `feature/*` branches which are merged to the `main` branch.
- The `main` branch is branched to `release/x.y` branches to produce release candidates and releases.
- `hotfix/*` branches are used to make updates to `release/x.y` branches.
- The `beehive-flow` CLI tool defines several commands, used to perform key actions involved in branching and releasing.

## Branches

beehive-flow uses the following branch names, each forming part of the process:

 - main
 - release/x.y
 - feature/FEATURE_CODE
 - hotfix/FEATURE_CODE
 - spike/FEATURE_CODE
 
Note, there is no `develop` branch and `main` is used instead of `master` as it is GitHub's new default. 

Branch names are enforced and beehive-flow will fail if it encounters other branch names. 

### main branch

A single mainline branch called `main` is used. All features and fixes are merged first to the main branch (via feature branches).

If features need to be backported to older versions, commits should be cherry-picked to hotfix branches then merged to
release branches - more on this below.

```
  main
 (x.y.0-alpha)
  +---------+----------------------------------+------------------+
            |                                  |
            |                                  |
            |                                  |
            +-----------------+                +------------------+

             release/1.2                         release/1.3
             (1.2.x-rc / 1.2.x)                  (1.3.x-rc / 1.3.x)
```

### release branches

Release branches are named `release/x.y` where `x.y` is the major.minor version. These are branched off the `main` branch at the beginning of
*release preparation*. The release branch code is stabilised and then released. A release branch alternates between a "release candidate" state
and a "release ready" state - more on this below.

### feature branches

Feature branches are branched off `main` and named `feature/*`. All new work is done here. It doesn't matter if it's a feature, improvement, task, 
refactor, bugfix or any other type of change (except for spikes - see below).

```
                       feature/BLAH-123
  main                 +-----------
 (x.y.0-alpha)         |           \
  +---------+----------+------------+-----
            |                             
            |                             
            |                             
            +-----------------+           

             release/1.2                  
             (1.2.x-rc / 1.2.x)           
```

### spike branches

Spike branches are also branched off main and named `spike/*`. These are treated similarly to feature branches, but are just intended to indicate that
the work is experimental and not to be merged.

```
                       spike/BLAH-123
  main                 +-----------
 (x.y.0-alpha)         |           
  +---------+----------+-----------------
            |                            
            |                            
            |                            
            +-----------------+          

             release/1.2                 
             (1.2.x-rc / 1.2.x)          
```


### hotfix branches

Hotfix branches are branched off a release branch. These are used to add changes during release preparation. Similar to feature branches, it doesn't matter
what type of change is being made, the key part is that these are branched from a release branch. 

```
  main
 (x.y.0-alpha)
  +---------+--------------------------------+
            |              | |  cherry-pick and tweak
            |              | |
            |              ↓ ↓
            |            +---------+  hotfix/BLAH-123
            |            |          \
            +------------+-----------+---+

                   release/1.3
                   (1.3.x-rc / 1.3.x)
```

## Versions

Beehive Flow dictates a project's version scheme and how it changes through the branch process.   

The main branch should have a version `a.b.0-alpha`. As soon as a release branch is created, main's version should be incremented to `a.c.0-alpha`.  

The release branches start with a version `a.b.0-rc`. When stabilization is complete, the release branch version is changed to `a.b.0`. 
This indicates to CI that this version can now be released. Once release is complete, the version is changed to `a.b.1-rc`.

As you can see, a release branch exists in one of two states:

 - `a.b.c-rc` - release candidate state
 - `a.b.c` - release ready state

All patch releases for a major.minor release happen in the branch for the release/major.minor branch.

Feature branches have a version `a.b.0-alpha`, just like the main branch. 

Spike branches have a version `a.b.0-alpha`, just like the main branch. 

Hotfix branches have a version `a.b.c-rc`, just like a release branch. 

Note that feature/spike/hotfix branch versions are not validated by beehive-flow.

## Commands

Note: the `stamp`, `advance-ci` and `publish` commands operate on a checkout in the current working directory,
whereas the other commands make their own checkout.

### prepare

This signifies that the mainline is ready for stabilization.
`main` is branched as `release/a.b`, where `a.b` come from package.json

Version changes

 - `main`: `a.b.0-alpha` -> `a.c.0-alpha`
 - `release/a.b`: `a.b.0-rc`

### release a.b

This signifies that branch `release/a.b` is ready for release. 

Version changes:

 - `release/a.b`: `a.b.c-rc` -> `a.b.c`

### advance a.b

This signifies that branch `release/a.b` has been released and is ready to accept changes for the next patch release.

Version changes:

 - `release/a.b`: `a.b.c` -> `a.b.d-rc`

### advance-ci

This command is similar to `advance`, however:

 - it works in a current directory
 - if the current directory is not a release branch in release ready state, it exits successfully, whereas `advance` errors
 - it doesn't have the `git-url` or version parameters

### stamp

This command should be run at the start of a build. This command does the following:

 1. Checks that the package.json file has a valid version for the branch.
 2. Changes the version to a "timestamped" version, so that each build can be published.
 
The timestamping changes the package.json file. The idea is to build and publish, but not to commit the changes.

Versions are changed thus:

 - On the main branch, `a.b.0-alpha` becomes `a.b.0-alpha.TIMESTAMP.GITSHA`
 - On a feature branch, `a.b.0-*` becomes `a.b.0-feature.TIMESTAMP.GITSHA`
 - On a hotfix branch, `a.b.c-*` becomes `a.b.c-hotfix.TIMESTAMP.GITSHA`
 - On a spike branch, `a.b.c-*` becomes `a.b.c-spike.TIMESTAMP.GITSHA`
 - On a release branch in prerelease state, `a.b.c-rc` becomes `a.b.c-rc.TIMESTAMP.GITSHA`
 - On a release branch in release state, no changes are made.
 
Timestamp format is `yyyyMMddHHmmssSSS` in UTC. The short git sha format is used.

Note: this is the only command that operates on the checkout in the current working directory.

### publish

This command does an `npm publish` and sets npm tags based on the repository state.

 - All builds get tagged with their branch name 
   (replacing sequences of characters other than alphanumeric/dot/underscore with dashes)
 - If your repo is on a release branch in "release ready" state, and your release branch has the 
   greatest version number of all release branches, the build also gets tagged "latest".

Note: it appears that npm also tags the very first published build of each repo with "latest". 

## CI Instructions

CI needs to check out a real branch, not just a detached head.

At the start of the build, run `stamp`. If the build is successful, run `advance-ci`.

## FAQ

### How do I update my major version?

Set the version manually in package.json in your `main` branch. 
The idea is that you should decide what major.minor version you are releasing before running `prepare`.

### Does beehive-flow work with yarn workspaces, lerna or monorepos?

Not yet, but this is planned.

### Does beehive-flow work with any types of package other than NPM?

Not at this stage.
