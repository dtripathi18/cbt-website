/**
 * Central config — every piece of content that someone might need to update
 * (links, contact details, asset paths, the course-series registration URL)
 * lives here instead of being scattered through index.html.
 */
const CBT_CONFIG = {
  site: {
    logo: "assets/images/logo/logo-wide.png",
    logoLight: "assets/images/logo/logo-wide-white.png",
    nav: [
      { label: "Home", href: "index.html" },
      { label: "Research", href: "research.html" },
      { label: "Publications", href: "publications.html" },
      { label: "Startups", href: "startups.html" },
      { label: "Partners", href: "partners.html" },
      { label: "Faculty", href: "people.html" },
      { label: "News & Events", href: "news-events.html" },
      { label: "Contact", href: "contact.html" },
    ],
  },

  hero: {
    // Each slide picks its own overlay strength ("light" | "medium" | "strong")
    // based on how busy the photo is — team.jpg needs the darkest overlay for
    // the heading to stay readable; the second team photo carries no text at all.
    slides: [
      { image: "assets/images/hero/hero-bg-11.jpg", text: true, overlay: "medium" },
      { image: "assets/images/hero/hero-team.jpg", text: true, overlay: "strong" },
      { image: "assets/images/hero/hero-team2.jpg", text: false, overlay: "light" },
    ],
    eyebrow: "A DBT Centre of Excellence, established 2015",
    heading: "Centre of Excellence for Biopharmaceutical Technology",
    sub: "Delivering innovation in biopharmaceutical technology to make India the global hub for economical, safe and efficacious therapeutics.",
  },

  courseSeries: {
    edition: "11th Annual CBT Course Series",
    tagline: "Venue: IIT Delhi — 8 - 10th Dec 2026",
    ctaLabel: "Register Now",
    // TODO: point at the separate course-series site once it's live
    // (kept off this institute-hosted page on purpose — see plan doc —
    // so the yearly update doesn't need an institute IT change request).
    registrationUrl: "#",
    aboutLabel: "About the Event",
    // Placeholder — pointed at the News & Events archive for now since
    // there's no dedicated event-details page yet.
    aboutUrl: "news-events.html",
  },

  contactCta: {
    heading: "Contact us for Research Driven Business Collaboration with Experience and Insights",
    name: "Prof. Anurag Singh Rathore",
    email: "asrathore@biotechcmz.com",
  },

  about: {
    heading: "What We Do At CBT",
    body:
      "The Centre of Excellence for Biopharmaceutical Technology (CBT) was established at IIT Delhi in 2015 by the Department of Biotechnology, Government of India, to recognize the importance of biopharmaceutical technology for India — particularly in producing affordable biotech therapeutics. We create technology solutions that make India's biopharmaceutical industry more globally competitive, and partner with industry to implement them and train the human resources behind them.",
    mission:
      "Provide a network and linkage that establishes and facilitates academia-industry collaborations and partnerships, accelerating the discovery and development of new biopharmaceuticals and related processes.",
    vision:
      "Deliver innovation in biopharmaceutical technology to address the challenges faced by Indian biotech industries, making India the global hub for manufacturing economical, safe and efficacious therapeutics.",
  },

  // `body` is the full paragraph and `image` the illustrative photo, both
  // mirrored from research.php, used on the dedicated Research page. The
  // homepage carousel derives its short teaser from `body`'s first sentence
  // (see renderResearchTeaser in shared.js) rather than keeping a second,
  // separately-edited copy of the text.
  research: [
    {
      title: "Upstream Processing",
      image: "assets/images/research/image7.jpg",
      body:
        "At the forefront of bioprocess innovation, the CBT delivers advanced solutions for biopharmaceutical manufacturing. The Centre's expertise focuses on critical upstream technologies, including high-yield strain and cell line development, cost-effective media optimization, and robust bioreactor control through Process Analytical Technologies (PAT) methodologies. CBT addresses complex manufacturing bottlenecks to ensure processes are both scalable and commercially viable. We are involved in collaborative projects in the areas of process development, process optimization and advanced bioreactor control for production of a range of biotherapeutics, including virus-like particles (VLPs), mAbs, nanobodies, and insulin analogues.",
    },
    {
      title: "Analytical & Functional Characterization of Biosimilars",
      image: "assets/images/research/image8.jpg",
      body:
        "CBT has the required infrastructure, expertise, and experience to perform detailed analytical and functional characterization of biosimilars. We have contributed towards creation of novel and advanced methodologies for characterization of biotherapeutic products as well as establishing structure-function relationships. Lately we have focused on creating novel spectroscopic methods for measuring CQAs as efficient alternatives to the traditional LC and MS approach. We have extensively published on multi-attribute monitoring (MAM) approaches to make bioanalytical applications efficient. Another topic of interest is integrating advanced data analytics (machine learning) for enhancing the information that typical analytical tools generate. We have successfully demonstrated use of this approach for characterizing size heterogeneity (from DLS data), glycans (from FLD and FTIR) and several other applications. In addition, we are also targeting novel formulations for the range of biotherapeutic products that we are working with.",
    },
    {
      title: "Pharmacoeconomics",
      image: "assets/images/research/image9.jpg",
      body:
        "At CBT, we understand that novel and breakthrough therapies like mAbs mean nothing if patients cannot access them, specifically true for Low- and Middle-Income Countries (LMICs) like India. Based on this understanding, we have developed an in-house economic model using advanced process economics modelling tools to evaluate the commercial viability of different manufacturing approaches for mAbs and other emerging therapies, identifying economic hotspots and areas for improvement. We believe this will help decision makers, manufacturers and other healthcare stakeholders, by directly addressing one of the main barriers to making these critical treatments more widely available.",
    },
    {
      title: "Downstream Processing",
      image: "assets/images/research/image10.jpg",
      body:
        "CBT delivers advanced biopharmaceutical manufacturing solutions. The downstream processing group's focus is on developing purification platforms for various proteins and peptides with maximum yield and productivity. The infrastructure here at CBT supports in achieving this aim for microbial as well as mammalian products. With multiple unit operations experience, we have expertise in refolding, chromatography, virus inactivation, and filtration; we have developed purification platforms for a range of biotherapeutic modalities including mAbs, peptides, nanobodies, VLPs and ADCs. We have also successfully created novel PAT based schemes for delivering real time monitoring and control of bioprocesses.",
    },
    {
      title: "Continuous Processing",
      image: "assets/images/research/image11.jpg",
      body:
        "We have a state-of-the-art facility at CBT for continuous manufacturing of microbial and mammalian biotherapeutic drugs. We have created continuous platforms for both product classes and demonstrated how continuous processing can deliver consistent product quality. These platforms involve use of digital twins, real time process monitoring using PAT, and real time process control. We have observed that implementation of these platforms can deliver 10–15X higher productivity and 50–75% reduction in Cost of Goods.",
    },
    {
      title: "Process Control",
      image: "assets/images/research/image12.jpg",
      body:
        "CBT specializes in integrating artificial intelligence, machine learning algorithms, and Process Analytical Technology (PAT) to create holistic control systems that can predict, prevent, and respond to process variations in real-time. Our continuous bioprocessing platforms utilize deep neural networks for rapid control responses, multivariate data analysis for quality prediction, and model predictive control for autonomous decision-making.",
    },
    {
      title: "Data Analytics",
      image: "assets/images/research/image13.jpg",
      body:
        "We have harnessed cutting-edge AI, deep learning, and large language models (LLMs) to accelerate innovation and build the foundational tools for next-generation applications. Our work focuses on enhancing advanced process control, developing real-time enablers for continuous manufacturing of biotherapeutic products, and enabling intelligent clinical decision support. Applications include creating digital twins of complex systems—ranging from manufacturing units to biological processes—and mapping pathways with sophisticated machine learning, mathematical, and hybrid models. Automation of workflow to make analysis of data from mass spectroscopy, FTIR, NIR, and Raman has been demonstrated to yield significant efficiencies. With strong expertise in medical image analysis and multimodal large language models, we support hospitals and healthcare providers in tasks such as radiology image interpretation and integration of imaging data with patient records. Our AI solutions are designed to provide explainable, reliable, and secure insights, enabling clinicians and biomanufacturers alike to improve decision-making, optimize processes, and deliver better outcomes.",
    },
    {
      title: "New Age Therapeutics",
      image: "assets/images/research/image14.jpg",
      body:
        "CBT extends beyond traditional mAbs to be a forerunner on next generation biotherapeutic modalities. Our pipeline includes Antibody Drug Conjugates (ADCs) for targeted payload delivery, microbial and mammalian Virus-Like Particles (VLPs) for vaccine and gene therapy applications, and Nanobodies for achieving superior tissue penetration and stability. We have comprehensive end-to-end development solutions including upstream bioprocessing optimization, downstream purification platforms, and advanced analytical characterization for all these modalities.",
    },
  ],

  // Mirrored from people.php — only the currently-visible faculty (a few
  // profiles are commented out on the live site and are skipped here too).
  faculty: [
    { name: "Prof. Anurag S. Rathore", title: "Professor & Coordinator", dept: "Department of Chemical Engineering", photo: "assets/images/faculty/anurag.jpg", interests: "Process Analytical Technology (PAT), Quality by Design (QbD), Multivariate Data Analysis (MVDA), Bio-separations, Mechanistic modeling, Biosimilars", email: "asrathore@biotechcmz.com", website: "http://www.biotechcmz.com/" },
    { name: "Prof. James Gomes", title: "Professor & Co-Coordinator", dept: "Kusuma School of Biological Sciences", photo: "assets/images/faculty/james.jpg", interests: "Systems and Network Biology, Nonlinear systems theory, Advanced process control", email: "jgomes.bioschool@gmail.com", website: "http://web.iitd.ac.in/~jgomes/" },
    { name: "Dr. Manidipa Banerjee", title: "Professor", dept: "Kusuma School of Biological Sciences", photo: "assets/images/faculty/mandipta.jpg", interests: "Host virus interaction, Structural virology, Virus-based nanoparticles, Analytical characterization", email: "mbanerjee@bioschool.iitd.ac.in", website: "http://structuralvirology.wixsite.com/manidipa-banerjee/maam" },
    { name: "Dr. Sudip K Pattanayek", title: "Professor", dept: "Department of Chemical Engineering", photo: "assets/images/faculty/sudip.jpg", interests: "Structure and dynamics of macromolecules at interfaces, Aggregation of proteins, Polymer nanocomposites, Interfacial rheology, Rheology of slurries, Molecular simulation", email: "sudip@chemical.iitd.ac.in", website: "http://web.iitd.ac.in/~sudip/" },
    { name: "Dr. Jayati Sarkar", title: "Professor", dept: "Department of Chemical Engineering", photo: "assets/images/faculty/jayati.jpg", interests: "Instabilities, Adhesion, Debonding, Dewetting, Pattern formation of soft thin films, Interfacial science, Computational fluid dynamics, Self-organization of complex fluids and granular materials", email: "jayati@chemical.iitd.ac.in", website: "http://web.iitd.ac.in/~jayati/" },
    { name: "Dr. V Haridas", title: "Professor", dept: "Department of Chemistry", photo: "assets/images/faculty/haridas.jpg", interests: "Chemical biology of peptides and proteins, Biophysics of peptide/protein folding", email: "haridasv@chemistry.iitd.ac.in", website: "http://chemistry.iitd.ac.in/faculty/haridas.html" },
    { name: "Dr. Gaurav Goel", title: "Professor", dept: "Department of Chemistry", photo: "assets/images/faculty/goel.jpg", interests: "Transport at nanoscale, Structure-property solvophobic interactions and self-assembly, Multiscale modeling of protein folding and aggregation, In-silico design of functional nanocomposites", email: "goelg@chemical.iitd.ac.in", website: "http://chemical.iitd.ac.in/faculty/gaurav-goel/" },
    { name: "Dr. Manojkumar C Ramteke", title: "Professor", dept: "Department of Chemical Engineering", photo: "assets/images/faculty/manoj.jpg", interests: "Modeling, simulation and optimization using evolutionary algorithms", email: "mcramteke@chemical.iitd.ac.in", website: "http://web.iitd.ac.in/~mcramteke/Home.html" },
    { name: "Dr. Hariprasad Kodamana", title: "Associate Professor", dept: "Department of Chemical Engineering", photo: "assets/images/faculty/hariprasad.jpg", interests: "Process data analytics, Data-driven modelling, Model-based control, Process monitoring, Optimal operation of Simulated Moving Bed (SMB)", email: "kodamana@chemical.iitd.ac.in", website: "http://chemical.iitd.ac.in/faculty/hariprasad-kodamana/" },
    { name: "Dr. Akshi Singla", title: "Assistant Professor", dept: "Department of Chemical Engineering", photo: "assets/images/faculty/akshi.jpg", interests: "Glycan-protein binding, Low-cost disease diagnostic sensors, Targeted drug delivery in infectious diseases", email: "akshi@chemical.iitd.ac.in", website: "https://web.iitd.ac.in/~akshi/" },
    { name: "Dr. Om Prakash", title: "Assistant Professor", dept: "Department of Chemical Engineering", photo: "assets/images/faculty/omprakash.jpg", interests: "Machine learning, Graph analytics, Dynamic modelling, Sensor placement design, Process monitoring, Optimization, and estimation", email: "omprakash@iitd.ac.in", website: "https://iprana-lab.github.io/" },
    { name: "Dr. Saran Kumar", title: "Assistant Professor", dept: "Kusuma School of Biological Sciences", photo: "assets/images/faculty/saran.jpg", interests: "Vascular Biology and Cancer (cancer heterogeneity and plasticity, cancer therapy, tumor organoids)", email: "ksaran@iitd.ac.in", website: "https://sites.google.com/view/sklab/home" },
  ],

  startups: [
    {
      name: "Clensta International Pvt Ltd",
      blurb: "Waterless personal-hygiene solutions — science-based products that deliver complete, instant hygiene without water.",
      logo: "assets/images/startups/clensta.jpg",
      url: "https://clensta.com/",
    },
    {
      name: "Edna Biolabs",
      blurb: "Specialty enzymes for molecular biology and mass spectrometry, recombinantly produced to international-grade purity and activity.",
      logo: "assets/images/startups/edna-biolabs.jpg",
      url: "https://www.ednabiolabs.com/",
    },
    {
      name: "Growdea Technologies",
      blurb: "AI and computational platforms for small-molecule and biologics design, serving pharmaceutical research since 2018.",
      logo: "assets/images/startups/growdea.jpg",
      url: "http://growdeatech.com/",
    },
  ],

  // Full partner roster mirrored from partners.php — "most recent" first (these
  // are the only ones the live site links out to), then public/academic/industry.
  // `group` drives the section headings on the Partners page; the homepage
  // carousel just flattens all of them in this same order.
  partners: [
    { name: "Agilent Technologies", logo: "assets/images/partners/most-recent/agilent.jpg", url: "https://www.agilent.com/", group: "most-recent" },
    { name: "Applied Materials", logo: "assets/images/partners/most-recent/amat.jpg", url: "https://www.appliedmaterials.com/en-in", group: "most-recent" },
    { name: "Pall Corporation", logo: "assets/images/partners/most-recent/pall.jpg", url: "https://www.pall.co.in/", group: "most-recent" },
    { name: "Tata Consultancy Services", logo: "assets/images/partners/most-recent/tcs.jpg", url: "https://www.tcs.com/", group: "most-recent" },
    ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({ name: "Public Institution Partner", logo: `assets/images/partners/public/${i}.jpg`, group: "public" })),
    ...[1, 2, 3, 4, 6, 7, 8].map((i) => ({ name: "Academic Partner", logo: `assets/images/partners/academic/${i}.jpg`, group: "academic" })),
    ...Array.from({ length: 27 }, (_, i) => ({ name: "Industry Partner", logo: `assets/images/partners/industry/${i + 1}.jpg`, group: "industry" })),
  ],

  // Note: "most-recent" partners are intentionally left out of this list —
  // they still appear in the homepage carousel (cfg.partners), just not as
  // their own section on the Partners page.
  partnerGroups: [
    { key: "public", label: "Public Institution Partners" },
    { key: "academic", label: "Academic Partners" },
    { key: "industry", label: "Industry Partners" },
  ],

  gallery: [
    { year: "Course Series 2024", dir: "dec-2024", count: 17, coverIndex: 8 },
    { year: "Course Series 2023", dir: "dec-2023", count: 14, coverIndex: 5 },
    { year: "Course Series 2022", dir: "course-series-2022", count: 8 },
    { year: "Course Series 2022 (April)", dir: "april-2022", count: 7 },
    { year: "Course Series 2021", dir: "dec-2021", count: 5, coverIndex: 4 },
    { year: "Course Series 2019", dir: "dec-2019", count: 8 },
  ].map((g) => ({
    ...g,
    cover: `assets/images/gallery/${g.dir}/${g.coverIndex || 1}.jpg`,
    // Thumbnails for the deck cards; full-resolution (800x600) versions for the slideshow.
    images: Array.from({ length: g.count }, (_, i) => `assets/images/gallery/${g.dir}/full/${i + 1}.jpg`),
  })),

  news: [
    {
      date: "Sep 2026",
      title: "Excited to announce the 11th Annual CBT Course Series 2026",
      image: null, // TODO: swap in the real announcement image once ready
      url: "news-events.html",
    },
    {
      date: "Dec 2025",
      title: "Excited to announce the 10th Annual CBT Course Series 2025",
      image: "assets/images/news/announcement.jpg",
      url: "news-events.html",
    },
  ],

  // Mirrored from news-events.php — a year-by-year archive of course/event
  // brochures and newsletters, each linking to the original PDF on the live
  // site — all PDFs are downloaded into assets/pdfs/ so nothing here links
  // out to the live site. Newest year first.
  //
  // Two exceptions: "CBT Training Event 2021" and "DBT COE-CBT Brochure 2018"
  // are 404s on the live site itself (broken there too) — there's no file to
  // download, so those two entries still point at the (dead) original URL.
  newsArchive: [
    {
      year: "2024",
      items: [
        { title: "CBT Course Series Brochure 2024", image: "assets/images/news-events/dec2024.jpg", url: "assets/pdfs/cbt-course-series-brochure-2024.pdf" },
      ],
    },
    {
      year: "2023",
      items: [
        { title: "CBT Course Series Brochure 2023", image: "assets/images/news-events/dec2023.jpg", url: "assets/pdfs/cbt-course-series-brochure-2023.pdf" },
      ],
    },
    {
      year: "2022",
      items: [
        { title: "CBT Course Series Brochure 2022", image: "assets/images/news-events/cbt14.jpg", url: "assets/pdfs/cbt-course-series-brochure-2022.pdf" },
      ],
    },
    {
      year: "2021",
      items: [
        { title: "CBT Training Event 2021", image: "assets/images/news-events/cbt12.jpg", url: "https://cbt.iitd.ac.in/uploads/CBT%20Training%20Event%202021.pdf" },
        { title: "CBT Course Series Brochure 2021", image: "assets/images/news-events/cbt12.jpg", url: "assets/pdfs/cbt-course-series-brochure-2021.pdf" },
        { title: "Vaibhav Summit 2021 (Oct)", image: "assets/images/news-events/cbt13.jpg", url: "assets/pdfs/vaibhav-summit-2021-oct.pdf" },
      ],
    },
    {
      year: "2020",
      items: [
        { title: "Environmental and Health Risk Management Plan", image: "assets/images/news-events/cbt10.jpg", url: "assets/pdfs/ehrmp-final.pdf" },
      ],
    },
    {
      year: "2019",
      items: [
        { title: "CBT Flyer 2019", image: "assets/images/news-events/cbt-flyer-2019.jpg", url: "assets/pdfs/cbt-flyer-2019.pdf" },
        { title: "CBT Brochure 2019", image: "assets/images/news-events/cbt-brochure-2019.jpg", url: "assets/pdfs/cbt-brochure-2019.pdf" },
      ],
    },
    {
      year: "2018",
      items: [
        { title: "DBT COE-CBT Brochure 2018", image: "assets/images/news-events/dbt-coe-cbt-brochure.jpg", url: "https://cbt.iitd.ac.in/uploads/courses/DBT%20COE-CBT%20Brochure.pdf" },
        { title: "CBT Brochure 2018", url: "assets/pdfs/cbt-brochure-2018.pdf" },
        { title: "GIAN Course Brochure: Analytical Systems Biology and Characterization of Biotherapeutics (11–14 December 2018)", image: "assets/images/news-events/cbt5.jpg", url: "assets/pdfs/gian-brochure-analytical-2018.pdf" },
        { title: "CBT Flyer 2018", image: "assets/images/news-events/cbt6.jpg", url: "assets/pdfs/cbt-flyer-2018.pdf" },
        { title: "GIAN Brochure: Downstream Processing for Production of Biologicals 2018", image: "assets/images/news-events/cbt7.jpg", url: "assets/pdfs/gian-brochure-dsp-2018.pdf" },
      ],
    },
    {
      year: "2017",
      items: [
        { title: "CBT Newsletter 2017", image: "assets/images/news-events/cbt8.jpg", url: "assets/pdfs/cbt-newsletter-2017.pdf" },
      ],
    },
    {
      year: "2016",
      items: [
        { title: "Centre of Excellence for Biopharmaceutical Technology (CBT)", subtitle: "Three-day training program, 12–14 December 2016", image: "assets/images/news-events/cbt9.jpg", url: "assets/pdfs/cbt-newsletter-2016.pdf" },
      ],
    },
  ],

  // Mirrored from publications.php ("Most recent articles"), newest first.
  publications: [
    { authors: "S. Metya, S. Haidar, A. S. Rathore", title: "Efficient and Economical Purification Platform for Production of Therapeutic Nanobodies", venue: "Protein Expression and Purification (2025), 106805", url: "https://www.sciencedirect.com/science/article/pii/S1046592825001470?via%3Dihub" },
    { authors: "R. Kumar, S. Kumar, A. S. Rathore", title: "Utilizing liquid chromatography-mass spectrometry to map targeting of snake venom components by antivenom", venue: "Journal of Chromatography B (2025), 124768", url: "https://www.sciencedirect.com/science/article/pii/S1570023225003228?via%3Dihub" },
    { authors: "N. Gangwar, K. Balraj, A. S. Rathore", title: "Near‐infrared spectroscopy coupled with convolutional neural network as a checkpoint tool for cell culture bioprocess media characterization", venue: "Biotechnology Progress (2025), e70056", url: "https://aiche.onlinelibrary.wiley.com/doi/10.1002/btpr.70056" },
    { authors: "K. Krishna, D. Sarin, D. Trivedi, S. Bhattacharya, H. Refaat, A. Ahmad, R. Nejadnik, A. S. Rathore", title: "Removal of Excipients from Drug Product may Impact Antibody Characterization of Monoclonal Antibodies", venue: "The AAPS Journal 27 (4) (2025), 1-13", url: "https://link.springer.com/article/10.1208/s12248-025-01078-x" },
    { authors: "R. Katiyar, N. Gindi, I. Mittal, C. Komives, A. S. Rathore", title: "Vitamin Supplementation for Enhanced Production of therapeutic Nanobody in E. coli", venue: "Biochemical Engineering Journal (2025), 109887", url: "https://linkinghub.elsevier.com/retrieve/pii/S1369703X2500261X" },
    { authors: "R. Sharma, P. Prakash, L. Gerstweiler, A. S. Rathore", title: "Disassembly mediated multimodal chromatography based purification of HPV-VLPs produced in Pichia pastoris", venue: "Journal of Virological Methods 336 (2025), 115168", url: "https://www.sciencedirect.com/science/article/pii/S0166093425000618?via%3Dihub" },
    { authors: "G. H. Rajacharya, J. Kumar, J. A. Gupta, A. S. Rathore", title: "Impact of stringent stress response and amino acid supplementation on recombinant protein production in Escherichia coli", venue: "Biochemical Engineering Journal 219 (2025), 109727", url: "https://www.sciencedirect.com/science/article/pii/S1369703X25001019?via%3Dihub" },
    { authors: "R. S. Patil, D. P. Trivedi, A. S. Rathore", title: "Amino acid supplementation to achieve enhanced production of a fab fragment in Escherichia coli: rHu ranibizumab as a case study", venue: "Biochemical Engineering Journal 219 (2025), 109718", url: "https://www.sciencedirect.com/science/article/pii/S1369703X25000920?via%3Dihub" },
    { authors: "A. Bhattacharya, S. Sinha, R. Dash, A. Rathore, S. Majumder", title: "Profiling Hinge Plasticity in Intact Monoclonal Antibodies for Antigen Recognition", venue: "Biochemistry (2025)", url: "https://pubs.acs.org/doi/10.1021/acs.biochem.5c00274" },
    { authors: "A. Shrivastava, A. S. Rathore", title: "Impact of Initial Aggregate Level on Aggregation Potential of Monoclonal Antibodies in Different Buffer Systems", venue: "Pharmaceutical Research (2025), 1-14", url: "https://link.springer.com/article/10.1007/s11095-025-03874-8" },
    { authors: "A. Rahman, K. Balraj, M. Ramteke, A. S. Rathore", title: "Echo-DND: a dual noise diffusion model for robust and precise left ventricle segmentation in echocardiography", venue: "Discover Applied Sciences 7 (6) (2025), 514", url: "https://link.springer.com/article/10.1007/s42452-025-07055-5" },
    { authors: "S. Kumar, K. Krishna, A. S. Rathore", title: "Advanced two-dimensional liquid chromatography workflow for enhanced resolution of protein components in Indian Cobra (Naja naja) venom using hydrophobic interaction-reverse phase chromatography coupled with mass spectrometry", venue: "Journal of Chromatography Open 7 (2025), 100211", url: "https://www.sciencedirect.com/science/article/pii/S277239172500009X?via%3Dihub" },
    { authors: "A. Anupa, P. Punj, L. K. Shekhawat, A. Rathore", title: "Separation of Fab therapeutic charge variants by ion-exchange chromatography using iterative mathematical and artificial neural network modeling approaches", venue: "Journal of Chromatography A (2025), 466015", url: "https://www.sciencedirect.com/science/article/pii/S0021967325003632?via%3Dihub" },
    { authors: "S. S. Patil, M. Ramteke, A. S. Rathore", title: "Permutation invariant self-attention infused U-shaped transformer for medical image segmentation", venue: "Neurocomputing 625 (2025), 129577", url: "https://doi.org/10.1016/j.neucom.2025.129577" },
    { authors: "A. Shrivastava, S. S. Patil, R. Shah, A. S. Rathore", title: "An Automated Tool for Glycosimilarity Assessment of mAb Therapeutic Biosimilars: Trastuzumab and Bevacizumab as Case Studies", venue: "BioDrugs 39 (2) (2025), 333-345", url: "https://link.springer.com/article/10.1007/s40259-025-00704-6" },
    { authors: "A. Anupa, A. S. Rathore", title: "Development of a novel capture step for purification of antigen binding fragments (Fabs)", venue: "Protein Expression and Purification 227 (2025), 106647", url: "https://www.sciencedirect.com/science/article/pii/S1046592824002195?via%3Dihub" },
    { authors: "M. N. Alam, A. Anurag, N. Gangwar, M. Ramteke, H. Kodamana, A. S. Rathore", title: "Physics‐informed neural networks guided modelling and multiobjective optimization of a mAb production process", venue: "The Canadian Journal of Chemical Engineering 103 (3) (2025), 1319-1334", url: "https://onlinelibrary.wiley.com/doi/10.1002/cjce.25446" },
    { authors: "A. Ahmad, H. Refaat, S. Bhattacharya, V. J. Gurvich, A. S. Rathore, R. Nejadnik, R. Suryanarayanan", title: "Effect of formulation composition on trastuzumab stability", venue: "International Journal of Pharmaceutics 671 (2025), 125275", url: "https://www.sciencedirect.com/science/article/pii/S0378517325001115?via%3Dihub" },
    { authors: "V. Hebbi, J. Kumar, A. S. Rathore", title: "Flocculation‐based clarification for production of protein therapeutics in Pichia pastoris: Recombinant human serum albumin as a case study", venue: "Biotechnology Progress (2025), e70001", url: "https://aiche.onlinelibrary.wiley.com/doi/10.1002/btpr.70001" },
    { authors: "H. Refaat, A. Ahmad, E. Kamel, V. J. Gurvich, A. S. Rathore, R. Suryanarayanan, R. Nejadnik", title: "Challenges with effective removal of surfactants from monoclonal antibody formulations", venue: "International Journal of Pharmaceutics 670 (2025), 125146", url: "https://www.sciencedirect.com/science/article/pii/S0378517324013802?via%3Dihub" },
    { authors: "A. Anupa, N. G. Jesubalan, R. Trivedi, N. Nitika, V. S. Buddhiraju, V. Runkana, A. S. Rathore", title: "Implementation of machine learning tool for continued process verification of process chromatography unit operation", venue: "Journal of Chromatography A 1742 (2025), 465642", url: "https://www.sciencedirect.com/science/article/pii/S002196732401015X?via%3Dihub" },
    { authors: "P. Saroha, R. S. Patil, A. S. Rathore", title: "Recent advancements in soluble expression of recombinant antibody fragments in microbial host systems", venue: "Preparative Biochemistry & Biotechnology 55 (2) (2025), 131-140", url: "https://www.tandfonline.com/doi/full/10.1080/10826068.2024.2394446" },
    { authors: "S. Sreenivasan, A. S. Rathore", title: "Impact of Various Forced Oxidative Stress Factors in Rapid Degradation of mAb: Trastuzumab as a Case Study", venue: "Pharmaceutical Research 42 (2) (2025), 335-351", url: "https://link.springer.com/article/10.1007/s11095-025-03816-4" },
    { authors: "D. Sarin, D. Chakraborty, S. Sreenivasan, A. Mishra, A. S. Rathore", title: "Higher concentration of trehalose dihydrate stabilizes recombinant IgG1 under forced stress conditions", venue: "Journal of Pharmaceutical Sciences 114 (2) (2025), 1398-1409", url: "https://www.sciencedirect.com/science/article/pii/S0022354924006300?via%3Dihub" },
    { authors: "S. S. Patil, R. Rajak, M. Ramteke, A. S. Rathore", title: "MMIT-DDPM–Multilateral medical image translation with class and structure supervised diffusion-based model", venue: "Computers in Biology and Medicine 185 (2025), 109501", url: "https://doi.org/10.1016/j.compbiomed.2024.109501" },
  ],

  contact: {
    address: "Centre of Excellence for Biopharmaceutical Technology, Indian Institute of Technology Delhi, Hauz Khas, New Delhi 110016, India",
    phone: "+91-11-2659 1098",
    email: "asrathore@biotechcmz.com",
    coordinators: [
      { name: "Prof. Anurag S. Rathore", role: "Coordinator", dept: "Department of Chemical Engineering, IIT Delhi", phone: "+91-9650770650", email: "asrathore@biotechcmz.com" },
      { name: "Prof. James Gomes", role: "Co-Coordinator", dept: "Kusuma School of Biological Sciences, IIT Delhi", phone: "+91-11-2659 1013", email: "jgomes.bioschool@gmail.com" },
    ],
    social: {
      youtube: "https://youtube.com/@COECBT",
      linkedin: "http://in.linkedin.com/in/coe-cbt",
    },
  },
};
