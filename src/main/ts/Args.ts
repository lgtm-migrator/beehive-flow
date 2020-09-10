import * as yargs from "yargs";

export interface FreezeCommand {
  kind: 'freeze'
}

export const freezeCommand = (): FreezeCommand => ({
  kind: 'freeze'
});

export type BeehiveCommand = FreezeCommand;

export const fold = <T> (bh: BeehiveCommand, ifFreeze: () => T): T => {
  if (bh.kind === 'freeze') {
    return ifFreeze();
  } else {
    throw new TypeError('Invalid command');
  }
}


const argParser =
  yargs
  .scriptName('beehive')
  .demandCommand(1)
  .command("freeze", "freezes the master branch");

export const getRealArgs = (): string[] =>
  process.argv.slice(2)

export const parseArgs = (args: string[]): Promise<BeehiveCommand> => new Promise((resolve, reject) => {
  const a: { _: string[]; $0: string } = argParser
  .strict()
  .parse(args);

  if (a._[0] === 'freeze') {
    resolve(freezeCommand());
  } else {
    reject();
  }
});

export const parseProcessArgs = async () =>
  await parseArgs(getRealArgs())
