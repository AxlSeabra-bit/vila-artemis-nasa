# Guia Rápido de Submissão (Copiar e Colar) | NASA Space Apps Challenge 2026

> **Projeto:** Vila Artemis NASA (`0.2.1AH-simulador_de_missao_da_NASA`)  
> **Equipe:** Axl Seabra, Jhonathan Hiroki, Bruna Sara e Maycon Douglas  
> **Desafio:** Build a Junior Astronaut Mission Trainer  
> **Prazo Final:** Domingo, 15 de novembro de 2026, às 23h59 (horário local)  
> **Regra do Guia Oficial:** Todos os campos do formulário na plataforma `spaceappschallenge.org` devem ser preenchidos em **Inglês (English)**.

---

## 1. Project Name
```text
Vila Artemis NASA: Junior Astronaut Mission Trainer
```

---

## 2. High-Level Project Summary
```text
Vila Artemis NASA is an educational pixel-art mission trainer and resource-management game designed for children ages 7 to 13 (supporting Portuguese, English, and Spanish). Guided by a fictional NASA scientist, Dr. Bruna, players receive an initial 100-Lunar-Coin budget to plan their first expedition, compare real lunar regions on a 2D NASA LRO global atlas (Equatorial Plain vs. South Polar Region), and manage four separate life-support reserves (Energy, Water, Oxygen, and Food) alongside cumulative radiation exposure.

Our playable prototype delivers a complete, step-by-step interactive onboarding tutorial on the Moon's equatorial plain followed by a second unlockable expedition to the South Polar Craters (Cabeus/LCROSS), while establishing the written design for long-term colony progression and a 400-coin Mars expedition. By combining cozy top-down visuals with verifiable NASA datasets (LRO CGI Moon Kit, M3 and LCROSS polar ice findings, LOLA/NTRS south-pole radiation modeling, CCMC DONKI space weather archives, OSDR RadLab ISS dosimetry, and SCaN communication propagation), Vila Artemis transforms complex astronaut engineering trade-offs into an accessible, scientifically honest classroom and mobile adventure.
```

---

## 3. Link to Project Demo
*Faça upload do arquivo `Demo_7_Slides_Vila_Artemis_NASA_2026.pptx` (gerado nesta mesma pasta `relatorio`) ou do vídeo de até 30 segundos no Google Drive, OneDrive, GitHub ou YouTube com acesso público ("Qualquer pessoa com o link pode ver") e cole o link abaixo:*
```text
[INSERIR LINK PÚBLICO DO GOOGLE DRIVE / YOUTUBE DA DEMO DE 7 SLIDES OU VÍDEO DE 30S]
```

---

## 4. Link to Final Project
```text
https://age-of-artemis-nasa.vercel.app
```
*(Se também disponibilizarem pasta pública no Google Drive ou repositório no GitHub com a versão `0.2.1AH`, adicione o link junto acima).*

---

## 5. Detailed Project Description
```text
1. WHAT EXACTLY DOES IT DO?
Vila Artemis NASA (version 0.2.1AH-simulador_de_missao_da_NASA) is an interactive 2D top-down pixel-art Junior Astronaut Mission Trainer built for students ages 7 to 13. It teaches young explorers how real space missions depend on careful budgeting, landing site selection, life-support management, scientific data transmission, and radiation protection.

Our project is structured in two complementary layers:
• Layer A (Playable Interactive Prototype - Implemented in Code): A complete, story-driven Tutorial Expedition to the Lunar Equatorial Plain and an unlockable Second Expedition to the Lunar South Polar Craters (Cabeus Crater), complete with a Science Center shop, Explorer Profile, multi-device LAN student accounts, offline PWA support, and a full in-game NASA Science Atlas.
• Layer B (Written Game Design Architecture - Post-Tutorial Expansion): A comprehensive blueprint for the rest of the game, covering continuous sandbox base-building, the 14-Earth-day Lunar Night survival loop with Kilopower nuclear fission, 3D regolith printing, autonomous VIPER rovers, Deep Space Network (DSN) Earth-Moon supply swaps, Classroom Deterministic Mode, and the 400-coin Mars Expedition to Jezero Crater.

2. HOW DOES IT WORK? (THE PLAYABLE TUTORIAL & POLAR EXPEDITION LOOP)
• Mission Briefing & Funding: Dr. Bruna (our pixel-art scientist guide) welcomes the player and explains that space exploration requires planning and investment. Investors grant 100 Lunar Coins (play money; zero real-money transactions). Players compare two missions: Journey to the Moon (100 coins) and Journey to Mars (400 coins, locked as a future goal). Selecting the Moon spends the 100 coins.
• 2D Lunar Landing Atlas (NASA LRO): Using an equirectangular global map from the NASA SVS CGI Moon Kit (2048x1024), players compare two regions:
  1) Equatorial Plain (+0 extra coins): Earth-facing radio visibility, open terrain requiring radiation shelter, and no local water ice (crew relies on water brought from Earth for a short mission).
  2) South Polar Region (+50 extra coins for polar logistics in the first trip): Permanently shadowed craters hold water ice detected by NASA M3 and LCROSS, rugged terrain can block Earth radio line-of-sight, and shelter is still mandatory. With 0 coins left after booking the rocket, the player launches to the Equatorial Plain.
• Launch, Transit & Touchdown Cutscene: A 12-second animated flight canvas illustrates launch, lunar transit, and touchdown (reminding students that a real lunar trip takes days).
• Surface Resource Management & Obstacle Pathfinding: On the 28x28 lunar surface grid, Energy (⚡), Water (💧), Oxygen (🫧), and Food (🌱) are tracked as separate reserves continuously consumed by the crew. Two large craters in the northwest and southeast corners block construction; astronauts automatically compute safe walking routes around crater rims.
• Base & Antenna Construction: The player selects free ground to build the Lunar Base (cost: 30 Energy, 20 Oxygen; 3 astronauts walk to the site and build for 15 seconds, then enter the shelter) followed by Communication Antennas (cost: 25 Energy, 15 Oxygen; 15 seconds of assembly).
• Scientific Data Transmission & Leveling Up: Tapping the completed antennas starts a 20-second transmission to Earth, earning +1 Knowledge point per second (filling the HUD meter from 0/20 to 20/20) and advancing the player to Level 2.
• Solar Storm Training Alert & Cumulative Radiation: A red alert banner triggers an 8-second warning countdown (Dr. Bruna's explanation appears 3 seconds after the alarm so players notice the visual alert first), followed by a 12-second solar storm wave. Keeping the crew sheltered inside the base drastically slows radiation accumulation (0.015%/s sheltered vs. 6.0%/s exposed). Students learn that radiation exposure is cumulative and does not disappear when entering shelter. Reaching 100% educational radiation budget or depleting Energy, Water, Oxygen, or Food ends the mission with a clear scientific explanation.
• Return to Earth, Science Center & South Polar Expedition: After surviving the storm, the crew boards the rocket, returns to Earth, and earns +350 Lunar Coins and +5 Knowledge (25 total). At Level 2 on Earth, players open the Science Center to buy three devices (Food Greenhouse, Water Extractor, and Solar Panels for 30 coins each) and unlock the 120-coin South Polar Craters Expedition (Cabeus/LCROSS), where they choose 1 to 6 astronauts (doubling crew halves construction time from 45s/crew while doubling water, oxygen, and food consumption).

3. WRITTEN ARCHITECTURE FOR THE REST OF THE GAME (FUTURE EXPANSION)
Beyond the playable tutorial and polar research mission, our written design specifies:
• Continuous Colony Sandbox & 3-Star Upgrades: Expanding the outpost with Regolith 3D Printers (turning lunar dust into shielding blocks), Habitat Pods, Radiation Bunkers, and Kilopower Fission Reactors.
• Lunar Night Survival: Surviving the 354-hour lunar night when solar arrays drop to zero output, teaching power prioritization and nuclear fission backup.
• Autonomous VIPER Rovers & DSN Trade: Deploying robotic rovers that harvest polar ice without biological radiation risk, and trading resources with Earth via the Deep Space Network with realistic 2.6s round-trip lunar light-time delay.
• Act III - The 400-Coin Mars Expedition (Jezero Crater): Managing multi-Sol global dust storms, extracting oxygen from atmospheric CO2 via NASA's MOXIE technology, and handling 4-to-24-minute one-way radio latency.
• Classroom Deterministic Mode (/?mode=classroom&seed=TURMA-4A): 10-minute synchronized classroom runs where every student group faces the exact same historical NASA DONKI solar storm sequence.

4. SCIENTIFIC TRANSPARENCY & HONESTY
Every NASA dataset in Vila Artemis is strictly separated from game rules. The in-game NASA Science Atlas lets students inspect the 2018 M3 South Pole Water Ice map, the 2009 LCROSS Cabeus findings, the 2024 LOLA/NTRS South Pole Primary Proton Dose model (Phipps et al.), 33 archived notifications from the May 2024 DONKI extreme solar storm (plus live CCMC DONKI queries), and real ISS DosTel1 readings from NASA OSDR RadLab (µGy/h). Provenance, SHA-256 file hashes, coordinate transformations, and explicit scientific boundaries are documented in-app and in science-manifest.json.

5. TOOLS, CODING LANGUAGES, HARDWARE & SOFTWARE USED
• Frontend & Game Engine: TypeScript 5.6, HTML5 Canvas (2D pixel-art renderer with A* / slab-intersection obstacle pathfinding), CSS3, Vite 5.4, Web Audio API (procedural retro sound effects).
• Mobile & Offline Packaging: Progressive Web App (Service Worker caching maps, fonts, and science JSONs) and Capacitor 8.6.2 for Android (Temurin JDK 21, Gradle 8.14, Android SDK 36, generating verified APK and AAB bundles).
• Classroom LAN Backend: Node.js (v22+ built-in node:sqlite and node:http) serving multi-device student accounts over local Wi-Fi (port 4176) with scrypt password hashing, HttpOnly session cookies, and multi-device conflict protection.
• Data Processing & Automated QA: Python 3 (Pillow, pypdfium2) for extracting M3 cyan ice pixels, digitizing LOLA radiation legend samples, and computing SHA-256 provenance manifests; esbuild + Node simulation verifiers and Playwright E2E browser tests on Desktop (1280x800) and Mobile (390x844).
```

---

## 6. Use of Super Intelligence (SI)
```text
Yes. Our human team (Axl Seabra, Jhonathan Hiroki, Bruna Sara, and Maycon Douglas) conceived the core educational game design, the age-appropriate pedagogical rules (7 to 13 years old), the 100-coin funding and lunar landing site trade-offs, the step-by-step tutorial narrative, and the pixel-art scientist character (Dr. Bruna). We utilized AI / Super Intelligence (SI) coding and documentation assistants (Google Gemini / Antigravity IDE and OpenAI Codex) as productivity accelerators for:
1. Code Implementation & Refactoring: Assisting with TypeScript module structuring, HTML5 Canvas rendering, crater pathfinding geometry, SQLite LAN account synchronization, and automated Playwright/Node test scripts.
2. Scientific Data Pipeline & Documentation: Writing Python scripts (scripts/prepare-science.py) to compute SHA-256 provenance hashes, normalize NASA CCMC DONKI and OSDR RadLab JSON archives, and format technical documentation and bilingual submission reports.

Compliance with NASA Space Apps SI Policy:
• No NASA logos, flags, or mission identifiers were generated or modified by SI.
• All NASA scientific visuals (LRO CGI Moon Kit, M3 ice distribution, LOLA/NTRS radiation figure) are authentic, unaltered public-domain products credited to their respective NASA centers.
• SI assistance in code and documentation is explicitly acknowledged in our project documentation and metadata.
```

---

## 7. NASA Data
```text
We integrated 9 official NASA datasets, models, and technical resources into Vila Artemis NASA (documented with SHA-256 hashes in data/derived/science-manifest.json and data/derived/mission-map.json):

1. NASA SVS CGI Moon Kit (Lunar Reconnaissance Orbiter - LRO LROC & LOLA, 2025):
   • URL: https://svs.gsfc.nasa.gov/4720/
   • Usage: 2048x1024 equirectangular global color map (lunar-global-lroc.jpg, SHA-256: f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170) powering the 2D Lunar Landing Atlas where players compare the Equatorial Plain (0° lat, 24° E) and the South Polar Region (82° S, 20° E).

2. NASA JPL / Moon Mineralogy Mapper (M3) on Chandrayaan-1 - South Pole Water Ice Distribution (2018):
   • URL: https://www.jpl.nasa.gov/news/ice-confirmed-at-the-moons-poles/ and https://www.usgs.gov/media/images/moons-south-pole-image-water-icepng
   • Usage: Public-domain south polar water-ice map (moon-south-ice.png, SHA-256: 9aa1783c2c3018da0afef75135a5f166cfe3a50816c2899baf6763b21ef95246) displayed in the in-game NASA Science Atlas ('Ice' tab) and processed via scripts/prepare-science.py to map 8 representative cyan ice cells (m3-1 through m3-8).

3. NASA LCROSS (Lunar Crater Observation and Sensing Satellite) - Cabeus Crater Ice Discovery (2009):
   • URL: https://www.nasa.gov/general/what-is-lcross-the-lunar-crater-observation-and-sensing-satellite/
   • Usage: Scientific basis and reference dataset (data/derived/polar-mission.json) for our unlockable second expedition ('South Polar Craters'), teaching how LCROSS detected water ice in excavated material inside permanently shadowed polar craters.

4. NASA NTRS 20240004047 - Lunar South Pole Primary Proton Radiation Model (Phipps et al., LPSC 2024, Fig. 3 / LOLA 128 ppd terrain):
   • URL: https://ntrs.nasa.gov/citations/20240004047
   • Usage: Displayed in the NASA Science Atlas ('Protection' tab, lunar-radiation-model.pdf SHA-256: bc8859933e9e0c51ed9246ee9b535270eab5e20f23ca027171e735d2728aacbb) with three digitized legend samples (~3000 cGy -> 0.625, ~4400 cGy -> 0.917, ~4700 cGy -> 0.979 normalized to 4800 cGy) illustrating how polar topography influences solar proton exposure while emphasizing that shelter is always required.

5. NASA CCMC DONKI (Space Weather Database Of Notifications, Knowledge, Information):
   • URL: https://ccmc.gsfc.nasa.gov/tools/DONKI/ and https://api.nasa.gov/
   • Usage: Live browser queries to the public CCMC DONKI notifications endpoint (no personal API key exposed) paired with an offline historical archive of 33 real notifications from the May 10-12, 2024 extreme solar storm (donki-2024-05.json, SHA-256: c40fb041c3704f949b595b19a5d61b5f5c003ef1802ad0b1d69779e64b6829d0) covering SEP, CME, FLR, RBE, and GST alerts.

6. NASA OSDR RadLab (Open Science Data Repository - ISS Radiation Dosimetry API):
   • URL: https://visualization.osdr.nasa.gov/radlab/gui/data-api/
   • Usage: 16 real absorbed dose rate records (µGy/h) from the DosTel1 and DosTel2 instruments aboard the International Space Station on 2022-04-01 (radlab-iss.json, SHA-256: b555fa9c190e7b2ab77a71c37eb6a20b6b623dc9cb7b4572edb55d273014bbc1), visualized in the 'RadLab' tab to teach students how real space radiation sensors work.

7. NASA SCaN (Space Communications and Navigation) - Lunar Surface Propagation & Earth-Moon Latency:
   • URL: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/ and https://ntrs.nasa.gov/citations/20240007214
   • Usage: Grounds the communication trade-off between equatorial direct line-of-sight and south-polar terrain masking, as well as the ~1.3-second one-way (2.6s round-trip) Earth-Moon light-time delay and 4-to-24-minute Mars delay.

8. NASA ISS ECLSS (Environmental Control and Life Support System - 98% Water Recovery Milestone, 2023):
   • URL: https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/
   • Usage: Educational reference for closed-loop water conservation and life-support management.

9. NASA Space Radiation Analysis Group (SRAG) & Kilopower Nuclear Fission Demonstration:
   • URL: https://srag.jsc.nasa.gov/spaceradiation/how/how.cfm and https://www.nasa.gov/news-release/demonstration-proves-nuclear-fission-system-can-provide-space-exploration-power/
   • Usage: Pedagogical basis for cumulative radiation budgeting (shelter reduces new exposure rate without erasing past dose) and continuous power generation during lunar night.
```

---

## 8. Space Agency Partner Data and Other References
```text
2026 SPACE AGENCY PARTNER RESOURCES USED:
1. ISRO (Indian Space Research Organisation) / NASA Joint Mission Data:
   • Chandrayaan-1 spacecraft carrying NASA's Moon Mineralogy Mapper (M3), which provided the reflectance spectra confirming surface water ice in permanently shadowed lunar polar regions (2018).
2. CSA (Canadian Space Agency):
   • CSA Youth & Educators Toolkit on Space Food Production (https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/), used as pedagogical reference for our Lunar Food Greenhouse (Hydroponics) module and astronaut nutrition requirements.
3. AEB (Brazilian Space Agency / Agência Espacial Brasileira - Space Apps Partner Context):
   • Aligned with Brazilian basic education STEM guidelines (BNCC Elementary Years) for accessible Portuguese-language classroom adoption alongside English and Spanish.

OTHER SCIENTIFIC & PUBLIC-DOMAIN REFERENCES:
• USGS (United States Geological Survey): Public-domain archival distribution of the NASA/JPL/M3 lunar south pole water-ice image (https://www.usgs.gov/media/images/moons-south-pole-image-water-icepng).
• NASA Mars Trek & Moon Trek WMTS Metadata (https://trek.nasa.gov/): Evaluated and archived (moon-trek-illumination.xml, SHA-256: 52fcf200b7f13d48bc30148b534b09bcf76793bf050122b3dd168fe909ba0066) for future Mars and polar illumination expansions.

OPEN-SOURCE SOFTWARE, FONTS & DEVELOPMENT TOOLS:
• Architectural Inspiration: 'Age of AI' open-source web RTS by Alex Vilela (https://github.com/alexvilelabah/age-of-ai) - re-engineered from the ground up into a cozy top-down 3/4 pixel-art NASA astronaut trainer.
• Typography (Open Font License included in public/licenses/): '@fontsource/fredoka' (SIL Open Font License 1.1) and '@fontsource/silkscreen' (SIL Open Font License 1.1).
• Runtime & Build Stack: TypeScript 5.6.3, Vite 5.4.11, Capacitor 8.6.2 (@capacitor/core, @capacitor/android, @capacitor/cli), Playwright 1.58.2, Node.js 22+ (built-in SQLite), Python 3.11 (Pillow, pypdfium2), Adoptium Temurin JDK 21.0.13, and Android SDK 36.
• Original Pixel Art & Audio: Custom pixel-art sprites generated procedurally in src/pixelSprites.ts, custom scientist portrait (public/icons/scientist.png) provided by the team, and procedural Web Audio API sound effects (src/audio.ts).
```
