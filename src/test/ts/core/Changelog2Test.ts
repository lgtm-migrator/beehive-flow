import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as E from 'fp-ts/Either';

import * as Changelog from '../../../main/ts/core/Changelog2';
import { pipe } from 'fp-ts/function';

describe('changelog', () => {

  const go = (input: string) =>
    pipe(
      Changelog.doParse(input),
      E.bimap(
        (error) => error.expected.join(','),
        (ok) => ok.value
      )
    );

  it('fails if starts with heading 2', () => {
    assert.deepEqual(go('## Changelog'), E.left('Expected heading 1 with exact text: "Changelog"'));
  });

  it('fails if starts with heading 1 with wrong text', () => {
    assert.isTrue(E.isLeft(Changelog.doParse(`# Changeblog`)));
  });

  it('fails if starts with heading 1 but is missing blurb', () => {
    assert.deepEqual(go(`# Changelog`), E.left('Expected section of text'));
  });

  it('parses changelog header text', () => {
    assert.isTrue(E.isLeft(Changelog.doParse(`# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`)));
  });

});