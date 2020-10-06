import * as core from "@actions/core";
import { Issue } from "./models";

/**
 * Generate change log message.
 * @param title Optional title.
 * @param pulls Collection of issues to use for changelog.
 */
export function generateChangelog(title: string, pulls: Issue[]): string {
  core.info(`Create changelog for ${pulls.length} items.`);

  const features = getGroupByPrefix(pulls, ["feat", "feature"]);
  const fixes = getGroupByPrefix(pulls, ["fix", "fixes", "fixed", "bug"]);

  let r = title ? `# ${title}\n` : "";
  r += renderSection("Features", features);
  r += renderSection("Fixes", fixes);
  return r.trim();
}

/**
 * Filter and sort a collection of issues.
 * @param items The items to filter.
 * @param prefixes The prefixes to filter.
 */
function getGroupByPrefix(items: Issue[], prefixes: string[]) {
  const regex = new RegExp(`^(${prefixes.join("|")})?:?\\s+`, "i");
  return items
    // Match with allowed prefixes
    .map(item => ({
      data: item,
      match: regex.exec(item.title)
    }))
    // Filter by positive matches.
    .filter(item => item.match)
    // Strip prefix from title.
    .map(item => {
      item.data.title = item.data.title.substring(item.match![0].length)
      return item.data;
    })
    // Sort by issue number ascending.
    .sort((a, b) => a.number > b.number ? 1 : -1);
}

/**
 * Create a changelog section string if items isn't empty.
 * @param title The section title.
 * @param items The items for this section.
 */
function renderSection(title: string, items: Issue[]): string {
  if (!items?.length) {
    return "";
  }
  let r = "\n";
  if (title) {
    r += `## ${title}\n`;
  }
  for (const item of items) {
    r += `- ${item.title} (#${item.number})\n`;
  }
  return r;
}
