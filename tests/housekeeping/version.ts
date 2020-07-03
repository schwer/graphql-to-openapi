import { readFileSync } from 'fs';
import * as path from 'path';
import * as assert from 'assert';

describe('version', function () {
  it('.version file should be kept up-to-date with package.json version', () => {
    const versionFromPackageJson = JSON.parse(
      readFileSync(path.join(__dirname, '..', '..', 'package.json')).toString()
    ).version;
    const versionFromFile = readFileSync(
      path.join(__dirname, '..', '..', '.version')
    )
      .toString()
      .trim();
    assert.equal(versionFromPackageJson, versionFromFile);
  });
});
