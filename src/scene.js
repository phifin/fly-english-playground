// Original vector scene, drawn for P0. No external assets, fonts or image requests.
export function scene({ plan, frame, weather, discoveries, running, step }) {
  const tools = frame || plan;
  const stars = discoveries.includes('stars');
  const flowers = discoveries.includes('flowers');
  const lit = running && step === 'light';
  const flower = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 8Q-6 24-3 40M-3 29q-20-18-21-5 7 13 21 5m1-12q16-15 19-3-4 12-19 3" fill="#65816d" stroke="#456957" stroke-width="2"/>${flowers ? '<g class="bloom"><ellipse cy="-9" rx="8" ry="17" fill="#f5dfb4"/><ellipse cy="-9" rx="8" ry="17" fill="#f5dfb4" transform="rotate(72)"/><ellipse cy="-9" rx="8" ry="17" fill="#f5dfb4" transform="rotate(144)"/><ellipse cy="-9" rx="8" ry="17" fill="#f5dfb4" transform="rotate(216)"/><ellipse cy="-9" rx="8" ry="17" fill="#f5dfb4" transform="rotate(288)"/><circle r="7" fill="#ca9260"/></g>' : '<path d="M0 9Q-21-8-8-19L0-10 7-22Q23-6 0 9" fill="#baabbf" stroke="#8b7996" stroke-width="2"/>'}</g>`;
  return `<svg class="world-svg" viewBox="0 0 1100 610" role="img" aria-labelledby="scene-title scene-description" xmlns="http://www.w3.org/2000/svg">
    <title id="scene-title">The folded observatory</title><desc id="scene-description">A paper observatory on a leafy island, with a lantern, a turning mirror, a shutter and a moonflower garden. Use the labelled buttons around the scene to inspect and change them.</desc>
    <defs>
      <linearGradient id="sky-wash" x2="0" y2="1"><stop stop-color="${weather === 'mist' ? '#cfd8da' : '#ece7dc'}"/><stop offset="1" stop-color="#f4eee0"/></linearGradient>
      <linearGradient id="roof-wash" x2="1" y2="1"><stop stop-color="#73918b"/><stop offset="1" stop-color="#405e5a"/></linearGradient>
      <linearGradient id="land-wash" x2="0" y2="1"><stop stop-color="#c6cf9e"/><stop offset="1" stop-color="#9dae85"/></linearGradient>
      <radialGradient id="lantern-glow"><stop stop-color="#ffdd8c" stop-opacity=".6"/><stop offset="1" stop-color="#ffdd8c" stop-opacity="0"/></radialGradient>
      <pattern id="roof-lines" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M0 28L28 0" fill="none" stroke="#c7d1b5" stroke-width="1.2" opacity=".28"/></pattern>
      <filter id="paper-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#3c463c" flood-opacity=".11"/></filter>
    </defs>
    <rect width="1100" height="610" rx="28" fill="url(#sky-wash)"/>
    <circle cx="195" cy="118" r="61" fill="#e9c399" opacity=".62"/>
    <path d="M0 240Q100 151 230 239T490 220T760 194T1100 233V410H0Z" fill="#d8d8c5"/>
    <path d="M0 302Q150 218 277 292T548 258T822 281T1100 269V466H0Z" fill="#bdc9b3" opacity=".65"/>
    <g fill="#f9f6ec" opacity=".78" class="cloud"><path d="M43 116q15-23 36-8 10-36 43-18 21-16 40 8 30-4 35 18z"/><path d="M885 96q12-20 32-12 16-27 43-8 26-4 35 20z"/></g>
    <g stroke="#7d8a80" fill="none" stroke-width="2" opacity=".65"><path d="M338 111q8-9 16 0 9-9 17 0M383 93q6-6 12 0 6-6 12 0"/></g>
    <ellipse cx="566" cy="550" rx="410" ry="25" fill="#65745b" opacity=".11"/>
    <g filter="url(#paper-shadow)">
      <path d="M102 383Q99 300 253 318L425 331 662 289Q876 284 996 393L947 464 821 519 608 551 385 535 197 487Z" fill="#85896d"/>
      <path d="M197 434l55 73 89 13-43-74m186-18 48 117 75 6-14-126m153-19 28 117 70-36-18-95" fill="#a2a486"/>
      <path d="M103 383Q106 309 252 318L425 331 662 289Q884 286 996 393L958 433Q817 487 625 481L390 488 199 447Z" fill="url(#land-wash)"/>
      <path d="M275 435Q418 405 469 421T666 409Q729 384 807 404" fill="none" stroke="#e5dab7" stroke-width="33" stroke-linecap="round"/>
      <path d="M470 421Q496 357 598 332T719 267" fill="none" stroke="#e7ddbd" stroke-width="20" stroke-linecap="round"/>
      <g fill="#aab989" opacity=".7"><ellipse cx="234" cy="383" rx="81" ry="20"/><ellipse cx="906" cy="403" rx="65" ry="30"/></g>
    </g>
    <g stroke="#7c8464" stroke-linecap="round"><path d="M165 407l-3-17m9 14 6-14m-7 14-5-22m766 58-2-21m-8 16-7-16m253-13-1-20m-9 16-5-13"/></g>
    <g class="paper-tree" transform="translate(159 245)"><path d="M35 170L28 52m7 65L1 81m31 7 38-45" stroke="#79745a" stroke-width="9" fill="none"/><ellipse cx="16" cy="62" rx="53" ry="72" fill="#6f886e" transform="rotate(-22 16 62)"/><ellipse cx="63" cy="42" rx="48" ry="62" fill="#819773" transform="rotate(16 63 42)"/><path d="M29 126L17 48m11 58 36-65" stroke="#b2bb92" stroke-width="2" fill="none"/></g>
    <g transform="translate(974 288) scale(.63)"><path d="M0 175L-1 30" stroke="#7b795f" stroke-width="10"/><ellipse cx="-15" cy="48" rx="53" ry="82" fill="#789072"/><ellipse cx="29" cy="43" rx="41" ry="64" fill="#96aa80"/><path d="M0 145L-15 30m15 69 28-63" stroke="#c1c8a0" fill="none" stroke-width="2"/></g>
    <g class="observatory" filter="url(#paper-shadow)">
      <path d="M608 249l39-26h178l40 27v149l-41 15-217-26z" fill="#d3cab1"/>
      <path d="M648 241h178v173l-178-14z" fill="#eee4cd"/>
      <path d="M825 242l40 8v149l-40 15z" fill="#bdb797"/>
      <path d="M618 245Q620 118 734 119q105 4 112 126z" fill="url(#roof-wash)"/>
      <path d="M618 245Q620 118 734 119q105 4 112 126z" fill="url(#roof-lines)"/>
      <path d="M628 238q18-95 107-110M837 238q-16-91-103-110" fill="none" stroke="#b4c3ad" stroke-width="2" opacity=".8"/>
      <path d="M605 245l239-1 19 12-252 4z" fill="#49635a"/>
      <path d="M731 117v-26m-6 0h12" stroke="#7c8061" stroke-width="3"/><circle cx="731" cy="87" r="5" fill="#b49764"/>
      <circle cx="735" cy="304" r="43" fill="#415261" stroke="#b8a275" stroke-width="9"/>
      <circle cx="735" cy="304" r="34" fill="${stars ? '#455d70' : '#4c6268'}"/>
      ${stars ? '<g class="constellation" fill="#f5dc9b" stroke="#e5c78b"><path d="M712 302l15-20 19 10 13 22-24 11-23-23" fill="none" stroke-width="1.5"/><circle cx="712" cy="302" r="3"/><circle cx="727" cy="282" r="3"/><circle cx="746" cy="292" r="3"/><circle cx="759" cy="314" r="3"/><circle cx="735" cy="325" r="3"/></g>' : '<path d="M727 297l15 0m-7-7v15" stroke="#a2b1a0" opacity=".65"/>'}
      <path d="M675 400v-39q0-25 18-25t18 25v41z" fill="#748575" stroke="#b4b18b" stroke-width="4"/>
      <circle cx="701" cy="376" r="3" fill="#e0c88e"/>
      <path d="M622 272v79m0-48h18m-18 26h18m181-52v71m3-44h23m-23 24h23" fill="none" stroke="#b1ad92" stroke-width="3"/>
      <path d="M657 415l-31 10h112l-21-13z" fill="#b5b08f"/>
    </g>
    <g transform="translate(545 340)"><path d="M-30 69l66-4-1-72q-3-18-30-16-27 1-30 20z" fill="#d6c5a0" stroke="#7c876b" stroke-width="3"/><path d="M-20 57h45V0q0-15-22-13-23 1-23 17z" fill="#4f6a5f"/>
      ${tools.shutter === 'closed' ? '<path d="M-20 4l20-8v61l-20 0zm23-7 22 7v53H3" fill="#839b7b" stroke="#b4c3a0" stroke-width="1.5"/><circle cx="-5" cy="29" r="2" fill="#e4c27e"/>' : '<path d="M-20 4l-22 10v48l22-5m45-53 20 10v46l-20-3" fill="#8ba27e" stroke="#bfd0a2" stroke-width="2"/>'}
      <path d="M-40 72h85" stroke="#83916e" stroke-width="5" stroke-linecap="round"/>
    </g>
    <g transform="translate(438 339)"><path d="M-20 78l18-66m22 66L2 12m-24 69h47" fill="none" stroke="#977c54" stroke-width="7" stroke-linecap="round"/><g transform="rotate(${tools.mirror === 'sky' ? -35 : 23})"><ellipse cy="-1" rx="35" ry="42" fill="#adc7c6" stroke="#c4a776" stroke-width="7"/><path d="M-18-19l25-8m-29 22 39-12" stroke="#e5efde" stroke-width="5" stroke-linecap="round" opacity=".8"/></g><circle cy="18" r="5" fill="#967b52"/></g>
    <g class="light-trail ${lit ? 'lit' : ''}" fill="none" stroke="#e8bb60" stroke-width="8" stroke-linejoin="round"><path d="M292 406L438 338 ${tools.mirror === 'sky' ? 'L735 192L735 304' : 'L545 365L843 420'}"/><path d="M292 406L438 338 ${tools.mirror === 'sky' ? 'L735 192L735 304' : 'L545 365L843 420'}" stroke="#fff0ba" stroke-width="3"/></g>
    <g transform="translate(279 394)"><circle r="66" fill="url(#lantern-glow)" class="lantern-halo"/><path d="M-13-23v-10q13-12 26 0v10" fill="none" stroke="#8e7550" stroke-width="4"/><path d="M-21-21h42l-5 51h-32z" fill="#edce87" stroke="#a48858" stroke-width="4"/><path d="M-22-24h44m-39 58h34" stroke="#7c7055" stroke-width="6" stroke-linecap="round"/><path d="M0-16v40m-13-38 3 38m23-38-3 38" stroke="#b79356" stroke-width="2"/><ellipse cy="8" rx="5" ry="11" fill="#fff1b1"/></g>
    <g class="nim" transform="translate(${running ? (step === 'shutter' ? 522 : step === 'mirror' ? 406 : 308) : 353} ${running && step === 'mirror' ? 377 : 428})"><ellipse cx="0" cy="20" rx="28" ry="7" fill="#71816a" opacity=".2"/><path d="M-14 6l-7 12m30-12 9 12" stroke="#6c715b" stroke-width="5" stroke-linecap="round"/><path d="M-16-24Q-19-43 0-44t18 19l-2 25q-13 13-30 0z" fill="#dfbd78" stroke="#9f8658" stroke-width="2.5"/><path d="M-11-27q11-5 23 0v14q-11 9-23 0z" fill="#fcf1d3"/><circle cx="-5" cy="-21" r="2.5" fill="#3b5149"/><circle cx="7" cy="-21" r="2.5" fill="#3b5149"/><path d="M-2-13q3 3 6 0" fill="none" stroke="#7b6746" stroke-width="1.5"/><path d="M18-18h13m-1-8v16m0-16q13-9 12 0-3 7-12 0m0 16q13 9 12 0-3-7-12 0" fill="none" stroke="#a58b55" stroke-width="3"/><path d="M-17-9l-9 7" stroke="#a58b55" stroke-width="4" stroke-linecap="round"/></g>
    <g class="garden">${flower(815, 410, .85)}${flower(851, 429, 1.15)}${flower(887, 408, .8)}${flower(913, 438, .75)}${flower(787, 438, .6)}</g>
    <g fill="#e5e4bd"><circle cx="234" cy="453" r="3"/><circle cx="327" cy="468" r="4"/><circle cx="743" cy="461" r="3"/></g>
    ${weather === 'mist' ? '<g class="mist" fill="#f2f5ec" opacity=".6"><path d="M44 272q170-31 338-5t357-10 317 6v23q-135-14-313 9t-372-4T44 294z"/><path d="M100 446q180-27 379 3t460-8v24q-246 36-470 4T100 466z"/></g>' : ''}
    <g opacity=".4" stroke="#808c70" fill="none" stroke-width="1.5"><path d="M62 530h61m-31-5v10m913-67h40m-20-5v10"/><circle cx="1035" cy="173" r="12"/><path d="M1035 150v46m-23-23h46"/></g>
    <g transform="translate(68 459) rotate(-8)"><path d="M0 0h62v41H0z" fill="#ede6cf" stroke="#c0b28c"/><path d="M10 11h43M10 19h31M10 27h38" stroke="#aea788" stroke-width="2"/></g>
  </svg>`;
}
