# Google sign-in artwork

Verified 2026-10-27 against Google's [Sign in with Google branding guidance](https://developers.google.com/identity/branding-guidelines) (page updated 2026-07-07).

`assets/google-g.svg` contains the **unchanged official gradient G image**, downloaded from [the guide's Google logo](https://developers.google.com/static/identity/images/g-logo.png). The original PNG is embedded as a data URI in a small SVG wrapper. Its 200 × 204 aspect ratio is preserved inside a 20 × 20 CSS box; there are no invented paths or recolored pixels. SHA-256 of the embedded original PNG: `d1ce9c2af0b10a7333abc99bc706f9a6a199e5b65bf3e3009624f076b8638e6a`.

Google's current [downloadable button bundle](https://developers.google.com/static/identity/images/signin-assets.zip) was also inspected. Its SVG artwork uses an HTML `foreignObject` with a conic gradient, unsuitable for reliable display through an external SVG image in browsers. The official PNG avoids that dependency while retaining the actual current artwork. The wrapper is a container, not a vector recreation.

The local native button uses the guide's light treatment: white surface, `#747775` border, `#1F1F1F` label, a 20 px logo box, 12 px horizontal edge spacing and 10 px between logo and text. It uses the approved “Sign in with Google” wording (localized to “Đăng nhập bằng Google”), has a 44 px minimum touch height, and retains a visible keyboard focus ring. Firebase controls authentication; loading Google's Identity Services button script would add a second authentication integration unnecessarily.

Typography uses Google Sans when already available, then Roboto/Arial/system fallback; **no Google proprietary font is redistributed**. This follows the local HTML-button approach and prioritizes reliable Vietnamese rendering, but does not claim Google's certification or exact cross-platform font equivalence. The visible button remains native text for localization and assistive technology.

Google's trademark/artwork remains Google's property. This asset is used only to identify Google sign-in under the linked branding guidance, not as Atlas branding or under the project's own content license. The documentation page's general code-sample license is not treated as a blanket trademark license.
