import * as core from '@actions/core';
import { context } from '@actions/github';
import { getOctokit } from './getOctokit';
import { generateChangelog } from './generateChangelog';
import { getChangesetData } from './getChangesetData';
import { ReleasePayload } from './models';

async function run(): Promise<void> {
  try {
    const release = context.eventName === 'release' ?
      (context.payload as ReleasePayload)?.release :
      null;

    const octokit = getOctokit();
    const data = await core.group('Getting data for changelog', () => getChangesetData(octokit, context.repo, release));
    const message = await core.group('Creating changelog message', async () => generateChangelog(core.getInput('title'), data));
    core.setOutput('message', message);

    if (core.getInput('update_release')?.toLowerCase() === 'true') {
      await core.group('Updating current release', async () => {
        if (release !== null) {
          core.info(`Set body for ${release.name} to ${message}`);
          await octokit.repos.updateRelease({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: release.id,
            body: message
          });
        } else {
          core.warning('`update_release` is set, but action is not triggered by a release.');
        }
      });
    }
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

run();
