# Launch boards batch report

This is a staging-only batch of 24 Expedition boards, one for each mission in the existing sample, core, and variety packs. Each board has four named landmarks and one switch. The English clue selects one destination; Vietnamese provides a faithful optional translation, and the hint gives the switch in UI-style A1-G5 coordinates (column A-G, row 1-5) plus the interaction rule without naming the goal.

## Coverage and validation

| Level | Boards | Language focus carried into the clue |
|---|---:|---|
| A1 | 4 | Concrete harbor and garden objects; simple personal choices and actions |
| A2 | 4 | A short past account, a future plan, explicit comparisons, and a polite request |
| B1 | 4 | Narrative sequence, route choice, purpose, and story intent |
| B2 | 4 | Conditional wording, reported viewpoints, metaphorical collocation, and genre |
| C1 | 4 | Concession, a surviving limit, negative inversion, and sequence cohesion |
| C2 | 4 | Understatement, scalar implication, pragmatic inference, and figurative editorial voice |

The 24 board mission IDs match the 24 IDs in the three existing packs exactly; there are no missing, extra, or duplicate mission IDs. All boards use four landmarks, a dry start, a dry switch, dry landmarks, and bridges placed on water. Layouts vary the orientation and crossing point of vertical and horizontal channels; three boards require crossing two channels, whose bridges open together.

Validation used the actual runtime functions in src/expedition.js. validateBoard returned no errors for all 24 boards. findRoute produced a shortest route for every goal, and replayExpedition confirmed solved=true with one switch activation for each. The runtime reachability check accepts every landmark after switch activation and rejects each goal while its bridge remains closed. The longest shortest route is 15 commands, including X, within the 40-command plan limit; the largest serialized board is 1,630 bytes, well below the 12 KiB limit. All English clues exceed 60 characters. The four C2 clues contain 44–51 words each.

Runtime validation checks board structure and reachability; it cannot establish that every learner will interpret a clue as intended. No learner usability testing was performed. The level labels follow the existing mission assignments and are not evidence of CEFR calibration.

## Answers, alternatives, and engine routes

Routes below are the actual command sequences returned by findRoute and confirmed by replayExpedition. X activates the bridge or bridges.

### A1 — Lantern Harbor

- **a1-lantern-harbor-board** — Answer: **Boathouse**. The clue describes where harbor boats rest, which matches the boathouse label. Blue Gate is a gate, Little Lighthouse is a light rather than a boat shelter, and Silver Bell is an object. Route: N → N → N → E → X → E → E → E → E.
- **a1-lantern-harbor-shell-bell-board** — Answer: **Shell Hut**. The small bell is inside the hut made from shells. Blue Door is a door, Bench is seating, and Tide Pool is water rather than a hut. Route: N → E → E → X → E → E → N → N → N.
- **a1-lantern-harbor-color-teller-board** — Answer: **Yellow Lantern**. Niko’s warm yellow window light matches this label. Green Leaf, Blue Wave, and Silver Moon are neither a yellow light nor the lantern described. Route: N → N → E → X → S → E → E → E.
- **a1-lantern-harbor-rooftop-kites-board** — Answer: **Striped Kite**. Sami chooses stripes, while Jo chooses dots. Dot Kite belongs to Jo; Red Ribbon is not a kite, and Paper Drum is a different object. Route: N → N → E → E → E → X → E → E.

### A2 — Wildseed Gardens

- **a2-wildseed-gardens-seed-tin-board** — Answer: **Blue Seed Tin**. Asha’s note follows the tin from beneath the bench to the cart. Old Bench is where it was found, Blue Cart is where it was carried, and North Gate is unrelated to the sequence. Route: N → N → E → X → E → E → E → E → N → N → E.
- **a2-wildseed-gardens-rain-plan-board** — Answer: **Pond Map**. Lio plans to show visitors a picture of the pond. Bean Bed holds seeds, Rain Jar holds water, and Garden Gate is an entrance. Route: N → E → X → E → E → E → E.
- **a2-wildseed-gardens-seed-sculpture-board** — Answer: **Wide Nest**. The note states that Tall Acorn is tallest and Paper Moon is narrowest; Wide Nest is wider than Paper Moon but shorter than Tall Acorn. Water Bowl is not a sculpture, and neither other sculpture satisfies both comparisons. Route: E → E → X → N → N → N → E → E → E.
- **a2-wildseed-gardens-garden-invitation-board** — Answer: **Clay Birds**. These are the small animal shapes the group politely asks a neighbor to arrange. Leaf Sketch is a drawing, Paper Garden is a garden model, and Rain Picture is an image. Route: N → N → N → E → X → E → E.

### B1 — Tideglass Isles

- **b1-tideglass-isles-chart-letter-board** — Answer: **Folded Canvas**. Neri’s later note says the missing chart was beneath the canvas she had folded. Tide Chart is the missing object, while Bell Cord and Air Window could not cover it as described. Route: N → N → N → E → E → X → E → E → E.
- **b1-tideglass-isles-two-paths-board** — Answer: **Ridge Posts**. The clue asks for markers that stay above rising water on the longer route. Pebble Path is a route surface, Tide Compass is an instrument, and Island Box is a container. Route: N → E → E → X → N → N → N → E → E → E → E.
- **b1-tideglass-isles-moon-moth-model-board** — Answer: **Story Wall**. Eni moves the lamp so the moth’s shadow grows on the story wall; Jo later traces its new shape there. Paper Moth is the model, Blue Lamp is the light source, and Color Box supplies colors. Route: N → N → E → E → X → E → E → E → E.
- **b1-tideglass-isles-borrowed-tide-song-board** — Answer: **Open Songbook**. The blank final line is waiting for a later singer to continue the shared song. Old Recording is already recorded, Moving Sea Grass is a plant, and Tide Shell is an object rather than the place holding the unfinished song. Route: N → E → X → N → N → N → E → E → E.

### B2 — Clockwork Canopy

- **b2-clockwork-canopy-board** — Answer: **Rule Card**. The card requires both leaf sensors to read dry at the same check before a glider test. Leaf Sensors provide readings, Wind Ribbons signal movement, and Test Glider is the device subject to the rule. Route: N → E → E → X → E → E → E.
- **b2-clockwork-canopy-echoing-gears-board** — Answer: **Lower Chamber**. Rowan’s reported observation names the chamber as the place returning the bell’s note. West Gear is his alternative possible source; Pulse Log is a record, and Spare Tooth is a part. Route: E → E → X → E → E → E → N → N → N.
- **b2-clockwork-canopy-three-voices-board** — Answer: **Brass Leaves**. Leta’s revised view says the metal leaves give the wind a vocabulary. Wind Bell is a sound source, Paper Guide is text, and Bird Mask is a mask. Route: N → N → N → E → X → E → E → S → S → E → E → N → E.
- **b2-clockwork-canopy-review-or-manual-board** — Answer: **Listening Review**. It evaluates the visitor’s listening experience and the effect of pauses. Dial Card gives operating steps, Safety Note warns about the wheel, and Catalog Blurb lists dimensions. Route: N → E → E → X → E → E → E → N → N → W.

### C1 — Prism Observatory

- **c1-prism-observatory-amber-line-board** — Answer: **Amber Line**. The clue foregrounds the fine line shifting slightly in amber light. Silver Frame is the conspicuous surround, Cool Lens is equipment, and Shadow Panel is another display feature. Route: N → E → X → E → E → E → E.
- **c1-prism-observatory-mirror-report-board** — Answer: **Lower Bound**. The clue defines a minimum retained after a newer reading replaces an estimate. Second Mirror is the newer instrument, First Mark is the earlier observation, and Glass Key is unrelated. Route: E → E → X → E → N → N → N → N → E → E.
- **c1-prism-observatory-glass-choir-board** — Answer: **Blue Prism**. The negative inversion says the prism’s blue settles only after the final note fades. Last Note is the sound, Glass Frame is a surround, and Open Stage is a venue. Route: N → N → E → X → E → E → E → E.
- **c1-prism-observatory-program-edit-board** — Answer: **Final Panel**. The sequence ends where the open-circle motif returns. Open Circle is the motif, Single Line is the contrasting shape, and Opening Caption belongs at the start. Route: E → E → X → E → E → E → N → N → W → W → W → N → N → E → E.

### C2 — Unwritten Sky

- **c2-unwritten-sky-margin-marks-board** — Answer: **Margin Mark**. “Not inconsiderable” is restrained praise that implies meaningful influence; the clue follows the repeated sign itself. Northern Copy and Six Later Copies are records containing it, while Coastal Map is a different artifact. Route: N → N → E → X → E → E → N → N → E → E → E.
- **c2-unwritten-sky-quiet-caption-board** — Answer: **Side-Light Inscription**. “All but unreadable” means nearly unreadable; the angled light reveals the faint script. Old Chart is another text, North Route is a direction, and Gallery Lamp is the light source. Route: N → N → N → E → E → X → E → E → E.
- **c2-unwritten-sky-museum-of-almosts-board** — Answer: **Visitor Book**. The folded page is interpreted as a private response placed in the book where guests write, not as evidence of fault. Glass Swan is the displayed object, Brass Key is an object, and Six-Line Note is a separate note. Route: N → E → X → E → E → N → N → E → E → E → S → S.
- **c2-unwritten-sky-editors-pencil-board** — Answer: **Blank Page**. “Breathing space” figuratively reframes the empty printed centre as a possible pause without claiming authorial intent. Red Pencil is the editor’s mark, Poem Case is the container, and Margin Note is text at the edge. Route: N → E → E → X → E → E → E → N → N → N → E.

## Provenance and rights

The Council of Europe Companion Volume is listed as a framework reference for broad language-demand organization only; it is not a source of copied clue wording or reproduced descriptors. The fictional settings, landmark names, clues, translations, and hints were authored for this batch. No public quiz banks or passages were copied. No Creative Commons or other external license is claimed for the new content.

