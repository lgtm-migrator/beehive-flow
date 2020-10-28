#!/usr/bin/env -S node

import * as Parser from './args/Parser';
import * as Dispatch from './args/Dispatch';

const main = async () => {
  const actualArgs = await Parser.parseProcessArgs();
  await Dispatch.dispatch(actualArgs);
};

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
