# Herb Recognition & Knowledge Dissemination System

## Project Overview
Final Year Engineering Project - Computer Science/AI

**Objective**: Develop an offline herb recognition system using Vision Transformer (ViT) with confidence-based decision making and interactive distribution mapping.

## System Architecture

### Frontend (React + Vite)
- **Image Upload**: File selection with preview
- **Prediction Display**: Herb name, confidence score, decision logic
- **Interactive Map**: Leaflet-based distribution visualization
- **State Management**: Prediction-map synchronization

### Backend (Node.js + Express)
- **Image Processing API**: Handles image upload and ML inference
- **Location API**: Serves herb distribution data
- **Offline Operation**: No external dependencies

### ML Service (Python + ViT)
- **Model**: google/vit-base-patch16-224 fine-tuned on 75 herb classes
- **Inference**: CPU-based prediction with confidence scoring
- **Decision Logic**: Three-tier confidence thresholds (40%, 65%)

## Confidence-Based Decision System

| Confidence Range | Action | Map Display | User Guidance |
|------------------|--------|-------------|---------------|
| < 40% | Retry | No | "Upload clearer image" |
| 40-65% | Accept with Warning | Yes | "Uncertain prediction" |
| ≥ 65% | Accept | Yes | "High confidence" |

## Dataset
- **Size**: 75 medicinal and culinary herbs
- **Structure**: Folder-based classification
- **Examples**: Acorus_calamus, Adhatoda_vasica, etc.
- **Metadata**: JSON files with herb information

## Key Features
1. **Explainable AI**: Clear confidence thresholds with user feedback
2. **Offline Operation**: No internet required for demo
3. **Interactive Visualization**: Map updates only for high-confidence predictions
4. **Academic Focus**: Emphasis on clarity and explainability over scalability

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm start
```

### ML Service Setup
```bash
cd ml_service
pip install -r requirements.txt
python predict.py
```

## Project Structure
```
herb-recognition-system/
├── frontend/          # React application
├── backend/           # Express API server
├── ml_service/        # Python ML inference
├── dataset/           # Herb images and metadata
└── README.md          # This file
```

## Academic Contributions
1. **Confidence-based gating** for ML predictions
2. **Offline-first architecture** for reliable demos
3. **Clear separation of concerns** in system design
4. **Explainable decision logic** for academic review

## Future Enhancements
- Dataset augmentation techniques
- Model interpretability features
- Performance optimization
- Extended herb database

## Viva Questions Preparation
- Why ViT over CNN for herb classification?
- How does confidence thresholding improve user experience?
- What are the trade-offs of offline vs online systems?
- How would you scale this system for production use?
