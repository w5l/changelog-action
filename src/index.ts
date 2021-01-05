import * as core from '@actions/core';
import { context } from '@actions/github';
import { EventPayloads } from '@octokit/webhooks'
import { getOctokit } from './getOctokit';
import { generateChangelog } from './generateChangelog';
import { getChangesetData } from './getChangesetData';

async function run(): Promise<void> {
  try {
    core.info(`Event '${context.eventName}' payload:`);
    core.info(JSON.stringify(context.payload, undefined, 2));

    const release = context.eventName === 'release' ?
      context.payload as EventPayloads.WebhookPayloadReleaseRelease :
      null;

    const octokit = getOctokit();
    const data = await core.group('Getting data for changelog', () => getChangesetData(octokit, context.repo, release));
    const message = await core.group('Creating changelog message', async () => generateChangelog(core.getInput('title'), data));
    core.setOutput('message', message);


  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

run();
