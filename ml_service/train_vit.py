import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import json
import torch
from torchvision import datasets, transforms
from transformers import ViTForImageClassification
from torch.utils.data import DataLoader
from torch import nn, optim


DATASET_PATH = "../dataset/images"


from torchvision.datasets import ImageFolder
from PIL import Image

class SafeImageFolder(ImageFolder):
    def __getitem__(self, index):
        path, target = self.samples[index]
        try:
            sample = self.loader(path)
            if self.transform is not None:
                sample = self.transform(sample)
        except Exception:
            # Skip bad image by moving to next index
            return self.__getitem__((index + 1) % len(self.samples))
        return sample, target



# Auto-generate labels
classes = sorted(os.listdir(DATASET_PATH))
label_map = {cls: i for i, cls in enumerate(classes)}

with open("labels.json", "w") as f:
    json.dump(label_map, f, indent=2)

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485,0.456,0.406],
        std=[0.229,0.224,0.225]
    )
])

dataset = SafeImageFolder(DATASET_PATH, transform=transform)
loader = DataLoader(dataset, batch_size=8, shuffle=True)

model = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=len(classes),
    ignore_mismatched_sizes=True
)


criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=2e-5)

model.train()
for epoch in range(3):  # keep small for demo
    for imgs, labels in loader:
        outputs = model(imgs)
        loss = criterion(outputs.logits, labels)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    print(f"Epoch {epoch+1} done")

os.makedirs("model", exist_ok=True)
torch.save(model.state_dict(), "model/vit_herb_model.pth")
print("✅ Model trained & saved")
