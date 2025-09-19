const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 10000;

// Define your affiliate sites and categories
const affiliateSites = {
  tech: [
    { name: 'TechDeals Pro', url: '/sites/tech-deals', description: 'Latest tech gadgets and electronics' },
    { name: 'Smart Home Hub', url: '/sites/smart-home', description: 'Smart home automation and IoT devices' },
    { name: 'Gaming Central', url: '/sites/gaming', description: 'Gaming gear and accessories' }
  ],
  health: [
    { name: 'Wellness Guide', url: '/sites/wellness', description: 'Health supplements and fitness equipment' },
    { name: 'Fitness Pro', url: '/sites/fitness', description: 'Workout gear and nutrition products' },
    { name: 'Natural Living', url: '/sites/natural', description: 'Organic and natural lifestyle products' }
  ],
  finance: [
    { name: 'Money Master', url: '/sites/money-master', description: 'Financial tools and investment guides' },
    { name: 'Credit Wizard', url: '/sites/credit-wizard', description: 'Credit cards and financial services' },
    { name: 'Investment Hub', url: '/sites/investment', description: 'Trading platforms and investment tools' }
  ],
  lifestyle: [
    { name: 'Style Central', url: '/sites/style', description: 'Fashion and lifestyle products' },
    { name: 'Home & Garden', url: '/sites/home-garden', description: 'Home improvement and gardening' },
    { name: 'Travel Deals', url: '/sites/travel', description: 'Travel gear and booking platforms' }
  ]
};

// Generate navigation HTML
function generateNavigation() {
  return `
    <nav class="main-nav">
      <ul>
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/categories" class="nav-link">Categories</a></li>
        <li><a href="/sites" class="nav-link">All Sites</a></li>
        <li><a href="/about" class="nav-link">About</a></li>
        <li><a href="/contact" class="nav-link">Contact</a></li>
      </ul>
    </nav>
  `;
}

// Generate category sections
function generateCategorySections() {
  let sectionsHTML = '';
  
  for (const [category, sites] of Object.entries(affiliateSites)) {
    sectionsHTML += `
      <section class="category-section" data-category="${category}">
        <div class="category-header" onclick="toggleCategory('${category}')">
          <h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="sites-grid" id="${category}-sites">
          ${sites.map(site => `
            <div class="site-card" onclick="window.location.href='${site.url}'">
              <h3>${site.name}</h3>
              <p>${site.description}</p>
              <button class="visit-btn">Visit Site →</button>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }
  
  return sectionsHTML;
}

// Generate individual site page
function generateSitePage(siteName, category) {
  const site = affiliateSites[category]?.find(s => 
    s.url.includes(siteName) || s.name.toLowerCase().replace(/\s+/g, '-') === siteName
  );
  
  if (!site) return null;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${site.name} - Affiliate Network</title>
      <style>
        body {
          margin: 0;
          font-family: 'Arial', sans-serif;
          background: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAF0AoADASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAECAwQFBgf/xABBEAABBAECBAMFBgMGBwEBAAABAAIDEQQhMRJBUWETInEGFIGRoSMyUrHB0UJicgcVM4Wi4RJDU5KywvBjc+Ik/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAECAwQFBv/EADARAAICAQQBAgQFAwUAAAAAAAABAgMRBBIhMUEFEyJRMmFxgZGhsdHB4fAUIyQzUv/aAAwDAQACEQMRAD8A') no-repeat center center fixed;
          background-size: cover;
          color: #fff;
          min-height: 100vh;
          position: relative;
        }
        
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, rgba(13, 62, 94, 0.7), rgba(29, 78, 116, 0.6), rgba(46, 125, 50, 0.5));
          z-index: -1;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .back-nav {
          margin-bottom: 30px;
        }
        
        .back-btn {
          background: rgba(13, 62, 94, 0.9);
          border: 2px solid rgba(135, 206, 235, 0.6);
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        .back-btn:hover {
          background: rgba(30, 144, 255, 0.9);
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.8);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .site-header {
          text-align: center;
          margin-bottom: 50px;
        }
        
        .site-title {
          font-size: 3rem;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .site-description {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin: 40px 0;
        }
        
        .product-card {
          background: linear-gradient(135deg, rgba(70, 130, 180, 0.9), rgba(100, 149, 237, 0.8));
          padding: 30px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(135, 206, 235, 0.3);
          transition: transform 0.3s ease;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          background: linear-gradient(135deg, rgba(30, 144, 255, 0.95), rgba(135, 206, 235, 0.9));
          border-color: rgba(255,255,255,0.5);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .affiliate-btn {
          background: linear-gradient(45deg, #1e90ff, #00bfff);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: 15px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .affiliate-btn:hover {
          background: linear-gradient(45deg, #4169e1, #1e90ff);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="back-nav">
          <a href="/" class="back-btn">← Back to Home</a>
        </div>
        
        <div class="site-header">
          <h1 class="site-title">${site.name}</h1>
          <p class="site-description">${site.description}</p>
        </div>
        
        <div class="products-grid">
          <div class="product-card">
            <h3>Featured Product 1</h3>
            <p>High-quality product with great affiliate commissions.</p>
            <button class="affiliate-btn" onclick="window.open('#', '_blank')">
              View Deal - Earn 15% Commission
            </button>
          </div>
          
          <div class="product-card">
            <h3>Featured Product 2</h3>
            <p>Popular item with high conversion rates.</p>
            <button class="affiliate-btn" onclick="window.open('#', '_blank')">
              View Deal - Earn 20% Commission
            </button>
          </div>
          
          <div class="product-card">
            <h3>Featured Product 3</h3>
            <p>Trending product with excellent reviews.</p>
            <button class="affiliate-btn" onclick="window.open('#', '_blank')">
              View Deal - Earn 18% Commission
            </button>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Main page template
function generateMainPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Affiliate Marketing Network</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          background: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAF0AoADASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAECAwQFBgf/xABBEAABBAECBAMFBgMGBwEBAAABAAIDEQQhMRJBUWETInEGFIGRoSMyUrHB0UJicgcVM4Ki4RJDU5KywvBjc+Ik/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAECAwQFBv/EADARAAICAQQBAgQFAwUAAAAAAAABAgMRBBIhMUEFEyJRMmFxgZGhsdHB4fAUIyQzUv/aAAwDAQACEQMRAD8A') no-repeat center center fixed;
          background-size: cover;
          color: #fff;
          min-height: 100vh;
          position: relative;
        }
        
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, rgba(13, 62, 94, 0.7), rgba(29, 78, 116, 0.6), rgba(46, 125, 50, 0.5));
          z-index: -1;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 50px;
          padding: 40px 0;
        }
        
        .main-title {
          font-size: 3.5rem;
          margin-bottom: 20px;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
          color: #ffffff;
          font-weight: bold;
          letter-spacing: 2px;
        }
        
        .subtitle {
          font-size: 1.3rem;
          opacity: 0.95;
          margin-bottom: 30px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        }
        
        .main-nav ul {
          list-style: none;
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
        }
        
        .nav-link {
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          background: rgba(13, 62, 94, 0.8);
          border-radius: 25px;
          transition: all 0.3s ease;
          border: 2px solid rgba(135, 206, 235, 0.6);
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          font-weight: 500;
        }
        
        .nav-link:hover {
          background: rgba(30, 144, 255, 0.9);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.4);
          border-color: rgba(255,255,255,0.8);
        }
        
        .category-section {
          margin: 40px 0;
          background: rgba(13, 62, 94, 0.85);
          border-radius: 15px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(135, 206, 235, 0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        
        .category-header {
          padding: 25px;
          background: linear-gradient(135deg, rgba(25, 25, 112, 0.9), rgba(70, 130, 180, 0.8));
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(135, 206, 235, 0.2);
        }
        
        .category-header:hover {
          background: linear-gradient(135deg, rgba(30, 144, 255, 0.9), rgba(100, 149, 237, 0.8));
        }
        
        .category-header h2 {
          font-size: 2rem;
          flex-grow: 1;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.6);
          color: #ffffff;
        }
        
        .toggle-icon {
          font-size: 1.5rem;
          transition: transform 0.3s ease;
        }
        
        .sites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          padding: 25px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease;
        }
        
        .sites-grid.active {
          max-height: 1000px;
        }
        
        .site-card {
          background: linear-gradient(135deg, rgba(70, 130, 180, 0.9), rgba(100, 149, 237, 0.8));
          padding: 25px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid rgba(135, 206, 235, 0.3);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .site-card:hover {
          transform: translateY(-5px);
          background: linear-gradient(135deg, rgba(30, 144, 255, 0.95), rgba(135, 206, 235, 0.9));
          border-color: rgba(255,255,255,0.6);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        .site-card h3 {
          margin-bottom: 15px;
          font-size: 1.4rem;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
          color: #ffffff;
        }
        
        .site-card p {
          opacity: 0.95;
          margin-bottom: 20px;
          line-height: 1.5;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        .visit-btn {
          background: linear-gradient(45deg, #1e90ff, #00bfff);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        }
        
        .visit-btn:hover {
          background: linear-gradient(45deg, #4169e1, #1e90ff);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        @media (max-width: 768px) {
          .main-title { font-size: 2.5rem; }
          .main-nav ul { flex-direction: column; align-items: center; }
          .sites-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <h1 class="main-title">Mountain Lake Affiliate Network</h1>
          <p class="subtitle">Discover premium affiliate opportunities across multiple niches</p>
          ${generateNavigation()}
        </header>
        
        <main>
          ${generateCategorySections()}
        </main>
      </div>
      
      <script>
        function toggleCategory(categoryId) {
          const sitesGrid = document.getElementById(categoryId + '-sites');
          const toggleIcon = document.querySelector(\`[data-category="\${categoryId}"] .toggle-icon\`);
          
          sitesGrid.classList.toggle('active');
          
          if (sitesGrid.classList.contains('active')) {
            toggleIcon.style.transform = 'rotate(180deg)';
          } else {
            toggleIcon.style.transform = 'rotate(0deg)';
          }
        }
        
        // Initialize first category as expanded
        document.addEventListener('DOMContentLoaded', function() {
          toggleCategory('tech');
        });
      </script>
    </body>
    </html>
  `;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Health check endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'affiliate-network'
    }));
    return;
  }
  
  // Main page
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateMainPage());
    return;
  }
  
  // Individual site pages
  if (pathname.startsWith('/sites/')) {
    const siteName = pathname.split('/sites/')[1];
    let siteContent = null;
    
    // Find which category the site belongs to
    for (const [category, sites] of Object.entries(affiliateSites)) {
      const site = sites.find(s => 
        s.url.includes(siteName) || 
        s.name.toLowerCase().replace(/\s+/g, '-') === siteName
      );
      
      if (site) {
        siteContent = generateSitePage(siteName, category);
        break;
      }
    }
    
    if (siteContent) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(siteContent);
      return;
    }
  }
  
  // Categories page
  if (pathname === '/categories') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(affiliateSites, null, 2));
    return;
  }
  
  // All sites page
  if (pathname === '/sites') {
    const allSites = Object.values(affiliateSites).flat();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allSites, null, 2));
    return;
  }
  
  // Serve static files from public directory
  let filePath = path.join(__dirname, 'public', pathname);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial; text-align: center; margin-top: 100px;">
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/" style="color: #4CAF50; text-decoration: none;">← Back to Home</a>
          </body>
        </html>
      `);
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon'
    }[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🏔️ Mountain Lake Affiliate Network server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 Main site: http://localhost:${PORT}`);
  console.log(`📋 Available routes:`);
  console.log(`   - / (Main page with categories)`);
  console.log(`   - /categories (JSON data)`);
  console.log(`   - /sites (All sites JSON)`);
  console.log(`   - /sites/[site-name] (Individual site pages)`);
});
