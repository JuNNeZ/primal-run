# GitHub API diagnosis — 2026-10-10

The prior CLI auth summary called GH_TOKEN invalid. The actual read-only `gh api repos/JuNNeZ/primal-run` fails with Forbidden. The observed managed network allowlist includes github.com (Git) but not api.github.com (REST). Git source-branch read/push works. Therefore token expiration has NOT been isolated; a blocked API route is a prerequisite failure.

No credential values were read, printed, replaced or requested in chat. Managed readiness reports no configured secret requirements. Do not extract Git proxy credentials for use as GH_TOKEN.

A supported environment draft was saved: custom domains cdn.playwright.dev (preserved) and api.github.com (added), requires_publish=true. Saving the draft does not apply it to the running machine. Review/save in Environment settings and publish the environment, then recheck environment_status and the specific API request. If the API subsequently returns 401 or a scope denial, use the supported secret-binding workflow only for the still-missing API credential; Git access alone does not establish REST permissions.

Instruction source: cloud-environment-onboarding:setup, references/onboarding.md: “Saving configuration edits through the user-facing editor can request a runtime update” and “Review and saving are separate from publication.” Runtime networking: “An explicit destination-policy denial requires the supported configuration workflow; do not bypass the proxy to reach a blocked destination.”

PR creation remains pending. Prepared source commits and all unfinished art remain independently pushable. gh-pages is unchanged.
