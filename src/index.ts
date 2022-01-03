import * as core from '@actions/core';
import { context } from '@actions/github';
import { getOctokit } from './getOctokit';
import { generateChangelogMessage } from './generateChangelogMessage';
import { getChangesetData } from './getChangesetData';
import { createChangelog } from './createChangelog';
import { ReleasePayload } from './models';
import { Configuration } from './configuration';

async function run(): Promise<void> {
  try {
    const release = context.eventName === 'release' ?
      (context.payload as ReleasePayload)?.release :
      null;

    const config: Configuration = {
      title: core.getInput("title"),
      sections: [
        { title: "Features", prefixes: ["feat", "feature"] },
        { title: "Fixes", prefixes: ["fix", "fixes", "fixed", "bug"] },
        { title: "Refactors", prefixes: ["refactor"] },
        { title: "Performance", prefixes: ["perf"] },
        { title: "Build", prefixes: ["build"] },
        { title: "Continuous Integration", prefixes: ["ci"] },
        { title: "Documentation", prefixes: ["docs"] },
        { title: "Unit testing", prefixes: ["test"] },
      ],
      otherSectionTitle: core.getInput("other_section_title")
    }

    const octokit = getOctokit();

    const data = await core.group('Get data for changelog', () => getChangesetData(octokit, context.repo, release));
    const changelog = await core.group('Create changelog', async () => createChangelog(data, config));
    const message = await core.group('Generate changelog message', async () => generateChangelogMessage(changelog));

    core.setOutput('message', message);

    if (core.getInput('update_release')?.toLowerCase() === 'true') {
      await core.group('Update current release', async () => {
        if (release !== null) {
          core.info(`Set body for ${release.name} to ${message}`);
          await octokit.rest.repos.updateRelease({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: release.id,
            body: message
          });
        } else {
          core.warning('The `update_release` flag is set, but action is not triggered by a release event. Nothing to do.');
        }
      });
    }
  }
  catch (error) {
    core.setFailed(error instanceof Error ? error : "An error occured.");
    throw error;
  }
}

run();
