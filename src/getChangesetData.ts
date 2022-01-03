import * as core from "@actions/core";
import { GitHub } from "@actions/github/lib/utils";
import { Issue } from "./models";

export async function getChangesetData(
  octokit: InstanceType<typeof GitHub>,
  repo: { owner: string, repo: string },
  release: { created_at: string, tag_name: string } | null
): Promise<Issue[]> {

  const repository = `${repo.owner}/${repo.repo}`;
  core.info(`Getting changeset for repository ${repository}.`);
  const range = await getDateRange(octokit, repo, release);

  core.info(`Searching issues merged between ${range}.`);

  // Need to use GraphQL endpoint because there is no REST API for searching PRs based on a date
  // See https://github.com/github/hub/issues/2085.
  const prSearch = await octokit.graphql<{ search: { nodes: Issue[] } }>(`{
    search(first: 100, query: "repo:${repository} is:pr merged:${range} sort:updated-asc", type: ISSUE) {
      nodes {
        ... on PullRequest {
          number
          title
          url,
          closedAt,
          mergedAt
        } 
      }
    }
  }`);

  core.info(`Found ${prSearch.search.nodes.length} pulls within range:`);
  prSearch.search.nodes.forEach(item => {
    core.info(`- ${item.title} (${item.number}).`);
  });

  return prSearch.search.nodes;
}

async function getDateRange(
  octokit: InstanceType<typeof GitHub>,
  repo: { owner: string, repo: string },
  release: { created_at: string, tag_name: string } | null
): Promise<string> {

  // Need to add a second to the date stamps to get correct results. I guess GitHub's filters time
  // by millisecond but only returns datetime in seconds. So we have to add a second to exclude the
  // PR/Issues on the "after" time, and to include those on the "before" time.
  // One second still sometimes isn't enough, but 1001ms seems to work reliably.
  const addSec = (date: string) => new Date(new Date(date).getTime() + 1001).toISOString();

  // If there is a current release, search relative to that.
  if (release) {
    // The field `created_at` contains the date of the commit that is released, which is what we
    // want, Don't use the date of the release, it can be made at another time.
    const currentDate = new Date(release.created_at);
    // TODO: Big assumption using page size `20` but works for us.
    const previousRelease = (await octokit.rest.repos.listReleases({ owner: repo.owner, repo: repo.repo, per_page: 20 })).data
      // Filter all published non-prerelease done before current release.
      .filter(r => !r.draft && !r.prerelease && new Date(r.created_at) < currentDate)
      // Order by tagname and take the one with the highest tag.
      .sort((a, b) => a.tag_name > b.tag_name ? -1 : 1)[0];

    if (previousRelease) {
      core.info(`Current release is ${release.tag_name}, using all data since previous release ${previousRelease.tag_name}.`);
      return `${addSec(previousRelease.created_at)}..${addSec(release.created_at)}`;
    } else {
      core.info(`Current release is ${release.tag_name}, no earlier releases, using all data since beginning of time up to ${release.tag_name}.`);
      return `*..${addSec(release.created_at)}`;
    }
  }

  core.info(`Getting latest release.`);
  try {
    release = (await octokit.rest.repos.getLatestRelease(repo)).data;
    core.info(`No current release, using all data since previous release ${release.tag_name}.`);
    return `${addSec(release.created_at)}..*`;
  } catch {
    core.info(`No releases at all, using all data since beginning of time.`);
    return `*..*`;
  }
}
