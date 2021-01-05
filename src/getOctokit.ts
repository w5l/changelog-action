import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

export function getOctokit(): InstanceType<typeof GitHub> {
    const tokens = [
        process.env.GITHUB_TOKEN,
        process.env.INPUT_GITHUB_TOKEN,
        process.env.INPUT_TOKEN,
    ].filter(Boolean);

    if (tokens.length === 0) {
        throw new Error("`GITHUB_TOKEN` variable is not set. It must be set on either `env:` or `with:`.");
    }
    if (tokens.length > 1) {
        throw new Error("Multiple `GITHUB_TOKEN` variables set.");
    }

    return github.getOctokit(tokens.pop() as string);
}
