"use client";

import { useState } from "react";
import {
  FileText,
  BookOpen,
  Code,
  Workflow,
  Map,
  Database,
  Link,
} from "lucide-react";

const docs = {
  agents: {
    title: "For Future AI Agents",
    icon: Code,
    content: `# For Future AI Agents

## Start Here
1. Read PROJECT_CONTEXT to understand the mission
2. Review FEATURES_FROM_V2 for what we're building
3. Check DEVELOPMENT_LOG for recent progress
4. Reference spectra-app-v2 repo for scientific accuracy

## Important Context
- This is a semester-long senior project
- Target users: students learning spectroscopy
- Must handle real astronomical data (JWST, MAST archives)
- Previous desktop versions exist — we're rebuilding as web app

## Key Technical Constraints
- Anything platform (React + JavaScript, not Python)
- No external packages except those listed in system
- Must maintain provenance tracking (lesson from v2)`,
  },

  devlog: {
    title: "Development Log",
    icon: Workflow,
    content: `# Development Log

## 2025-01-11: Project Initialization & Foundation
**Goal**: Get the core infrastructure in place for web-based spectroscopy app

### Completed ✅
**Infrastructure**
- Created new Anything project with authentication enabled
- Set up database with two main tables:
  - uploaded_files (user_id, filename, file_url, metadata)
  - parsed_data (format detection, column mapping, spectral metadata)
  - Proper indexes for fast lookups

**File Upload & Parsing System**
- Built smart file parser that handles messy real-world data
  - CSV, TSV, space-delimited, semicolon, pipe-delimited
  - Detects metadata rows (comments, key-value pairs, data markers)
  - Auto-detects headers vs data rows using heuristics
  - Tests delimiters against numeric lines (not metadata text)
  - Identifies X/Y columns (wavelength/intensity detection)
  - Downsamples large datasets (>2000 points) for storage
  - Stores both preview (100 rows) and full data
  - Handles files up to 100MB

**User Interface**
- Homepage with drag-drop upload zone
- File history page (/history)
- File viewer page (/file/[id]) - shows parsed data + metadata
- Responsive design (works on mobile and desktop)
- Clean header navigation: Upload | History | Docs | User

**Documentation System** (/docs)
- For Future AI Agents guide
- Project Context & history
- Features to port from V2 (checklist)
- Domain knowledge reference
- Raw references (100+ URLs to NASA/MAST/NIST/ExoMol/etc)
- Development log (this page!)
- Accessible from main navigation

### Technical Decisions Made
**Parser Strategy**: Chose smart heuristics over rigid format requirements
- Why: Real astronomical data is messy (metadata, varying delimiters, no standards)
- Tests delimiters against numeric data rows, not text/metadata
- Handles edge cases like single-column files, mixed data types
- Robust to missing headers, extra whitespace, comment lines

**Storage Strategy**: Downsample to 2000 points for large datasets
- Original file preserved at file_url for full-resolution downloads
- Plotting/visualization uses downsampled data
- Balances performance vs fidelity

**Units**: Not implemented yet, but will use vacuum nanometers (nm) as canonical
- All conversions (Å, µm, cm⁻¹) will be reversible
- Follows approach from v2 (proven to work)

### Next Session Goals
- [ ] Build visualization using Recharts (line chart)
- [ ] Add unit conversion system (nm ↔ Å ↔ µm ↔ cm⁻¹)
- [ ] NIST line overlay feature (fetch atomic line data)
- [ ] Export functionality with provenance tracking
- [ ] Multi-file comparison view

### Known Issues & Blockers
**FITS Support**: Binary format requires special handling
- Current parser only handles text-based formats
- Need to research FITS.js or similar library
- Critical for JWST/HST data compatibility

**NIST API**: Need to determine best integration strategy
- Options: Direct API calls vs cached database
- Rate limiting concerns?
- Data licensing/attribution

**Large Files**: 100MB limit may not be enough for some datasets
- Streaming parser instead of loading full file?
- Backend chunking strategy?

### Statistics
- Database tables: 2 main + 4 auth tables
- Routes created: 5 (upload, files, file viewer, history, docs)
- Documentation pages: 6
- Lines of parser code: ~400
- Supported delimiters: 5 (comma, tab, space, semicolon, pipe)

---

## [Future entries will go here]`,
  },

  domain: {
    title: "Domain Knowledge",
    icon: Database,
    content: `# Spectroscopy Domain Knowledge

## Data Sources
- **NIST Atomic Spectra Database**: Reference line lists
- **NASA MAST**: JWST, Hubble, Cassini data
- **Exo.MAST**: Exoplanet-specific observations
- **NASA Exoplanet Archive**: System parameters

## File Formats We Handle
- **ASCII/CSV**: Tab or comma delimited, wavelength + flux
- **FITS**: Flexible Image Transport System (astronomy standard)
- **JCAMP-DX**: IR spectroscopy standard

## Unit System
- **Canonical storage**: Vacuum nanometers (nm)
- **Display options**: Å (Angstroms), µm (microns), cm⁻¹ (wavenumbers)
- All conversions are reversible and mathematically validated

## Scientific Context
(Link to your v2 docs: https://github.com/brettadin/spectra-app-v2/blob/main/docs/user/spectroscopy_primer.md)`,
  },

  features: {
    title: "Features from V2",
    icon: BookOpen,
    content: `# Features to Port from spectra-app-v2

Based on https://github.com/brettadin/spectra-app-v2

## Must-Have (Core Workflow)
- [x] Upload spectral data (CSV, ASCII, FITS)
- [ ] Plot multiple spectra
- [ ] Overlay reference lines from NIST
- [ ] Basic math operations (difference, ratio)
- [ ] Export with provenance

## Important (Research Grade)
- [ ] Unit conversion (nm/Å/µm/cm⁻¹)
- [ ] Provenance tracking
- [ ] MAST archive integration (JWST/HST)
- [ ] Annotations

## Nice to Have (Advanced)
- [ ] Gaussian fitting
- [ ] Peak detection
- [ ] IR functional groups
- [ ] Savitzky-Golay smoothing`,
  },

  context: {
    title: "Project Context",
    icon: Map,
    content: `# Project Context

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
- NIST line lists + MAST archive integration`,
  },

  references: {
    title: "Raw References",
    icon: Link,
    content: `# Raw References (Data Sources & APIs)
Full list of extracted URLs (preserved from original file).

## NASA/STScI Archives
- https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html - MAST Portal
- https://mast.stsci.edu/search/ui/#/ - MAST Search Interface
- https://exo.mast.stsci.edu/ - Exo.MAST (Exoplanet observations)
- https://archive.stsci.edu/searches.html#missions - Mission-specific searches
- https://mastweb.stsci.edu/mcasjobs/ - MAST CasJobs
- https://z.mast.stsci.edu/ - MAST Z Portal
- https://mast.stsci.edu/tesscut/ - TESS Full Frame Image Cutout
- https://archive.stsci.edu/#section-cf988969-5c71-405f-9234-123f19d6abe8
- https://archive.stsci.edu/missions-and-data/jwst - JWST Mission Data
- https://archive.stsci.edu/publishing/data-use - Data Use Guidelines
- https://timeseries.science.stsci.edu/hub/login - Time Series JupyterHub
- https://mast.stsci.edu/hlsp/#/ - High Level Science Products
- https://archive.stsci.edu/hlsp/nlte-obgrid - NLTE OB Grid HLSP
- https://archive.stsci.edu/hlsp/deepmerge - DeepMerge HLSP

## JWST Resources
- https://jwst-docs.stsci.edu/getting-started-with-jwst-data - JWST Getting Started
- https://spacetelescope.github.io/hst_notebooks/notebooks/HASP/DataDiagnostic/DataDiagnostics.html

## Spectral Line Databases
- https://www.nist.gov/pml/atomic-spectra-database - NIST Atomic Spectra Database
- https://physics.nist.gov/cgi-bin/ASD/lines1.pl (Hydrogen example query)
- https://www.chiantidatabase.org/ - CHIANTI Atomic Database
- https://exomol.com/data/ - ExoMol Molecular Line Lists
- https://cds-espri.ipsl.upmc.fr/geisa/ - GEISA Spectroscopic Database
- https://hitran.org/ - HITRAN Database
- https://hitran.org/hitemp/ - HITEMP Database

## Solar Spectral Data
- https://dkist.data.nso.edu/ - DKIST Solar Telescope
- https://nso.edu/data/historical-archive/ - NSO Historical Archive
- https://bass2000.obspm.fr/solar_spect.php - BASS2000 Solar Spectra
- https://catalog.data.gov/organization/nasa-gov?q=Solar+Spectral+Irradiance
- https://lasp.colorado.edu/sorce/data/ssi-data/ - SORCE SSI Data
- https://www.ncei.noaa.gov/products/climate-data-records/solar-spectral-irradiance
- https://www.nrel.gov/grid/solar-resource/spectra - NREL Solar Spectra
- https://spot.colorado.edu/~koppg/TSI/ - TSI Composite
- https://lasp.colorado.edu/tsis/data/tsi-data/ - TSIS TSI Data
- https://sunclimate.gsfc.nasa.gov/ssi-reference-spectra
- https://www.pveducation.org/pvcdrom/appendices/standard-solar-spectra
- https://www2.pvlighthouse.com.au/resources/optics/spectrum%20library/spectrum%20library.aspx
- https://www.nrel.gov/grid/solar-resource/spectra-astm-e490

## Planetary & Exoplanet Resources
- https://exoplanetarchive.ipac.caltech.edu/ - NASA Exoplanet Archive
- https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=PS
- https://exoplanetarchive.ipac.caltech.edu/cgi-bin/atmospheres/nph-firefly?atmospheres
- https://www.exoplanetkyoto.org/exohtml/K2-18.html - K2-18 Data
- https://exoplanets.nasa.gov/alien-worlds/ways-to-find-a-planet/
- https://exoplanets.nasa.gov/exoplanet-watch/resources/everything-exo/
- https://exoplanets.nasa.gov/exep/ - Exoplanet Exploration Program
- https://sites.lesia.obspm.fr/data-services/planetary-spectra/
- https://www.usgs.gov/labs/spectroscopy-lab - USGS Spectroscopy Lab
- https://planetary.data.nasa.gov/use-data
- https://psg.gsfc.nasa.gov/ - Planetary Spectrum Generator
- https://psg.gsfc.nasa.gov/helpatm.php
- https://psg.gsfc.nasa.gov/helpmodel.php
- https://psg.gsfc.nasa.gov/retrieval.php
- https://psg.gsfc.nasa.gov/helpapi.php

## Reference Atlases & Catalogs
- https://www.stsci.edu/hst/instrumentation/reference-data-for-calibration-and-tools/astronomical-catalogs/solar-system-objects-spectra
- https://archive.stsci.edu/hlsps/reference-atlases/cdbs/grid/solsys/AA_README_SOLSYS
- https://ned.ipac.caltech.edu/ - NASA Extragalactic Database
- https://aladin.cds.unistra.fr/ - Aladin Sky Atlas
- https://simbad.cds.unistra.fr/simbad/ - SIMBAD Astronomical Database
- https://lambda.gsfc.nasa.gov/product/ - LAMBDA (CMB/Legacy Archive)

## Virtual Observatory & Tools
- https://vao.stsci.edu/directory/getrecord.aspx?id=ivo://mast.stsci/ssap/iue
- https://vao.stsci.edu/directory/getrecord.aspx?id=ivo://mast.stsci/ssap/hst/stis
- https://vao.stsci.edu/directory/getrecord.aspx?id=ivo://mast.stsci/ssap/hst/fos
- https://vao.stsci.edu/directory/getrecord.aspx?id=ivo://mast.stsci/ssap/hst
- https://svo2.cab.inta-csic.es/theory/vosa/ - Virtual Observatory SED Analyzer

## GitHub Repositories & Code
- https://github.com/brettadin/spectra-app-v2 - Your previous version (reference)
- https://github.com/brettadin/beta - Streamlit version
- https://github.com/brettadin/spectrasuite - Provenance-focused version
- https://github.com/RGLab - Research lab tools
- https://github.com/spacetelescope/mast_notebooks - MAST Jupyter Notebooks
- https://github.com/StellarCartography/pydis - PyDIS spectroscopy tool
- https://github.com/jonathansick/awesome-astronomy - Awesome Astronomy list
- https://github.com/Rested/react-emission-spectra - React emission spectra
- https://github.com/search?q=spectroscopy&type=repositories - GitHub spectroscopy search
- https://github.com/NASA - NASA GitHub
- https://github.com/NASA-PDS - NASA Planetary Data System
- https://github.com/nasa-planetary-science
- https://github.com/paucablop/chemotools - Chemometrics tools
- https://github.com/mne-tools/mne-nirs - Near-infrared spectroscopy
- https://github.com/xraypy/xraylarch - X-ray analysis
- https://github.com/EnSpec/hytools - Hyperspectral tools
- https://github.com/astropy/specreduce - Spectroscopic reduction
- https://github.com/virtual-labs-archive/molecular-absorption-spectroscopy-iiith
- https://github.com/StollLab/EasySpin - EPR/ENDOR simulation
- https://github.com/millionconcepts/pdr - Planetary Data Reader

## Data Management & Publishing
- https://www.opendatarepository.org/ - Open Data Repository
- https://code.nasa.gov/ - NASA Open Source Software
- https://software.nasa.gov/software/SSC-00181
- https://lunaserv.lroc.asu.edu/ - Lunar Reconnaissance Orbiter
- https://cfs.gsfc.nasa.gov/ - Core Flight System
- https://huggingface.co/ - ML model hosting
- https://cesium.com/blog/2024/08/06/introducing-cesium-moon-terrain/
- https://pds.nasa.gov/tools/tool-registry/ - PDS Tool Registry

## Spectroscopic Databases (Chemistry/Materials)
- https://rruff.info/ - RRUFF Mineral Database (Raman/IR)
- https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Units=SI&Type=IR-SPEC&Index=1#IR-SPEC
- https://rformassspectrometry.github.io/book/sec-raw.html
- https://libguides.uwp.edu/c.php?g=439212&p=2988686 - Spectroscopy Library Guide

## Research Papers & Educational Resources
- https://www.aanda.org/articles/aa/full_html/2018/04/aa31631-17/aa31631-17.html
- https://www.mdpi.com/2072-4292/15/14/3560
- https://www.aanda.org/articles/aa/full_html/2020/09/aa38732-20/aa38732-20.html
- https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2021GL092980
- https://www.researchgate.net/publication/358143273_Final_Report_for_SAG_21
- https://phys.org/news/2025-07-astronomers-super-earth-exoplanet-orbiting.html
- https://arxiv.org/abs/2506.18550
- https://arxiv.org/abs/2406.05203
- https://www.youtube.com/watch?v=60-lbQQUtLU&list=PLawLaqps30oCiv24vBDZeNM5nmJ157shS
- https://www.youtube.com/watch?v=l6PfPdNBiGU
- https://www.psu.edu/news/research/story/two-james-webb-instruments-are-best-suited-exoplanet-atmospheres
- http://spiff.rit.edu/classes/resceu/lectures/spectra/spectra.html
- https://www.aanda.org/articles/aa/full_html/2024/03/aa47398-23/aa47398-23.html#S2
- https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/data
- https://science.nasa.gov/resource/isolating-a-planets-spectrum/
- https://imagine.gsfc.nasa.gov/science/toolbox/spectra2.html
- https://planetarypy.org/ - PlanetaryPy Project
- https://astrogeology.usgs.gov/titiler/docs - USGS TiTiler API
- https://opsci.smce.nasa.gov/ - Open-Source Science Initiative
- https://www2.mpia-hd.mpg.de/homes/beuther/herbst2009.pdf
- https://link.springer.com/article/10.1007/s11207-021-01853-x

## Commercial/Hardware (for reference)
- https://www.laserlands.net/laser-diode/780nm-diode/
- https://www.thorlabs.com/thorproduct.cfm?partnumber=L780P010
- https://www.crystallify.com/
- https://www.ossila.com/pages/solar-simulator-classification

## Notes for Future Development
- Many Python-only tools will need JavaScript equivalents
- Focus on public APIs (MAST, NIST, ExoMol) for data access
- Consider lightweight wrappers for common queries
- FITS file parsing will be critical (astronomy standard format)
- Provenance tracking should reference these data sources`,
  },
};

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState("context");

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-[#EAECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FileText size={28} className="text-[#357AFF]" strokeWidth={2} />
              <h1 className="text-xl font-semibold text-[#101828]">
                Spectral Analyzer - Documentation
              </h1>
            </div>
            <a
              href="/"
              className="text-sm font-medium text-[#667085] hover:text-[#101828] transition-colors"
            >
              Back to App
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border border-[#EAECF0] overflow-hidden">
              {Object.entries(docs).map(([key, doc]) => {
                const Icon = doc.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveDoc(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#EAECF0] last:border-b-0 ${
                      activeDoc === key
                        ? "bg-blue-50 text-[#357AFF]"
                        : "text-[#667085] hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{doc.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg border border-[#EAECF0] p-8">
              <pre className="whitespace-pre-wrap font-mono text-sm text-[#101828] leading-relaxed">
                {docs[activeDoc].content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
