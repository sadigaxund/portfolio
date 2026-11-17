# Changelog

Changes a visitor to the site would notice. The format follows [Keep a Changelog](https://keepachangelog.com). Versions use date-based CalVer, `YYYY.M.N`, where `N` counts releases within the month.

## [Unreleased]

### Changed

- The role line reads Software, DevOps, and Data Engineer.
- Back to the landing page reads Back to Start, and update messages appear at the bottom right.
- Project pages list their links as one group of rows, each with its address, and show light stills in place of the 8 MB demo GIFs, with a link to watch the demo.
- Every leaf page sits in one frame: a header bar with Back and the update control, the note in a centered column, Next and Back boxes, and one foot with the contact links and a Powered by Markii badge.
- The update control is now labeled Update, its messages say what data is shown, and the update question is one short sentence from Markii.
- Pages below the start no longer show a Contact link at the top right, and only leaf pages end in the site foot with the contact links.
- The refresh question now says "this page" where it said "this note", and images in remote notes load as they near the screen.

### Fixed

- An update that GitHub refuses, such as for a rate limit, now says Could not update and keeps the shown values, where it said Updated and blanked them.
- On a short leaf page the foot sits at the bottom of the window instead of below it.
- On a tall window, the site foot no longer shows mid-screen during a walk.

## [2026.11.5] - 2026-11-17

The design pass for leaves, contact, and the map.

### Changed

- The update control is now labeled Update, its messages say what data is shown, and the update question is one short sentence from Markii.
- Text is larger and grows with the window, and running text keeps to about 70 characters a line.
- Leaf pages draw a blue thread down the left with a stop at each section, and on wide screens section titles sit beside the thread.
- Career, Education, and Certifications show role and date lines as quieter detail text.
- Each leaf ends with a link to the next page in its section.
- Notes with live values end in a bar that says how old the values are, with a "Refresh values" button and a Markii credit.
- Refreshing asks before contacting GitHub in a plain dialog, and a short message reports the result.
- Section pages show their summary in a larger lead size.
- Every page below the start has a Contact link opposite Back and a foot with the contact links, so contact is one step away.
- On the start page, the keyboard reaches the contact links before the three roads.
- After moving to a new page, keyboard focus starts at its heading, and a skip link leads past Back.
- Shared links carry a description and title for previews in chat apps and email.
- On the map, a page's branch ends in a ring and a section's branch bends on, and pointing at a stop draws its branch in blue.
- Map previews wrap within a bounded width and always show whole, never cut off mid-sentence.
- Pages with live values load the script runner only when a visitor refreshes, so a first visit downloads about 150 KB less.

### Fixed

- Dark mode now colors buttons, toasts, and dialogs from the site palette.
- Faint text in markii components meets the 4.5:1 contrast minimum in both color schemes.

## [2026.11.4] - 2026-11-17

Note spacing and the site icon.

### Fixed

- Text after a component in a note gets the same gap as text after text.
- The site icon loads on the published site.

## [2026.11.3] - 2026-11-17

The Markii page and note layout.

### Changed

- The update control is now labeled Update, its messages say what data is shown, and the update question is one short sentence from Markii.
- The Markii page shows the Markii format tour, taken from the markii-vault repository at each build.
- Notes sit in one centered column, and the script markers under live values are hidden.

## [2026.11.2] - 2026-11-17

Project pages and markii components.

### Added

- The four project pages tell each project's story, with a GitHub panel that shows the last push, language, and stars as of the build.
- A note with scripts shows the values from the last build, marked as of the build month, before its own run finishes.

### Fixed

- Note components such as cards, stats, tabs, and charts follow the site's colors and font in light and dark.
- Button labels stay readable in dark mode.

## [2026.11.1] - 2026-11-15

Content checkpoint. Professional holds real entries, and leaf pages render their notes through markii.

### Changed

- The update control is now labeled Update, its messages say what data is shown, and the update question is one short sentence from Markii.
- New colors and type, including a dark look that follows the visitor's setting.
- Every leaf page now shows its note from the content folder. Career reads as a plain list of roles instead of a timeline.
- The landing hero spans the page in two columns.
- The road walked turns blue, and the road ahead stays ink.
- Back names where it goes.

### Added

- A site icon drawn from the fork in the line.
- Each road at the fork, and each stop on a section, says what is down it.
- The landing page shows the owner's name, DevOps role, summary, and a Resume link before Email, GitHub, and LinkedIn.
- Career, Education, and Certifications show real entries from the resume.
- Projects lists git-resume, Mandible, Markii, and Aqueduct, each with a one-line description.
- A note with Lua scripts runs them in the browser when the page opens, and has a Run button under its first heading.

## [2026.11.0] - 2026-11-06

Skeleton checkpoint. All content is placeholder.

### Added

- The landing page shows the name, role, summary, and contact links above a line with a fork, and every path and leaf has its own page and URL, with placeholder content.
- Opening a leaf splits the line into two that part to the screen edges, and the leaf takes the whole screen. Back closes it again.
- Each section lists its children as stops that sprout from the line in order after it arrives, and a level can mix leaves and subsections at any depth.
- Every move between levels is one continuous walk in both directions: what leaves undraws, the camera pans along the line, then what arrives draws on.
- Scrolling waits until a line transition has finished.
- At the fork, arrow keys pick a path, and scrolling or swiping past the page bottom continues to Professional. Scrolling up from the top of Professional returns.
