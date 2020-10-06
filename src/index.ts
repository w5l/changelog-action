import * as core from "@actions/core";
import { generateChangelog } from "./generateChangelog";
import { getChangesetData } from "./getChangesetData";

async function run(): Promise<void> {
  try {
    core.startGroup("Getting data for changelog");
    const [owner, repo] = (process.env["GITHUB_REPOSITORY"] || "").split("/");
    const data = await getChangesetData(owner, repo);
    core.endGroup();

    core.startGroup("Creating changelog message");
    const message = generateChangelog(core.getInput("title"), data);
    core.info(message);
    core.setOutput("message", message);
    core.endGroup();
  }
  catch (error) {
    core.info(JSON.stringify(error));
    core.setFailed(error.message);
  }
}

run();
