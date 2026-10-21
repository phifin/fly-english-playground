# Release verification in GitHub Actions

`.github/workflows/pages.yml` requires both the static/browser build job and the
Firestore rules job before deployment. Creating this configuration does not mean
that either job has run successfully; inspect the actual Actions result before
calling the deployment verified.

The build job checks independently accepted content and boards, runs domain and
storage tests, then exercises the built release in Chromium with axe accessibility
checks. CI must supply axe; it cannot silently skip that check. The workflow keeps
the browser report, synthetic-test screenshots and preview log for seven days,
including when browser verification fails. Automated checks do not certify WCAG
compliance or replace family-device and screen-reader testing.

The rules job installs Firebase CLI into the runner's temporary directory and
starts only Firestore with project `demo-atlas-rules`. Java 21 is explicit. The REST
test requires a loopback emulator and synthetic identities; the CI flag makes a
missing emulator fail instead of skipping. No Firebase login, live project,
credentials or billing activation is involved. Firebase recommends demo IDs to
avoid production changes, and documents `emulators:exec` for CI with no login
needed for Firestore. [Demo projects](https://firebase.google.com/docs/emulator-suite/connect_firestore),
[Emulator CI](https://firebase.google.com/docs/emulator-suite/install_and_configure).

New verification-tool pins checked against publisher sources on 20 October 2026:

| Tool | Pinned version | Publisher evidence |
| --- | --- | --- |
| Firebase CLI | `firebase-tools@15.34.0` | [Firebase release](https://github.com/firebase/firebase-tools/releases/tag/v15.34.0), [package name, binary and Node engines](https://raw.githubusercontent.com/firebase/firebase-tools/v15.34.0/package.json) |
| Java setup action | `actions/setup-java@v6.1.0` | [GitHub release](https://github.com/actions/setup-java/releases/tag/v6.1.0) |
| axe browser engine | `axe-core@4.14.0` | [Deque release](https://github.com/dequelabs/axe-core/releases/tag/v4.14.0), [published package definition](https://raw.githubusercontent.com/dequelabs/axe-core/v4.14.0/package.json) |
| Evidence upload | `actions/upload-artifact@v7.0.2` | [GitHub release](https://github.com/actions/upload-artifact/releases/tag/v7.0.2) |

These are development verification tools, outside the dependency-free game
runtime. The managed Windows workspace has not executed the Firestore emulator
or a successful graphical browser run. Its browser process launch returns EPERM;
the Linux Actions gates remain unexecuted until the repository workflow is run.
