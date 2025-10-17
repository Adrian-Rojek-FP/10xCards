# GitHub Actions Workflows

## CI/CD Pipeline

### Overview

This repository uses GitHub Actions for continuous integration and deployment. We have two main workflows:
- **`ci.yml`** - Continuous Integration for main branch
- **`pull-request.yml`** - Pull Request validation with status comments

For detailed documentation on the Pull Request workflow, see [README-pull-request.md](./README-pull-request.md).

### Workflow: Test & Build (`ci.yml`)

#### Trigger Events
- **Push to main**: Automatically runs on every push to the main branch
- **Pull Requests**: Runs on PRs targeting the main branch
- **Manual Dispatch**: Can be triggered manually via GitHub Actions UI

#### Concurrency Control
The workflow implements concurrency control to automatically cancel in-progress runs when new commits are pushed to the same branch, saving CI resources.

#### Security: Permissions
Following the principle of least privilege, the workflow has minimal permissions:
- `contents: read` - Read access to repository contents
- `actions: read` - Read access to actions
- `checks: write` - Write access to checks (for test results)

#### Jobs Architecture

The workflow is split into 4 jobs that run in parallel where possible:

```
lint ──┐
       ├──> build ──> e2e-tests
unit-tests ──┘
```

##### 1. **Lint Job** (5 minutes timeout)
- Runs ESLint to check code quality
- Runs in parallel with unit tests
- Fast feedback on code style issues

##### 2. **Unit Tests Job** (10 minutes timeout)
- Runs Vitest unit tests
- Runs in parallel with lint job
- No external dependencies required

##### 3. **Build Job** (10 minutes timeout)
- **Dependencies**: Requires `lint` and `unit-tests` to pass
- Builds production version of the application
- Uses Supabase secrets for build configuration
- Uploads build artifacts for E2E testing
- Sets `if-no-files-found: error` to catch build failures

##### 4. **E2E Tests Job** (15 minutes timeout)
- **Dependencies**: Requires `build` to complete
- Downloads build artifacts from the build job
- Installs Playwright with Chromium browser
- Runs end-to-end tests against the built application
- Uploads test reports and results on failure
- Unique artifact names using `${{ github.run_id }}` to avoid conflicts

#### Environment Variables

The workflow uses job-level environment variables (not global) for better isolation:

**Build Job:**
- `NODE_ENV: production`
- `PUBLIC_SUPABASE_URL` (from secrets)
- `PUBLIC_SUPABASE_KEY` (from secrets)

**E2E Tests Job:**
- `NODE_ENV: test`
- `CI: true`
- `PUBLIC_SUPABASE_URL` (from secrets)
- `PUBLIC_SUPABASE_KEY` (from secrets)

#### Required Secrets

Configure these secrets in your GitHub repository settings:

1. `PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `PUBLIC_SUPABASE_KEY` - Your Supabase anonymous/public key

**To add secrets:**
1. Go to Repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its corresponding value

#### Actions Used

All actions are pinned to major versions and kept up-to-date:

- **actions/checkout@v5** - Checks out repository code
- **actions/setup-node@v6** - Sets up Node.js environment
  - Uses `.nvmrc` file for version consistency
  - Enables npm caching for faster builds
- **actions/upload-artifact@v4** - Uploads build artifacts and test results
- **actions/download-artifact@v4** - Downloads build artifacts for testing

#### Caching Strategy

The workflow leverages multiple caching layers:
1. **npm cache** - Automatically handled by `actions/setup-node@v6` with `cache: 'npm'`
2. **Playwright browsers** - Cached automatically by Playwright
3. **Build artifacts** - Shared between build and E2E test jobs via artifacts

#### Failure Handling

On test failures:
- **Playwright reports** are uploaded with unique names (`playwright-report-{run-id}`)
- **Test results** are uploaded with unique names (`test-results-{run-id}`)
- Reports are retained for 7 days
- Uses `if-no-files-found: warn` to avoid failing if no reports exist

#### Performance Optimizations

1. **Parallel execution**: Lint and unit tests run simultaneously
2. **Optimal timeouts**: Each job has appropriate timeout limits
3. **npm ci**: Uses `npm ci` for faster, more reliable installs
4. **Artifact sharing**: Build artifacts shared between jobs instead of rebuilding
5. **Concurrency control**: Cancels outdated workflow runs

#### Best Practices Implemented

✅ **Security**
- Minimal permissions
- Secrets properly scoped to jobs
- No hardcoded credentials

✅ **Performance**
- Parallel job execution
- Efficient caching
- Concurrency control

✅ **Reliability**
- Pinned action versions
- Job dependencies clearly defined
- Proper error handling

✅ **Maintainability**
- Clear job names and structure
- Logical separation of concerns
- Comprehensive documentation

#### Local Testing

Before pushing, you can run the same checks locally:

```bash
# Linting
npm run lint

# Unit tests
npm run test:run

# Build
npm run build

# E2E tests
npm run test:e2e
```

#### Troubleshooting

**Build fails with missing environment variables:**
- Ensure `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_KEY` secrets are configured

**E2E tests fail:**
- Check Playwright report artifacts in the failed workflow run
- Download and view the HTML report locally

**Workflow doesn't trigger:**
- Verify `.github/workflows/ci.yml` is in the main branch
- Check branch protection rules aren't blocking workflow runs

#### Updating Actions

To check for action updates:

```powershell
# Check latest version of actions/checkout
(Invoke-RestMethod -Uri https://api.github.com/repos/actions/checkout/releases/latest).tag_name

# Check latest version of actions/setup-node
(Invoke-RestMethod -Uri https://api.github.com/repos/actions/setup-node/releases/latest).tag_name

# Check latest version of actions/upload-artifact
(Invoke-RestMethod -Uri https://api.github.com/repos/actions/upload-artifact/releases/latest).tag_name
```

Update the workflow file with the major version (e.g., `v5` from `v5.0.0`).

## Contributing

When modifying workflows:
1. Test changes in a feature branch first
2. Verify all jobs complete successfully
3. Check artifact uploads and downloads work correctly
4. Update this README with any significant changes
