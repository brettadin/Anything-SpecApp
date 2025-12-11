# Project Context

## What This Is
Web-based spectroscopy toolkit for exoplanet research and student education.
Built on Anything platform (React web + mobile).

## Why We're Rebuilding
- Previous versions (v1-v3) were Python desktop apps (Streamlit, PySide6/Qt)
- Distribution challenges with desktop apps
- Want cross-platform web + mobile access
- Leverage Anything's built-in auth, database, and deployment

## Related Repositories
- **spectra-app-v2** (most stable): https://github.com/brettadin/spectra-app-v2
  - 758 commits, comprehensive feature set
  - Python/PySide6/Qt desktop app
  - Reference for feature requirements and domain knowledge
  
- **beta**: https://github.com/brettadin/beta
  - Python/Streamlit, focused on JWST data
  
- **spectrasuite**: https://github.com/brettadin/spectrasuite
  - Research-grade provenance tracking

## Key Learnings from Previous Versions
- Unit conversion system is critical (vacuum nanometers baseline)
- Provenance tracking must be baked in from day 1
- Students need simple upload → analyze → export workflow
- FITS/ASCII/CSV support is essential
- NIST line lists + MAST archive integration