import * as core from '@actions/core';
import { Configuration } from './configuration';
import { Changelog, Issue } from './models';

/**
 * Create a changelog model from a collection of issues.
 * @param items The items to use as base collection.
 */
export function createChangelog(items: Issue[], config: Configuration): Changelog {
  core.info(`Create changelog for ${items.length} items.`);

  const result: Changelog = {
    title: config.title,
    sections: []
  };

  const addSection = (title: string, items: { title: string, item: Issue }[]) => {
    core.info(`Create changelog section '${title}' with ${items.length} items.`);
    if (items.length > 0) {
      result.sections.push({ title, items });
    }
  };

  config.sections.forEach(s =>
    addSection(s.title, getItemsByPrefix(items, s.prefixes))
  );

  if (config.otherSectionTitle) {
    // Take all items except those already in a section.
    addSection(config.otherSectionTitle, items
      .filter(i => !result.sections.some(s => s.items.some(si => si.item === i)))
      .map(i => ({
        title: i.title,
        item: i
      })));
  }

  return result;
}

/**
 * Filter a collection of issues.
 * @param items The items to filter.
 * @param prefixes The prefixes to filter.
 */
function getItemsByPrefix(items: Issue[], prefixes: string[]) {
  const regex = new RegExp(`^(${prefixes.join('|')})?:?\\s+`, 'i');
  return items
    // Match with allowed prefixes
    .map(item => ({
      data: item,
      match: regex.exec(item.title)
    }))
    // Filter by positive matches.
    .filter(item => item.match)
    // Create title without filtered prefix.
    .map(item => ({
      title: item.data.title.substring(item.match![0].length),
      item: item.data
    }));
}
