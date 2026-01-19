import warnings
warnings.filterwarnings("ignore")

import sys
import json
import torch
import os
from PIL import Image
from torchvision import transforms
from transformers import ViTForImageClassification

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
image_path = sys.argv[1]

# Load labels safely
with open(os.path.join(BASE_DIR, "labels.json"), "r") as f:
    label_map = json.load(f)

inv_labels = {v: k for k, v in label_map.items()}
num_classes = len(label_map)

# Preprocess
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485,0.456,0.406],
        std=[0.229,0.224,0.225]
    )
])

image = Image.open(image_path).convert("RGB")
tensor = transform(image).unsqueeze(0)

# Load model
model = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=num_classes,
    ignore_mismatched_sizes=True
)

model_path = os.path.join(BASE_DIR, "model", "vit_herb_model.pth")
model.load_state_dict(torch.load(model_path, map_location="cpu"))
model.eval()

# Predict
with torch.no_grad():
    outputs = model(tensor)
    probs = torch.softmax(outputs.logits, dim=1)
    conf, pred = torch.max(probs, dim=1)

result = {
    "herb": inv_labels[pred.item()],
    "confidence": round(conf.item() * 100, 2)
}

print(json.dumps(result))
