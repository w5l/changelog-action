# Generate a changelog from pull request commit messages

Use this action to create a changelog from your GitHub pull requests.

When run, the action will look for all pull request merges since the last release. Messages will be grouped by type and written to an output variable.

If the current SHA is also the latest release, it creates a changelog with all PRs between latest and previous non-draft non-prerelease release.
Otherwise, it creates a changelog with all PRs since the latest release.

## Prefixes

Messages are grouped by type based on prefix. Each type creates a section in the changelog.
Prefixes are case insensitive and can optionally be followed by a colon.

Currently known prefixes:

- `Feat`, `Feature`: mapped to "Feature" section.
- `Fix`, `Fixes`, `Fixed`, `Bug`: mapped to "Fixed" section.

## Using this action

This action uses [`@octokit/action`](https://github.com/octokit/action.js/) to fetch the merged pull requests.
It requires the environment variables `GITHUB_TOKEN` and `GITHUB_REPOSITORY` to be set, and optionally a `GITHUB_SHA`.
This is done automatic when running inside a GitHub action.

### Generate changelog message

Include the changelog action anywhere after the checkout action.

```yaml
- name: Generate changelog
  id: changelog
  uses: willemduncan/changelog-action@v1
```

The generated message is stored in the output variable named `message`.

### Use generated message

You can now reference the generated message using the `id` from the previous step. For example, using [`actions/create-release`](https://github.com/actions/create-release):

```yaml
- name: Create Release
  uses: actions/create-release@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tag_name: ${{ github.ref }}
    release_name: Release ${{ github.ref }}
    body: ${{ steps.changelog.outputs.message }}
```
