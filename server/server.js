const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const { optimizeContent } = require('./aiService');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up multer for file upload handling in memory with a 10MB limit
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/optimize', upload.array('guidelinePdfs', 10), async (req, res) => {
  try {
    const { postDraft, targetAudience, contentGoal, guidelineText } = req.body;
    
    if (!postDraft) {
      return res.status(400).json({ error: 'Post draft is required.' });
    }

    let guidelinesText = guidelineText || '';

    // Extract text from PDFs if they exist
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const pdfData = await pdfParse(file.buffer);
          guidelinesText += `\n--- Document: ${file.originalname} ---\n${pdfData.text}\n`;
        }
      } catch (err) {
        console.error('Error parsing PDF:', err);
        return res.status(400).json({ error: 'Failed to extract text from the provided PDFs.' });
      }
    }

    if (!guidelinesText.trim()) {
      guidelinesText = 'No guidelines provided.';
    }

    // Call AI Service
    const aiResult = await optimizeContent({
      draft: postDraft,
      audience: targetAudience,
      goal: contentGoal,
      guidelinesText
    });

    res.json({
      results: aiResult.results || [],
      extractedGuidelineText: guidelinesText
    });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
