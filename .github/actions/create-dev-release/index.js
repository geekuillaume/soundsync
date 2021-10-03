const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');
const glob = require('@actions/glob');
const path = require('path');
const fs = require('fs');

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // Get owner and repo from context of payload that triggered the action
    const { owner, repo } = context.repo;

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const tagName = core.getInput('tag_name', { required: true });

    // This removes the 'refs/tags' portion of the string, i.e. from 'refs/tags/v1.10.15' to 'v1.10.15'
    const tag = tagName.replace('refs/tags/', '').slice(0, 39);
    const releaseName = core.getInput('release_name', { required: true }).replace('refs/tags/', '');
    const body = core.getInput('body', { required: false });
    const draft = core.getInput('draft', { required: false }) === 'true';
    const prerelease = core.getInput('prerelease', { required: false }) === 'true';
    const contentType = core.getInput('asset_content_type', { required: true });
    const fileGlob = core.getInput('files_glob', { required: true });

    // Create a release
    let uploadUrl;
    let releaseId;
    try {
      const getReleaseResponse = await github.repos.getReleaseByTag({
        owner,
        repo,
        tag,
      });
      uploadUrl = getReleaseResponse.data.upload_url;
      releaseId = getReleaseResponse.data.id;
    } catch (e) {
      // release doesnt yet exists
      const createReleaseResponse = await github.repos.createRelease({
        owner,
        repo,
        tag_name: tag,
        name: releaseName,
        body,
        draft,
        prerelease,
      });
      uploadUrl = createReleaseResponse.data.upload_url;
      releaseId = createReleaseResponse.data.id;
    }

    const assets = await github.repos.listAssetsForRelease({
      owner, repo, release_id: releaseId,
    });

    const contentLength = (filePath) => fs.statSync(filePath).size;

    const globber = await glob.create(fileGlob);
    for await (const file of globber.globGenerator()) {
      const existingAsset = assets.data.find((asset) => asset.name === path.basename(file));
      if (existingAsset) {
        await github.repos.deleteReleaseAsset({
          owner, repo, asset_id: existingAsset.id,
        });
      }
      // Determine content-length for header to upload asset
      const fileStat = fs.statSync(file);
      if (fileStat.isDirectory()) {
        continue;
      }
      // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
      const headers = { 'content-type': contentType, 'content-length': fileStat.size };
      console.log(`Uploading ${file}`);
      await github.repos.uploadReleaseAsset({
        owner,
        headers,
        repo,
        release_id: releaseId,
        name: path.basename(file),
        label: path.basename(file),
        data: fs.readFileSync(file),
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
