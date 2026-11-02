# Reminders and mobile web-app feasibility

Research checked 2026-10-30. This release provides an **opt-in calendar download**, not a web-push service. There is no notification permission prompt, push subscription, hidden polling, messaging credential, scheduler, or additional paid service.

## What the implemented reminder does

An adult or guardian chooses weekdays and a local time, then downloads an iCalendar (`.ics`) file. It contains one recurring ten-minute study event with a display alarm at the start, a generic English/Vietnamese title, and an Atlas link. No learner name, email, ability, mistakes, account credentials, or private progress are exported. Importing it into a compatible calendar and enabling that calendar's alerts is a separate user action. Calendar alerts can work while the game is closed; **downloading the file alone does not enable reminders**.

The recurrence deliberately uses floating local time (no UTC suffix or `TZID`), as defined by [RFC 5545 §3.3.5](https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.5). This describes wall-clock time, rather than a fixed UTC instant. The importing calendar determines how it applies that time to its calendar zone, daylight-saving changes, and travel. The user must check the imported time. Atlas does not promise cross-time-zone synchronization or exact alarm delivery. RFC line folding, text escaping, and alarm structure follow [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545).

Calendar apps may ignore imported alarms, require desktop/web import, or create duplicate events on repeated imports. A stable UID and increasing sequence are supplied, but update handling is not guaranteed. Edit/delete the event **in the calendar app** to change/stop an imported reminder. Changing or deleting Atlas preferences does not alter external calendar events. Device Focus/Do Not Disturb and calendar notification settings control quiet hours; there is no second in-app quiet-hours system to contradict them. Guardians should create/manage reminders for younger learners; no pressure, missed-day alerts, or child notification prompting is introduced.

## Real mobile push requirements

| Platform/component | Verified documentation | Consequence for Atlas |
| --- | --- | --- |
| iOS/iPadOS | Web Push is available to Home Screen web apps from 16.4. Permission must follow a direct user action. Notification and Focus settings remain user-controlled. No Apple Developer Program membership is required. [WebKit](https://webkit.org/blog/13878/) | A normal browser tab should not be advertised as iPhone push-ready. Home Screen installation alone is not notification consent. |
| Current Safari | iOS/iPadOS 26 opens Home Screen additions as web apps by default; users can turn off “Open as Web App.” A manifest remains useful. [WebKit Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) | Do not repeat outdated claims that a manifest is always required to add an iOS web app. Launch the Home Screen app for push feature detection if implemented later. |
| Android/supported browsers | Web Push can receive server messages without a loaded page, through a service worker. Browser compatibility still varies. [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) | Closed-page delivery is technically possible with permission and a sender; an open-tab JavaScript timer is not a substitute. Device policies, connectivity and revoked permissions can prevent timely receipt. No Android delivery was tested here. |
| Service workers | Workers are event-driven and can be stopped when idle. [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) | `setTimeout` in a worker cannot provide a dependable future alarm while the app is closed. |
| Firebase | FCM requires a trusted sender environment. Deploying Cloud Functions requires Blaze; scheduled functions use Cloud Scheduler. [FCM sender](https://firebase.google.com/docs/cloud-messaging/server-environment), [Functions deployment](https://firebase.google.com/docs/functions/get-started), [scheduled functions](https://firebase.google.com/docs/functions/schedule-functions) | Free messaging does not supply an authenticated Spark-only recurring scheduler. Billing remains disabled. |
| GitHub Actions | Scheduled runs can be delayed, dropped under load, and disabled in public repositories after 60 days without activity. [GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) | CI is unsuitable as the dependable family reminder backend. Private subscription access, secret management and delivery retries would also add operations. |

Newer [Declarative Web Push in WebKit](https://webkit.org/blog/16535/) can improve notification display handling, but does not remove the need for a trusted remote sender or produce a cross-browser recurring scheduler. We do not enable a partial implementation and call it working push.

A separate free-tier managed worker could be investigated later, but it adds an account, secrets, private storage and maintenance. A sound implementation would need authenticated subscription registration bound to the account, request validation, rate limits, a server-held VAPID private key, private endpoint storage, expiring-subscription cleanup (including failed/expired endpoint responses), unsubscribe, consent recovery, explicit time zone and daylight-saving handling, quiet hours, deduplication and retries with bounded expiry. Endpoints must not enter public repository assets or logs. MDN identifies push endpoints as capability URLs that need protection. No such backend is provisioned in this release.

## Module API and integration contract

`src/reminders.js` is pure and has no browser/notification side effects:

```js
import { calendarReminder, localCalendarDate, validateReminder } from './reminders.js';
const reminder = calendarReminder({
  id: 'opaque-stable-reminder-id', // not an email or learner name
  days: [1, 3, 5],               // Sunday=0 through Saturday=6
  time: '18:00',                 // 24-hour local calendar time
  startDate: localCalendarDate(),
  language: 'vi',               // en or vi
  appUrl: 'https://phifin.github.io/fly-english-playground/?learn=today',
  sequence: 0,                  // increase on an explicit replacement export
});
// reminder: { filename, type, text, firstDate }
// Download a Blob([reminder.text], { type: reminder.type }) only on explicit click.
```

`validateReminder({ days, time })` returns a copied, sorted configuration or throws `RangeError`. `calendarReminder` validates dates, identifiers, revision, language and link, advances the start to a selected weekday, and folds UTF-8 safely at 75 octets. Allowed URLs are only the production app root and its `?learn=today` deep link. Root UI must implement that query before using it; otherwise omit `appUrl` to use the safe home-page default. `now` accepts an injectable Date for deterministic tests. Integration should preview `firstDate` and local time. Use existing localized error handling, not English module exception messages, in user-facing UI.

Suggested concise EN/VI text:

- “Add a study reminder to your calendar” / “Thêm lời nhắc học vào lịch”.
- “Choose days and a time. After download, import the file and check alerts in your calendar.” / “Chọn ngày và giờ. Sau khi tải, nhập tệp vào lịch và kiểm tra thông báo.”
- “Your calendar manages these reminders. Edit or delete the event there.” / “Ứng dụng lịch quản lý lời nhắc này. Bạn có thể sửa hoặc xóa sự kiện trong lịch.”

Store optional reminder preferences with the existing profile event mechanism; they are not evidence of learning, not an active push subscription, and not proof of successful calendar import. Show the export action in the study-goal area or settings, not mandatory onboarding. Allow local guests to export too. Do not show “notifications enabled” after download.

## Manifest integration

`assets/atlas.webmanifest` reuses the original `assets/atlas-mark.svg`. Relative `id`, `start_url`, and `scope` resolve to the GitHub Pages project root, not the domain root. It adds no tracking query or separate cache.

Root integration must add `<link rel="manifest" href="./assets/atlas.webmanifest">`, allow `.webmanifest` in the public file and service-worker asset checks, and map it to `application/manifest+json`. Test its actual built path. SVG icon support differs on older devices; this manifest alone is **not a claim of universally verified installation**. Raster icons at 192/512 and Apple touch-icon fallback may be added if deployment testing shows a need. Current Safari 26 adds SVG-icon support, but older systems need separate checks. Existing offline behavior remains governed by the current service worker, not by the manifest.

## Verification and limitations

`tests/reminders.test.mjs` verifies recurrence/date rollover, leap dates, local date extraction, strict configuration, safe links/injection resistance, stable UID/revision, Vietnamese normalization and UTF-8 folding, and project-relative manifest paths. These checks verify exported data, not calendar-client interoperability. No physical iPhone, iPad or Android notification delivery, calendar import, alarm persistence, Focus behavior or install prompt was tested. Test those on actual devices before advertising verified mobile delivery. No unattended push delivery or automatic expired-subscription recovery is implemented because there are no push subscriptions.
