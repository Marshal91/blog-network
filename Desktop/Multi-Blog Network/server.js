const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';

// Content generation prompts for each category
const contentPrompts = {
  technology: {
    systemPrompt: "You are a technology expert and professional blogger. Write comprehensive, actionable content about technology trends, tools, and strategies for professionals.",
    topics: [
      "Cloud Computing Best Practices",
      "Cybersecurity Implementation Guide", 
      "AI Tools for Business Productivity",
      "DevOps Automation Strategies",
      "Data Analytics Platforms Comparison",
      "Remote Work Technology Solutions",
      "Enterprise Software Integration",
      "Digital Transformation Roadmap"
    ]
  },
  wellness: {
    systemPrompt: "You are a certified wellness consultant and health professional. Write evidence-based content about health, nutrition, mental wellness, and workplace wellbeing.",
    topics: [
      "Workplace Mental Health Strategies",
      "Nutrition for Busy Professionals",
      "Exercise Routines for Desk Workers",
      "Stress Management Techniques",
      "Sleep Optimization for Productivity",
      "Mindfulness in Professional Settings",
      "Ergonomic Workplace Setup Guide",
      "Work-Life Balance Framework"
    ]
  },
  finance: {
    systemPrompt: "You are a financial advisor and investment professional. Write professional content about financial planning, investment strategies, and business finance for professionals.",
    topics: [
      "Investment Portfolio Diversification",
      "Retirement Planning for High Earners",
      "Tax Optimization Strategies",
      "Business Cash Flow Management",
      "Real Estate Investment Analysis",
      "Emergency Fund Planning Guide",
      "Cryptocurrency Investment Framework",
      "Financial Risk Assessment Methods"
    ]
  },
  professional: {
    systemPrompt: "You are a career development consultant and leadership coach. Write actionable content about professional growth, leadership skills, and career advancement strategies.",
    topics: [
      "Leadership Development Framework",
      "Remote Team Management Best Practices",
      "Professional Networking Strategies",
      "Career Transition Planning Guide",
      "Executive Skills Development",
      "Performance Management Systems",
      "Industry Trend Analysis Methods",
      "Executive Communication Techniques"
    ]
  }
};

// Function to generate content using OpenAI
async function generateArticleContent(category, topic) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = contentPrompts[category];
  
  const requestData = JSON.stringify({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: prompt.systemPrompt
      },
      {
        role: "user",
        content: `Write a comprehensive, professional blog article about "${topic}". Include:
        1. An engaging introduction that hooks the reader
        2. 4-5 main sections with actionable insights and practical advice
        3. Specific recommendations, tools, and best practices
        4. Real-world examples and case studies where relevant
        5. A strong conclusion with key takeaways
        6. Make it approximately 1200-1500 words
        7. Use a professional, authoritative tone
        8. Include affiliate-friendly product recommendations where appropriate
        
        Format the response as JSON with these fields:
        - title: A compelling, SEO-friendly article title
        - excerpt: A 2-sentence engaging summary
        - content: The full article content in clean HTML format with proper headings and paragraphs
        - tags: Array of 5-6 relevant SEO tags
        - readTime: Estimated read time (e.g., "12 min read")
        - metaDescription: SEO meta description under 160 characters`
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`OpenAI API Error: ${response.error.message}`));
            return;
          }
          if (response.choices && response.choices[0]) {
            const content = JSON.parse(response.choices[0].message.content);
            resolve(content);
          } else {
            reject(new Error('Invalid OpenAI response format'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    req.write(requestData);
    req.end();
  });
}

// In-memory content storage
let generatedArticles = new Map();

// Function to create slug from title
function createSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Static content structure
const expertContent = {
  technology: {
    title: 'Technology Insights',
    description: 'Expert analysis and comprehensive guides for tech professionals',
    articles: [
      { 
        title: 'Complete Guide to Smart Home Automation',
        slug: 'smart-home-automation-guide',
        excerpt: 'Expert insights into building efficient smart home ecosystems. Compare leading platforms, security considerations, and ROI analysis.',
        readTime: '12 min read',
        category: 'Technology',
        tags: ['Smart Home', 'IoT', 'Automation', 'Security'],
        isGenerated: false
      },
      { 
        title: 'Enterprise Cloud Migration Strategies',
        slug: 'cloud-migration-strategies',
        excerpt: 'Professional analysis of cloud platforms. Cost optimization, security frameworks, and migration best practices.',
        readTime: '15 min read',
        category: 'Technology',
        tags: ['Cloud Computing', 'Enterprise', 'Migration', 'AWS'],
        isGenerated: false
      }
    ]
  },
  wellness: {
    title: 'Health & Wellness',
    description: 'Evidence-based health insights from certified professionals',
    articles: [
      { 
        title: 'Science-Based Nutrition Planning',
        slug: 'evidence-based-nutrition-guide',
        excerpt: 'Professional nutritionist insights into meal planning, supplement evaluation, and metabolic optimization.',
        readTime: '14 min read',
        category: 'Wellness',
        tags: ['Nutrition', 'Health', 'Supplements', 'Fitness'],
        isGenerated: false
      }
    ]
  },
  finance: {
    title: 'Financial Strategy',
    description: 'Professional financial analysis and strategic insights',
    articles: [
      { 
        title: 'Investment Portfolio Diversification',
        slug: 'portfolio-diversification-strategies',
        excerpt: 'Professional investment analysis. Risk management, asset allocation models, and market trend evaluation.',
        readTime: '20 min read',
        category: 'Finance',
        tags: ['Investing', 'Portfolio', 'Risk Management', 'Markets'],
        isGenerated: false
      }
    ]
  },
  professional: {
    title: 'Professional Development',
    description: 'Career advancement strategies and industry insights',
    articles: [
      { 
        title: 'Leadership in Remote Teams',
        slug: 'remote-leadership-strategies',
        excerpt: 'Executive insights into leading distributed teams. Communication frameworks, performance metrics, and culture building.',
        readTime: '16 min read',
        category: 'Professional',
        tags: ['Leadership', 'Remote Work', 'Management', 'Teams'],
        isGenerated: false
      }
    ]
  }
};

// Get all articles including generated ones
function getAllArticles(category = null) {
  const allContent = { ...expertContent };
  
  for (const [cat, content] of Object.entries(allContent)) {
    if (category && cat !== category) continue;
    
    const generatedForCategory = Array.from(generatedArticles.values())
      .filter(article => article.category.toLowerCase() === cat);
    
    allContent[cat].articles = [...content.articles, ...generatedForCategory];
  }
  
  return category ? allContent[category] : allContent;
}

// Find article by slug
function findArticleBySlug(slug) {
  if (generatedArticles.has(slug)) {
    return generatedArticles.get(slug);
  }
  
  for (const [category, content] of Object.entries(expertContent)) {
    const article = content.articles.find(a => a.slug === slug);
    if (article) {
      return article;
    }
  }
  
  return null;
}

// Generate structured data for SEO
function generateStructuredData(article) {
  return `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${article.title}",
      "description": "${article.excerpt}",
      "author": {
        "@type": "Organization",
        "name": "Mountain Lake Insights"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Mountain Lake Insights",
        "logo": {
          "@type": "ImageObject",
          "url": "https://example.com/logo.png"
        }
      },
      "datePublished": "${article.datePublished || new Date().toISOString()}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://example.com/insights/${article.slug}"
      }
    }
    </script>
  `;
}

// Generate navigation
function generateNavigation() {
  return `
    <nav class="main-nav" role="navigation" aria-label="Main navigation">
      <div class="nav-container">
        <div class="logo">
          <h1><a href="/">Mountain Lake Insights</a></h1>
        </div>
        <ul class="nav-menu">
          <li><a href="/" class="nav-link">Insights</a></li>
          <li><a href="/categories" class="nav-link">Topics</a></li>
          <li><a href="/experts" class="nav-link">Experts</a></li>
          <li><a href="/generate" class="nav-link">Generate Content</a></li>
          <li><a href="/newsletter" class="nav-link">Newsletter</a></li>
        </ul>
        <div class="search-container">
          <input type="search" placeholder="Search insights..." class="search-input" aria-label="Search">
          <button class="search-btn" aria-label="Search button">🔍</button>
        </div>
      </div>
    </nav>
  `;
}

// Generate content sections
function generateContentSections() {
  let sectionsHTML = '';
  const allContent = getAllArticles();
  
  for (const [category, content] of Object.entries(allContent)) {
    sectionsHTML += `
      <section class="content-section" data-category="${category}">
        <div class="section-header">
          <h2 class="section-title">${content.title}</h2>
          <p class="section-description">${content.description}</p>
        </div>
        <div class="articles-grid">
          ${content.articles.map(article => `
            <article class="article-card ${article.isGenerated ? 'generated' : ''}" onclick="window.location.href='/insights/${article.slug}'" role="button" tabindex="0">
              <div class="article-meta">
                <span class="read-time">${article.readTime}</span>
                <span class="category-tag">${article.category}</span>
                ${article.isGenerated ? '<span class="ai-badge">🤖 AI Generated</span>' : ''}
              </div>
              <h3 class="article-title">${article.title}</h3>
              <p class="article-excerpt">${article.excerpt}</p>
              <div class="article-tags">
                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
              <div class="article-cta">
                <span class="read-more">Read Full Analysis →</span>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }
  
  return sectionsHTML;
}

// Generate individual article page
function generateArticlePage(articleSlug) {
  const foundArticle = findArticleBySlug(articleSlug);
  
  if (!foundArticle) return null;
  
  const articleContent = foundArticle.content || `
    <h3>Executive Summary</h3>
    <p>This comprehensive analysis provides actionable insights based on extensive research and industry expertise.</p>
    
    <h3>Key Insights</h3>
    <div class="expert-box">
      <h4>💡 Expert Recommendation</h4>
      <p>Based on our analysis, the most effective approach involves implementing a phased strategy that balances immediate needs with long-term objectives.</p>
    </div>
    
    <h3>Implementation Strategy</h3>
    <p>Our research indicates that successful implementation requires careful consideration of multiple factors including budget allocation, timeline management, and stakeholder alignment.</p>
    
    <h3>Recommended Solutions</h3>
    <p>After extensive evaluation of available options, we've identified several high-quality solutions that consistently deliver superior results.</p>
  `;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${foundArticle.title} | Mountain Lake Insights</title>
      <meta name="description" content="${foundArticle.metaDescription || foundArticle.excerpt}">
      <meta name="keywords" content="${foundArticle.tags.join(', ')}">
      ${generateStructuredData(foundArticle)}
      <style>
        body { margin: 0; font-family: Georgia, serif; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); color: #333; line-height: 1.7; }
        .article-container { max-width: 800px; margin: 40px auto; padding: 40px 20px; background: rgba(255,255,255,0.95); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .back-btn { background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-bottom: 30px; }
        .article-header { margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #e5e7eb; }
        .article-meta { display: flex; gap: 20px; margin-bottom: 20px; font-size: 14px; color: #6b7280; flex-wrap: wrap; }
        .ai-badge { background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .article-title { font-size: 2.5rem; margin-bottom: 20px; color: #111827; line-height: 1.2; }
        .article-excerpt { font-size: 1.2rem; color: #4b5563; margin-bottom: 20px; }
        .article-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 16px; font-size: 12px; }
        .article-content { font-size: 1.1rem; line-height: 1.8; color: #374151; }
        .expert-box { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #0ea5e9; }
        .cta-section { background: #f8fafc; padding: 30px; border-radius: 12px; margin-top: 40px; text-align: center; }
        .cta-btn { background: #059669; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 1.1rem; text-decoration: none; display: inline-block; margin: 10px; }
      </style>
    </head>
    <body>
      <div class="article-container">
        <a href="/" class="back-btn">← Back to Insights</a>
        
        <div class="article-header">
          <div class="article-meta">
            <span>${foundArticle.readTime}</span>
            <span>•</span>
            <span>${foundArticle.category}</span>
            <span>•</span>
            <span>Expert Analysis</span>
            ${foundArticle.isGenerated ? '<span class="ai-badge">🤖 AI Generated</span>' : ''}
          </div>
          <h1 class="article-title">${foundArticle.title}</h1>
          <p class="article-excerpt">${foundArticle.excerpt}</p>
          <div class="article-tags">
            ${foundArticle.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        
        <div class="article-content">
          ${articleContent}
          
          <div class="cta-section">
            <h4>Want to implement these strategies?</h4>
            <p>Access our recommended tools and resources to get started immediately.</p>
            <a href="#" class="cta-btn">View Recommended Solutions</a>
            <a href="#" class="cta-btn">Schedule Expert Consultation</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate content generator page
function generateContentGeneratorPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Content Generator | Mountain Lake Insights</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); margin: 0; padding: 40px 20px; color: #1f2937; }
        .generator-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 25px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; color: #374151; }
        select, input[type="text"] { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; }
        .generate-btn { background: #2563eb; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; }
        .generate-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        .loading { text-align: center; margin: 20px 0; color: #6b7280; display: none; }
        .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .error { background: #ef4444; color: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .topic-suggestions { background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px; display: none; }
        .topic-suggestion { display: inline-block; background: #e5e7eb; padding: 6px 12px; margin: 4px; border-radius: 16px; cursor: pointer; font-size: 14px; }
        .topic-suggestion:hover { background: #d1d5db; }
      </style>
    </head>
    <body>
      <div class="generator-container">
        <h1 style="text-align: center; margin-bottom: 30px;">AI Content Generator</h1>
        <p style="text-align: center; color: #6b7280; margin-bottom: 40px;">Generate high-quality, professional content for your blog network using AI</p>
        
        <form id="contentForm">
          <div class="form-group">
            <label for="category">Category</label>
            <select id="category" name="category" required>
              <option value="">Select a category</option>
              <option value="technology">Technology</option>
              <option value="wellness">Wellness</option>
              <option value="finance">Finance</option>
              <option value="professional">Professional Development</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="topic">Topic or Custom Topic</label>
            <input type="text" id="topic" name="topic" placeholder="Enter a custom topic or select from suggestions below" required>
            <div id="topicSuggestions" class="topic-suggestions"></div>
          </div>
          
          <button type="submit" class="generate-btn" id="generateBtn">Generate Article</button>
          
          <div id="loading" class="loading">Generating content... This may take 30-60 seconds.</div>
          <div id="result"></div>
        </form>
        
        <p style="text-align: center; margin-top: 40px;"><a href="/" style="color: #2563eb;">← Back to Home</a></p>
      </div>
      
      <script>
        const categorySelect = document.getElementById('category');
        const topicInput = document.getElementById('topic');
        const topicSuggestions = document.getElementById('topicSuggestions');
        const form = document.getElementById('contentForm');
        const generateBtn = document.getElementById('generateBtn');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        
        const suggestions = ${JSON.stringify(contentPrompts)};
        
        categorySelect.addEventListener('change', function() {
          const category = this.value;
          if (category && suggestions[category]) {
            topicSuggestions.innerHTML = suggestions[category].topics
              .map(topic => \`<span class="topic-suggestion" onclick="selectTopic('\${topic}')">\${topic}</span>\`)
              .join('');
            topicSuggestions.style.display = 'block';
          } else {
            topicSuggestions.style.display = 'none';
          }
        });
        
        function selectTopic(topic) {
          topicInput.value = topic;
        }
        
        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const formData = new FormData(form);
          const category = formData.get('category');
          const topic = formData.get('topic');
          
          generateBtn.disabled = true;
          loading.style.display = 'block';
          result.innerHTML = '';
          
          try {
            const response = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category, topic })
            });
            
            const data = await response.json();
            
            if (data.success) {
              result.innerHTML = \`
                <div class="success">
                  <h3>Content Generated Successfully!</h3>
                  <p><strong>Title:</strong> \${data.article.title}</p>
                  <p><strong>Slug:</strong> \${data.article.slug}</p>
                  <p><strong>Read Time:</strong> \${data.article.readTime}</p>
                  <p><a href="/insights/\${data.article.slug}" target="_blank" style="color: white; text-decoration: underline;">View Article →</a></p>
                </div>
              \`;
            } else {
              throw new Error(data.error || 'Generation failed');
            }
          } catch (error) {
            result.innerHTML = \`
              <div class="error">
                <h3>Generation Failed</h3>
                <p>\${error.message}</p>
              </div>
            \`;
          } finally {
            generateBtn.disabled = false;
            loading.style.display = 'none';
          }
        });
      </script>
    </body>
    </html>
  `;
}

// Main page
function generateMainPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mountain Lake Insights | Expert Analysis & AI-Generated Content</title>
      <meta name="description" content="Professional insights and AI-generated content across technology, wellness, finance, and career development.">
      <meta name="twitter:card" content="summary_large_image">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); color: #1f2937; line-height: 1.6; }
        .main-nav { background: rgba(255,255,255,0.95); border-bottom: 1px solid rgba(229,231,235,0.8); position: sticky; top: 0; z-index: 100; }
        .nav-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; height: 70px; }
        .logo h1 a { color: #1f2937; text-decoration: none; font-size: 1.5rem; font-weight: 700; }
        .nav-menu { display: flex; list-style: none; gap: 30px; }
        .nav-link { color: #4b5563; text-decoration: none; font-weight: 500; }
        .nav-link:hover { color: #2563eb; }
        .search-container { display: flex; align-items: center; background: #f9fafb; border-radius: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; }
        .search-input { border: none; background: none; outline: none; padding: 4px 8px; font-size: 14px; width: 200px; }
        .search-btn { border: none; background: none; cursor: pointer; padding: 4px; color: #6b7280; }
        .hero-section { text-align: center; padding: 80px 20px; max-width: 800px; margin: 0 auto; }
        .hero-title { font-size: 3rem; font-weight: 800; margin-bottom: 20px; color: #111827; line-height: 1.1; }
        .hero-subtitle { font-size: 1.25rem; color: #6b7280; margin-bottom: 40px; }
        .hero-cta { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .cta-primary { background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .cta-ai { background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .cta-secondary { background: transparent; color: #2563eb; padding: 12px 24px; border: 2px solid #2563eb; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .content-section { margin: 60px 0; background: rgba(255,255,255,0.8); border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-title { font-size: 2.5rem; font-weight: 700; margin-bottom: 15px; color: #111827; }
        .section-description { font-size: 1.1rem; color: #6b7280; max-width: 600px; margin: 0 auto; }
        .articles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
        .article-card { background: white; border-radius: 12px; padding: 30px; cursor: pointer; transition: all 0.3s ease; border: 1px solid #e5e7eb; }
        .article-card.generated { border-left: 4px solid #10b981; }
        .article-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
        .article-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 14px; flex-wrap: wrap; gap: 10px; }
        .read-time { color: #6b7280; font-weight: 500; }
        .category-tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 16px; font-weight: 600; font-size: 12px; }
        .ai-badge { background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .article-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #111827; line-height: 1.3; }
        .article-excerpt { color: #4b5563; margin-bottom: 20px; line-height: 1.6; }
        .article-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .tag { background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 500; }
        .article-cta { display: flex; justify-content: space-between; align-items: center; }
        .read-more { color: #2563eb; font-weight: 600; font-size: 14px; }
        .generated .read-more { color: #10b981; }
        .stats-section { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 60px 20px; margin: 80px 0; border-radius: 16px; text-align: center; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; max-width: 800px; margin: 0 auto; }
        .stat-item h3 { font-size: 2.5rem; font-weight: 800; margin-bottom: 10px; }
        .stat-item p { opacity: 0.9; font-weight: 500; }
        @media (max-width: 768px) { .hero-title { font-size: 2rem; } .nav-menu { display: none; } .articles-grid { grid-template-columns: 1fr; } .hero-cta { flex-direction: column; align-items: center; } }
      </style>
    </head>
    <body>
      ${generateNavigation()}
      
      <div class="hero-section">
        <h1 class="hero-title">Expert Insights Enhanced by AI</h1>
        <p class="hero-subtitle">Professional analysis and AI-generated content across technology, wellness, finance, and career development</p>
        <div class="hero-cta">
          <a href="#insights" class="cta-primary">Explore Insights</a>
          <a href="/generate" class="cta-ai">Generate Content</a>
          <a href="/newsletter" class="cta-secondary">Subscribe</a>
        </div>
      </div>
      
      <div class="stats-section">
        <div class="container">
          <h2 style="margin-bottom: 40px; font-size: 2rem;">Powered by AI, Trusted by Professionals</h2>
          <div class="stats-grid">
            <div class="stat-item"><h3>50K+</h3><p>Monthly Readers</p></div>
            <div class="stat-item"><h3>200+</h3><p>Expert Articles</p></div>
            <div class="stat-item"><h3>AI</h3><p>Content Generation</p></div>
            <div class="stat-item"><h3>95%</h3><p>Reader Satisfaction</p></div>
          </div>
        </div>
      </div>
      
      <div class="container" id="insights">
        ${generateContentSections()}
      </div>
      
      <script>
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.classList.contains('article-card')) {
              e.target.click();
            }
          }
        });
        
        document.querySelector('.search-btn').addEventListener('click', function() {
          const query = document.querySelector('.search-input').value;
          if (query) console.log('Searching for:', query);
        });
        
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
          });
        });
      </script>
    </body>
    </html>
  `;
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;
  const method = req.method;
  
  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mountain-lake-insights',
      aiEnabled: !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here'
    }));
    return;
  }
  
  // Main page
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateMainPage());
    return;
  }
  
  // Content generator page
  if (pathname === '/generate' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateContentGeneratorPage());
    return;
  }
  
  // API endpoint for content generation
  if (pathname === '/api/generate' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { category, topic } = JSON.parse(body);
        
        if (!category || !topic) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Category and topic are required' }));
          return;
        }
        
        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'OpenAI API key not configured' }));
          return;
        }
        
        const generatedContent = await generateArticleContent(category, topic);
        const slug = createSlug(generatedContent.title);
        
        const article = {
          title: generatedContent.title,
          slug: slug,
          excerpt: generatedContent.excerpt,
          content: generatedContent.content,
          readTime: generatedContent.readTime,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          tags: generatedContent.tags,
          metaDescription: generatedContent.metaDescription,
          isGenerated: true,
          datePublished: new Date().toISOString()
        };
        
        generatedArticles.set(slug, article);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, article: { title: article.title, slug: article.slug, readTime: article.readTime } }));
        
      } catch (error) {
        console.error('Content generation error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message || 'Content generation failed' }));
      }
    });
    return;
  }
  
  // Individual articles
  if (pathname.startsWith('/insights/')) {
    const articleSlug = pathname.split('/insights/')[1];
    const articleContent = generateArticlePage(articleSlug);
    
    if (articleContent) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(articleContent);
      return;
    }
  }
  
  // Categories API
  if (pathname === '/categories') {
    const allContent = getAllArticles();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allContent, null, 2));
    return;
  }
  
  // Newsletter page
  if (pathname === '/newsletter') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter | Mountain Lake Insights</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; color: white; }
          .newsletter-container { background: rgba(255,255,255,0.95); color: #333; padding: 50px; border-radius: 16px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
          .newsletter-title { font-size: 2rem; margin-bottom: 20px; color: #1f2937; }
          .form-input { width: 100%; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 20px; font-size: 16px; }
          .subscribe-btn { background: #2563eb; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; }
        </style>
      </head>
      <body>
        <div class="newsletter-container">
          <h1 class="newsletter-title">Stay Informed</h1>
          <p>Get weekly expert insights and AI-generated content delivered to your inbox.</p>
          <form style="margin-top: 30px;">
            <input type="email" placeholder="Enter your email" class="form-input" required>
            <button type="submit" class="subscribe-btn">Subscribe to Newsletter</button>
          </form>
          <p style="margin-top: 20px;"><a href="/" style="color: #2563eb;">← Back to Insights</a></p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // Experts page
  if (pathname === '/experts') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Our Experts | Mountain Lake Insights</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); margin: 0; padding: 40px 20px; color: #1f2937; }
          .experts-container { max-width: 1000px; margin: 0 auto; }
          .experts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-top: 40px; }
          .expert-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
          .expert-avatar { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #1e40af); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; }
          .ai-card { border: 2px solid #10b981; }
          .ai-card .expert-avatar { background: linear-gradient(135deg, #10b981, #059669); }
        </style>
      </head>
      <body>
        <div class="experts-container">
          <h1 style="text-align: center; font-size: 2.5rem; margin-bottom: 20px;">Our Expert Team</h1>
          <p style="text-align: center; color: #6b7280; font-size: 1.1rem; margin: 0 auto 40px; max-width: 600px;">Our insights combine human expertise with AI-powered content generation.</p>
          
          <div class="experts-grid">
            <div class="expert-card">
              <div class="expert-avatar">👨‍💼</div>
              <h3>Dr. Michael Chen</h3>
              <p style="color: #2563eb; font-weight: 600;">Technology Strategy</p>
              <p style="color: #6b7280;">Former CTO with 15+ years in enterprise technology.</p>
            </div>
            
            <div class="expert-card ai-card">
              <div class="expert-avatar">🤖</div>
              <h3>AI Content Generator</h3>
              <p style="color: #10b981; font-weight: 600;">Powered by GPT-4</p>
              <p style="color: #6b7280;">Advanced AI system generating professional content across all expertise areas.</p>
            </div>
          </div>
          
          <p style="text-align: center; margin-top: 40px;"><a href="/" style="color: #2563eb;">← Back to Insights</a></p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // Enhanced sitemap
  if (pathname === '/sitemap.xml') {
    const staticUrls = Object.values(expertContent).flatMap(category => 
      category.articles.map(article => `  <url><loc>https://mountainlakeinsights.com/insights/${article.slug}</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`).join('\n')
    );
    
    const generatedUrls = Array.from(generatedArticles.values()).map(article => `  <url><loc>https://mountainlakeinsights.com/insights/${article.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${article.datePublished}</lastmod></url>`).join('\n');
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://mountainlakeinsights.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://mountainlakeinsights.com/experts</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://mountainlakeinsights.com/generate</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://mountainlakeinsights.com/newsletter</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
${staticUrls}
${generatedUrls}
</urlset>`;
    
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(sitemap);
    return;
  }
  
  // Robots.txt
  if (pathname === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('User-agent: *\nAllow: /\nSitemap: https://mountainlakeinsights.com/sitemap.xml');
    return;
  }
  
  // 404 handler
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<html><body style="font-family: Arial; text-align: center; margin-top: 100px;"><h1>404 - Page Not Found</h1><p><a href="/" style="color: #2563eb;">← Back to Home</a></p></body></html>');
});

server.listen(PORT, () => {
  console.log(`🏔️ Mountain Lake Insights server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 Main site: http://localhost:${PORT}`);
  console.log(`🤖 AI Content Generator: http://localhost:${PORT}/generate`);
  console.log(`📋 Available routes:`);
  console.log(`   - / (Expert insights and AI-generated content)`);
  console.log(`   - /insights/[article-slug] (Individual articles)`);
  console.log(`   - /experts (Meet our expert team + AI)`);
  console.log(`   - /generate (AI content generation interface)`);
  console.log(`   - /api/generate (POST - Generate content API)`);
  console.log(`   - /newsletter (Newsletter signup)`);
  console.log(`   - /categories (Content API with generated articles)`);
  console.log(`   - /sitemap.xml (Enhanced SEO sitemap)`);
  console.log(`   - /robots.txt (Search engine directives)`);
  console.log(`🤖 OpenAI Integration: ${OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here' ? 'ENABLED' : 'DISABLED - Set OPENAI_API_KEY'}`);
  console.log(`🎯 Content Focus: Expert insights enhanced with AI`);
});
