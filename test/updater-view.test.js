import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReleaseNotesModel } from '../src/renderer/updater-view.js';

test('builds updater release notes as plain text model', () => {
  const model = buildReleaseNotesModel({
    releaseName: '<img src=x onerror=alert(1)>',
    releaseNotes: [
      { version: '0.1.1', note: '<script>alert(1)</script>' },
    ],
  });

  assert.deepEqual(model, [
    { type: 'title', text: '<img src=x onerror=alert(1)>' },
    { type: 'version-note', version: '0.1.1', text: '<script>alert(1)</script>' },
  ]);
});
