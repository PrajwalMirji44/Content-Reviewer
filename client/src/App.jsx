import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, RefreshCw, Copy, ChevronRight, Download } from 'lucide-react';
import './index.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [resultData, setResultData] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Form Refs
  const draftRef = useRef(null);
  const audienceRef = useRef(null);
  const goalRef = useRef(null);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draftRef.current.value) return alert('Please enter your post drafts.');
    if (!fileRef.current.files || fileRef.current.files.length === 0) {
      return alert('Please upload your strategy PDF.');
    }
    
    setLoading(true);
    setLoadingText('Uploading and parsing guidelines...');
    setResultData(null);

    const formData = new FormData();
    formData.append('postDraft', draftRef.current.value);
    formData.append('targetAudience', audienceRef.current.value);
    formData.append('contentGoal', goalRef.current.value);
    
    if (fileRef.current.files.length > 0) {
      Array.from(fileRef.current.files).forEach(file => {
        formData.append('guidelinePdfs', file);
      });
    }

    // Dynamic loading text to improve perceived performance
    const loadingStages = [
      'Analyzing your draft against the guidelines...',
      'Evaluating hook strength and clarity...',
      'Generating detailed line-by-line critiques...',
      'Crafting the final optimized posts...',
      'Polishing formatting...'
    ];
    let stage = 0;
    const loadingInterval = setInterval(() => {
      if (stage < loadingStages.length) {
        setLoadingText(loadingStages[stage]);
        stage++;
      }
    }, 4000);

    const API_URL = import.meta.env.DEV 
      ? 'http://localhost:5000/api/optimize' 
      : '/api/optimize';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch from server');
      }

      const data = await response.json();
      setResultData(data.results || []);
    } catch (error) {
      console.error(error);
      alert('An error occurred during optimization. Make sure the server is running and API key is valid.');
    } finally {
      clearInterval(loadingInterval);
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleReset = () => {
    setResultData(null);
    if (draftRef.current) draftRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    if (!resultData || resultData.length === 0) return;
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>LinkedIn Export</title>
      <style>
        body { font-family: 'Arial', sans-serif; }
        h1 { color: #E8531D; font-size: 20pt; }
        h2 { font-size: 14pt; border-bottom: 1px solid #cccccc; padding-bottom: 5px; }
        h3 { color: #E8531D; font-size: 12pt; margin-top: 15px; }
        .critique { margin-bottom: 10px; border-left: 3px solid #E8531D; padding-left: 10px; }
        .original { font-style: italic; background: #FDF0EA; padding: 5px; display: inline-block; margin-bottom: 5px; }
        .score { font-weight: bold; color: #10b981; }
      </style>
      </head><body>
      <h1>LinkedIn Content Optimization Export</h1>
      <br>
    `;

    resultData.forEach((post, i) => {
      htmlContent += `<h2>[POST DATE / ID]: ${post.date || `Post ${i+1}`}</h2>`;
      htmlContent += `<p><strong>Scores:</strong> Match: <span class="score">${post.guidelineMatchPercentage}%</span> | Hook: <span class="score">${post.hookScore}/100</span> | Clarity: <span class="score">${post.clarityScore}/100</span></p>`;
      
      htmlContent += `<h3>Detailed Critiques</h3>`;
      post.lineCritiques?.forEach((critique, idx) => {
        htmlContent += `<div class="critique">`;
        htmlContent += `<div class="original">${idx + 1}. Original: "${critique.originalLine}"</div><br>`;
        htmlContent += `<strong>Why:</strong> ${critique.whyToImprove}<br>`;
        htmlContent += `<strong>How to fix:</strong> <span style="color: #10b981;">${critique.howToImprove}</span>`;
        htmlContent += `</div><br>`;
      });

      htmlContent += `<h3>Optimized Post Content</h3>`;
      htmlContent += `<p style="white-space: pre-wrap; font-size: 11pt;">${post.optimizedPost}</p>`;
      htmlContent += `<hr><br><br>`;
    });

    htmlContent += `</body></html>`;

    // \ufeff is the BOM for UTF-8 to ensure Word reads it correctly
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Optimized-Posts-${new Date().toISOString().slice(0,10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-value';
    if (score >= 50) return 'score-value medium';
    return 'score-value low';
  };

  return (
    <div className="app-container">
      <header className="header fade-in">
        <h1>LinkedIn Content Optimizer</h1>
        <p>Elevate your personal brand with AI-driven content strategy</p>
      </header>

      <main className="main-content">
        <section className="glass-panel fade-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>1. Post Drafts (Paste entire document)</label>
              <textarea 
                ref={draftRef}
                className="form-control" 
                placeholder="Paste your raw thoughts or multiple posts (separated by dates) here..."
                required
              />
            </div>

            <div className="form-group">
              <label>2. Target Audience (Optional)</label>
              <input 
                ref={audienceRef}
                type="text" 
                className="form-control" 
                placeholder="e.g., Tech Founders, Junior Devs..."
              />
            </div>

            <div className="form-group">
              <label>3. Content Goal</label>
              <select ref={goalRef} className="form-control">
                <option value="Engagement">Engagement (Comments & Likes)</option>
                <option value="Leads">Leads (Inbound Messages)</option>
                <option value="Authority">Authority (Thought Leadership)</option>
                <option value="All Three">All Three (Engagement, Leads & Authority)</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                4. Guideline Documents (PDF)
              </label>
              <div className="file-upload">
                <input 
                  type="file" 
                  accept=".pdf" 
                  multiple
                  ref={fileRef}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      setFileName(files.map(f => f.name).join(', '));
                    } else {
                      setFileName('');
                    }
                  }}
                />
                <UploadCloud size={32} color="var(--primary)" style={{ marginBottom: '10px' }} />
                <p>
                  {fileName ? fileName : 'Click to Upload Guideline Doc(s)'}
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-submit" disabled={loading}>
              {loading ? <span className="loader"></span> : <><RefreshCw size={18} /> Batch Optimize Content</>}
            </button>
          </form>
        </section>

        <section className="results-panel">
          {loading && (
            <div className="skeleton-container fade-in">
              <div className="skeleton-header">
                <RefreshCw className="spin-icon" size={24} color="var(--primary)" />
                <h3>{loadingText}</h3>
                <p>AI is evaluating your content against the strategy. This usually takes 15-30 seconds.</p>
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line title"></div>
                <div className="skeleton-box"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          )}

          {!loading && !resultData && (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <CheckCircle size={48} color="var(--panel-border)" />
              </div>
              <h2>Ready for Analysis</h2>
              <p>Paste your drafts on the left, set your goal, and hit Optimize. We'll generate a comprehensive, line-by-line critique and rewritten post right here.</p>
            </div>
          )}

          {!loading && resultData && resultData.length > 0 && (
            <div className="fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="results-header-container">
                <h2 className="results-title">
                  Optimized Results
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleReset} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                    <RefreshCw size={16} /> Reset
                  </button>
                  <button type="button" className="btn btn-export" onClick={handleExport}>
                    <Download size={16} /> Export Document
                  </button>
                </div>
              </div>
            
            <div style={{ maxHeight: '800px', overflowY: 'auto', paddingRight: '10px' }}>
              {resultData.map((post, idx) => (
                <div key={idx} className="post-result-card">
                  <div className="post-date-badge">{post.date || `Post ${idx+1}`}</div>
                  
                  <div className="scores-container">
                    <div className="score-card">
                      <div className="score-label">Guide Match</div>
                      <div className={getScoreColor(post.guidelineMatchPercentage)}>
                        {post.guidelineMatchPercentage}%
                      </div>
                    </div>
                    <div className="score-card">
                      <div className="score-label">Hook</div>
                      <div className={getScoreColor(post.hookScore)}>
                        {post.hookScore}/100
                      </div>
                    </div>
                    <div className="score-card">
                      <div className="score-label">Clarity</div>
                      <div className={getScoreColor(post.clarityScore)}>
                        {post.clarityScore}/100
                      </div>
                    </div>
                  </div>

                  <div className="result-section">
                    <h3>Detailed Line Critiques</h3>
                    <div className="critique-container">
                      {post.lineCritiques?.map((critique, idxx) => (
                        <div key={idxx} className="critique-block">
                          <div className="critique-original">
                            <span className="critique-label">Original Draft:</span>
                            "{critique.originalLine}"
                          </div>
                          <div className="critique-feedback">
                            <div className="critique-why">
                              <strong>Why it needs improvement:</strong> {critique.whyToImprove}
                            </div>
                            <div className="critique-how">
                              <strong>How to fix it:</strong> {critique.howToImprove}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h3>Optimized Post</h3>
                    <div className="optimized-post-container">
                      <div className="optimized-post-content">
                        {post.optimizedPost}
                      </div>
                      <div className="copy-btn-wrapper">
                        <button type="button" className="btn btn-secondary" onClick={() => handleCopy(post.optimizedPost)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                          <Copy size={16} /> Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
