import * as core from "@actions/core";
import { Octokit } from "@octokit/action";
import { RestEndpointMethods } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types";
import { Issue } from "./models";

export async function getChangesetData(owner: string, repo: string): Promise<Issue[]> {
  core.info(`Getting changeset for repository ${owner}/${repo}.`);
  const octokit = new Octokit();
  const range = await getDateRange(octokit, owner, repo);

  core.info(`Searching issues merged between ${range}.`);

  // Need to use GraphQL endpoint because there is no REST API for searching PRs based on a date
  // See https://github.com/github/hub/issues/2085.
  const prSearch = await octokit.graphql<{ search: { nodes: Issue[] } }>(`{
    search(first: 100, query: "repo:${owner}/${repo} is:pr merged:${range} sort:updated-asc", type: ISSUE) {
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

  core.info(`Found ${prSearch.search.nodes.length} issues in range.`);
  return prSearch.search.nodes;
}

async function getDateRange(octokit: RestEndpointMethods, owner: string, repo: string): Promise<string> {

  // Need to add a second to the date stamps to get correct results. I guess GitHub's filters time
  // by millisecond but only returns datetime in seconds. So we have to add a second to exclude the
  // PR/Issues on the "after" time, and to include those on the "before" time.
  // One second still sometimes isn't enough, but 1001ms seems to work reliably.
  const addSec = (date: string) => new Date(new Date(date).getTime() + 1001).toISOString();

  // The field `created_at` contains the date of the commit that is released, which is what we
  // want, Don't use the date of the release, it can be made at another time.
  const release = (await octokit.repos.getLatestRelease({ owner, repo })).data;

  // If the current commit sha is also the current release sha, make a date range between this and
  // the previous release.
  const sha = process.env["GITHUB_SHA"];
  if (sha && sha === release.target_commitish) {
    const currentDate = new Date(release.created_at);
    // TODO: Big assumption using page size `20` but works for us.
    const release2 = (await octokit.repos.listReleases({ owner, repo, per_page: 20 })).data
      // Filter all published non-prerelease done before current release.
      .filter(r => !r.draft && !r.prerelease && new Date(r.created_at) < currentDate)
      // Order by tagname and take the one with the highest tag.
      .sort((a, b) => a.tag_name > b.tag_name ? -1 : 1)[0];
    core.info(`Current commit is latest release, using all data between ${release2.tag_name} and ${release.tag_name}.`);
    return `${addSec(release2.created_at)}..${addSec(release.created_at)}`;
  }

  core.info(`Current commit is not released yet, using all data since ${release.tag_name}.`);
  return `${addSec(release.created_at)}..*`;
}
