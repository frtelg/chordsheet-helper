## ADDED Requirements

### Requirement: User can select OnSong export format
The system SHALL provide a toggle in the result view that lets the user switch between `chords-over-lyrics` and `bracketed` export formats. The selected format SHALL affect both the visual preview and the downloaded file. The default format SHALL be `chords-over-lyrics`.

#### Scenario: Default format is chords-over-lyrics
- **WHEN** the user opens the result view for the first time
- **THEN** the format toggle displays "Chords over lyrics" as the active state
- **THEN** the preview renders chord lines above lyric lines (existing behaviour)

#### Scenario: User switches to bracketed format
- **WHEN** the user activates the bracketed format toggle
- **THEN** the preview re-renders each row as a single bracketed line (e.g. `[G]Amazing [D]grace`)
- **THEN** the download file contains the bracketed output

#### Scenario: User switches back to chords-over-lyrics
- **WHEN** the user deactivates the bracketed format toggle (returning to chords-over-lyrics)
- **THEN** the preview reverts to chord lines above lyric lines
- **THEN** the download file contains the chords-over-lyrics output

#### Scenario: Rows without chords are unaffected by format switch
- **WHEN** a lyric row has no chord assigned
- **THEN** that row is rendered as a plain lyric line regardless of the selected format

### Requirement: Format state is stored in Redux
The system SHALL store the selected OnSong format (`onsongFormat`) in `AppReducer`. The initial value SHALL be `'chords-over-lyrics'`. A `setOnsongFormat` action SHALL update the value.

#### Scenario: setOnsongFormat updates the store
- **WHEN** `setOnsongFormat('bracketed')` is dispatched
- **THEN** `state.app.onsongFormat` equals `'bracketed'`

#### Scenario: Initial state defaults to chords-over-lyrics
- **WHEN** the Redux store is initialised
- **THEN** `state.app.onsongFormat` equals `'chords-over-lyrics'`
