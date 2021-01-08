import * as core from "@actions/core";
import { Changelog, ChangelogSection } from "./models";

/**
 * Generate change log message.
 * @param title Optional title.
 * @param pulls Collection of issues to use for changelog.
 */
export function generateChangelogMessage(changelog: Changelog): string {
  core.info(`Create changelog with ${changelog.sections.length} sections.`);

  let r = changelog.title ? `# ${changelog.title}\n` : "";
  changelog.sections.forEach(s => r += renderSection(s));
  return r.trim();
}

/**
 * Create a changelog section string.
 * @param section The section data.
 */
function renderSection(section: ChangelogSection): string {
  let r = "\n";
  if (section.title) {
    r += `## ${section.title}\n`;
  }
  for (const item of section.items) {
    r += `- ${item.title} (#${item.item.number})\n`;
  }
  return r;
}
