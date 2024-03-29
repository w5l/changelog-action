# Generate a changelog from pull request titles

Use this action to create a changelog from your GitHub pull requests.

When run, the action will look for all pull request merges since the last release. Messages will be grouped by type and
written to an output variable.

There are two ways to trigger the action, which decide what data to retrieve:

- When triggered by a release event, all merged PRs between that release and the previous non-draft non-prerelease
  release are fetched.
- Otherwise, all merged PRs since the latest release are fetched.

When triggering this action on a release, it's possible to immediately update the release with the generated changelog
by specifying the input option [`update_release`](#available-options).

## Prefixes

Pull requests are grouped by type based on prefixes in their title. Each type creates a section in the changelog.
Prefixes are case insensitive and can optionally be followed by a colon.

Currently mapped prefixes:

| Prefix            | Section                |
| ----------------- | ---------------------- |
| `build`           | Build                  |
| `ci`              | Continuous Integration |
| `docs`            | Documentation          |
| `feat`, `feature` | Features               |
| `fix`, `bug`      | Fixes                  |
| `perf`            | Performance            |
| `refactor`        | Refactors              |
| `test`            | Unit tests             |

## Using this action

### Available options

| Name                  | Description                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `update_release`      | When set to `true`, will update the current release with the generated release notes. Default `false`.                            |
| `title`               | Title to use as a heading above the changelog. If not specified, the changelog has no heading.                                    |
| `other_section_title` | Title to use as heading for section containing all pull requests not in other sections. If not specified, they are not displayed. |

### Generate a changelog message

Include the changelog action anywhere after the checkout action.

```yaml
- name: Generate changelog
  id: changelog
  uses: willemduncan/changelog-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The generated message is stored in the output variable named `message`.

### Using the generated message

You can now reference the generated message using the `id` from the previous step. For example, using
[`actions/create-release`](https://github.com/actions/create-release):

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

### Updating on release

See the [`release.yml`](./.github/workflows/release.yml) for an example of how to trigger this action on release and
automatically write the changelog to the body.
