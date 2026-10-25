# Local profiles and debug mode

Implemented after skills release a238414. Profiles live only in this browser, with stable IDs and separate saves; names are not authentication. Anyone using the exact display name `達也0726` can enable the development tools.

- First launch asks for a 1–24-character name. Title Settings adds, renames and switches up to 20 local users. Duplicate names are rejected. Cancel creates no profile.
- Metadata: `wordbound-profiles-v1`; saves: `wordbound-profile:<id>:normal` and `wordbound-profile:<id>:debug`.
- The first profile copies `wordbound-realms-v1` once. The original is retained. Renaming never changes the save key. Existing game save fields remain unchanged.
- Debug starts OFF on reload. The exact-name profile can toggle on the title. Its normal save is copied to debug only on first debug launch; later sessions retain their separate debug progress. Renaming or switching returns to normal mode.
- A persistent DEBUG badge and menu identify the mode. Tools register the active bestiary, grant missing active monsters, raise the current party to Lv15 and restore HP/SP, replenish existing items and gold, move to safe map tiles, and start a three-enemy test battle.
- No tool deletes saves, grants network permissions, or modifies normal acquisition rules. It is not a server account system or a complete quest-completion editor. Browser storage clearing still removes local profiles.

Validation: `node profiles-test.cjs`, `node profile-tools-test.cjs`. Browser QA uses isolated RAM storage, not production player data. Desktop Chrome at 640×300 and 844×390 verifies settings, naming, switching, debug toggle and separate saves. Physical phone/TV hardware was not tested.
