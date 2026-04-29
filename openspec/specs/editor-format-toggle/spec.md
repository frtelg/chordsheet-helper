## ADDED Requirements

### Requirement: Render-only format toggle for the left textarea

The system SHALL provide a toggle above the left textarea that switches the textarea's rendered presentation between bracketed OnSong and chords-over-lyrics. The toggle SHALL NOT change the canonical storage format. Storage SHALL always remain bracketed OnSong.

#### Scenario: Toggle to chords-over-lyrics
- **GIVEN** the canonical string is `"I [Am]once was [G]lost"`
- **WHEN** the user activates the chords-over-lyrics format
- **THEN** the textarea displays the chord names on a separate line above the lyric, e.g. `"  Am       G\nI once was lost"`, while the canonical string in Redux is unchanged

#### Scenario: Toggle back to bracketed
- **GIVEN** the toggle is set to chords-over-lyrics and the user has typed in that view
- **WHEN** the user toggles back to bracketed
- **THEN** the textarea displays the canonical bracketed string and the canonical string in Redux is unchanged

### Requirement: Round-trip parse and render

The format-toggle parser and renderer SHALL be round-trip safe. For every accepted canonical bracketed string `s` and every supported format `f`, `parse(render(s, f), f)` SHALL equal `s`.

#### Scenario: Round-trip property
- **WHEN** a unit test feeds a corpus of accepted canonical strings through `parse(render(s, f), f)` for each format
- **THEN** the result equals the original `s` for every input

### Requirement: Default format

On first render, the toggle SHALL default to bracketed.

#### Scenario: First render
- **GIVEN** the user has just loaded the app
- **WHEN** the editor renders
- **THEN** the toggle is set to bracketed and the textarea shows the canonical bracketed string
