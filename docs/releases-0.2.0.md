# Local 0.2.0 migration

This is a local breaking API update; no npm publication or deployment was performed. Model JSON keeps version:1.

Use setGaze and setGazeStrength instead of setExpression/blink. Face contains measured eyes only. Legacy face fields are rejected; migrate with skills/yuragi-rig-spec/scripts/migrate_gaze.py and inspect its separate report. expression.gaze becomes gaze.strength; other expression tracks are removed and empty clips must be reauthored.

Read yuragi-rig-spec before Python. CLI sequence is inspect → agent annotation → extract → build --prepared --rig-package. Build verifies prepared hashes and calls actual runtime validateModel before creating a playable preview. Source artwork is retained; extracted and artist-completed PNGs are authoring assets, not independent runtime layers. Visual acceptance remains a separate manual/browser check.

Mirea is now the primary packaged sample: assets/mirea/model.json + texture.png, with createMireaModel from the opt-in @yuragi/rig/mirea entry. Copy its folder to public/models/mirea. Core imports still exclude Mirea data. Momo factories and artwork have been removed; numeric baseline fixtures remain for deformation regression checks. Starter remains a template. No npm publication.
