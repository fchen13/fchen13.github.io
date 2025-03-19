/**
 * Configuration for EBP visualization pages
 * 
 * Each page object contains:
 * @property {string} name - Display name for the link
 * @property {string} file - Path to the HTML file
 * @property {string} description - Tooltip description
 * @property {string} category - Category for grouping related visualizations
 * @property {string} icon - Font Awesome icon class (optional)
 */

const copyright = {
  notice: "© 2025 THE EARTH BIOGENOME PROJECT",
  holder: "Fang Chen",
  year: "2025",
  rights: "All content and visualizations in this dashboard are protected by copyright law. Any unauthorized use, reproduction, or distribution is prohibited."
};

const pages = [
  {
    category: "Assembly Progress",
    pages: [
      {
        name: "Progress Timeline", 
        file: "./source files/EBP_Progress_v2.html",
        description: "Annual assembly progress at the family and species level",
        icon: "fa-chart-line"
      },
      {
        name: "Taxonomic Progress",
        file: "./source files/EBP_StackedRainbow_v2.html", 
        description: "Animation display of assembly progress at main taxonomic ranks",
        icon: "fa-dna"
      },
      {
        name: "Phylogenomic Tree",
        file: "./source files/PhyloTree_EBP_order.html",
        description: "Phylogenomic tree of orders with sequenced species",
        icon: "fa-tree"
      },
      {
        name: "Affiliate Progress",
        file: "./source files/Affiliates_Progress_sorted.html",
        description: "Assembly progress across EBP affiliate projects",
        icon: "fa-project-diagram"
      }
    ]
  },
  {
    category: "Network Visualization", 
    pages: [
      {
        name: "Global Distribution",
        file: "./source files/projectsMap_v6.html",
        description: "Geographic distribution of EBP affiliates",
        icon: "fa-globe"
      },
      {
        name: "Affiliate Network",
        file: "./source files/WireMaps_v3.html",
        description: "Wired map showing EBP and affiliate network connections",
        icon: "fa-network-wired" 
      }
    ]
  }
];