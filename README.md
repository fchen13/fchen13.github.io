# EBP Dashboard

## Overview
This repository contains the Earth BioGenome Project (EBP) Dashboard - an interactive visualization platform tracking the progress and global impact of the EBP initiative. The dashboard provides various data visualizations showing sequencing progress across taxonomic ranks, geographic distribution of affiliate projects, and network connections within the global EBP community.

## About the Earth BioGenome Project
The Earth BioGenome Project (EBP) is a moonshot for biology that aims to sequence, catalog, and characterize the genomes of all of Earth's eukaryotic biodiversity over a period of ten years. With approximately 1.8 million named eukaryotic species targeted, the EBP creates a new foundation for biology to drive solutions for preserving biodiversity and sustaining human societies.

## Dashboard Components

### Assembly Progress Visualizations
- **Progress Over the Years**: Annual assembly progress at the family and species level
- **Progress at all Taxonomic Levels**: Animation display of assembly progress at main taxonomic ranks
- **Phylogenomic Display of Progress at Order Level**: Phylogenomic tree of orders with at least one species sequenced by EBP
- **Progress by Phylum Groups**: Number of eukaryotic species sequenced by EBP grouped by phylum
- **Affiliate Progress**: Assembly progress across EBP affiliate projects
- **EBP Contribution to Assemblies Meeting EBP Metrics**: EBP's contribution to assemblies meeting quality metrics at species, genus, and family levels

### Network Visualizations
- **Global Distribution**: Geographic distribution of EBP affiliates around the world
- **Affiliate Network**: Wired map showing EBP and affiliate network connections

## How to Navigate
1. Visit the [EBP Dashboard](https://earthbiogenome.github.io/dashboard/)
2. The dashboard homepage displays all available visualizations organized by category
3. Each visualization link includes:
   - An icon representing the type of visualization
   - The name of the visualization
   - A brief description of what the visualization shows
4. Click on any visualization card to open it in a new tab
5. Within each visualization, interactive elements allow you to:
   - Hover over data points for detailed information
   - Filter data based on various parameters
   - View animations of progress over time (in selected visualizations)

## Local Development
To run this dashboard locally:

1. Clone the repository
   ```
   git clone https://github.com/[username]/[repository-name].git
   ```
2. Navigate to the project directory
   ```
   cd [repository-name]
   ```
3. Open `index.html` in your web browser

## Repository Structure
- `index.html` - Main dashboard entry point with navigation interface
- `config.js` - Configuration file defining available visualizations and their metadata
- `source files/` - Directory containing individual visualization HTML files
- `geoMap/` - Geographic mapping visualizations and supporting files

## Technologies Used
- D3.js - For data visualizations
- ECharts - For interactive charts
- HTML/CSS/JavaScript - For web interface

## Contributing
Please contact the EBP team if you'd like to contribute to this dashboard.

## License and Copyright
© 2025 THE EARTH BIOGENOME PROJECT  
All content and visualizations in this dashboard are protected by copyright law. Any unauthorized use, reproduction, or distribution is prohibited.

## Contact
For more information about the Earth BioGenome Project, visit [www.earthbiogenome.org](https://www.earthbiogenome.org/).
