import os
import io
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import cv2

app = Flask(__name__, static_folder='static')
CORS(app)

# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Define Model
class CIFAR_CNN(nn.Module):
    def __init__(self):
        super(CIFAR_CNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 64, 3, padding=1)
        self.bn3 = nn.BatchNorm2d(64)
        self.fc1 = nn.Linear(64 * 8 * 8, 128)
        self.bn_fc = nn.BatchNorm1d(128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 10)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.pool(x)
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)
        x = F.relu(self.bn3(self.conv3(x)))
        x = x.view(-1, 64 * 8 * 8)
        x = F.relu(self.bn_fc(self.fc1(x)))
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        return x

# Define GradCAM
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        def save_gradient(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        def save_activation(module, input, output):
            self.activations = output

        self.target_layer.register_forward_hook(save_activation)
        self.target_layer.register_full_backward_hook(save_gradient)

    def generate_heatmap(self, input_image, class_idx):
        output = self.model(input_image)
        self.model.zero_grad()
        loss = output[0, class_idx]
        loss.backward()

        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1).squeeze()
        cam = np.maximum(cam.detach().cpu().numpy(), 0)
        cam = cv2.resize(cam, (32, 32))
        
        if np.max(cam) != 0:
            cam = cam - np.min(cam)
            cam = cam / np.max(cam)
        return cam

# Load model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'my_model.pth')
model = CIFAR_CNN()
try:
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

# Initialize Grad-CAM for the last conv layer
cam_engine = GradCAM(model, model.conv3)

# CIFAR-10 classes
classes = ('plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck')

transform = transforms.Compose([
    transforms.Resize((32, 32)),
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

def image_to_base64(img):
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    try:
        # Read image
        img_bytes = file.read()
        original_img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # Prepare tensor
        img_tensor = transform(original_img).unsqueeze(0).to(device)
        
        # Inference
        output = model(img_tensor)
        probabilities = F.softmax(output, dim=1)[0].detach().cpu().numpy()
        _, pred = torch.max(output, 1)
        pred_idx = pred.item()
        pred_class = classes[pred_idx]
        
        # Format probabilities for UI
        probs_dict = {classes[i]: float(probabilities[i]) for i in range(len(classes))}
        probs_sorted = sorted(probs_dict.items(), key=lambda x: x[1], reverse=True)
        
        # Generate GradCAM
        heatmap = cam_engine.generate_heatmap(img_tensor, pred_idx)
        
        # Create visual overlay
        # 1. Resize original image to 256x256 for better visualization
        vis_img = original_img.resize((256, 256), Image.Resampling.LANCZOS)
        vis_img_np = np.array(vis_img)
        
        # 2. Resize heatmap to match
        heatmap_resized = cv2.resize(heatmap, (256, 256))
        
        # 3. Apply colormap
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        
        # 4. Overlay
        overlay_np = cv2.addWeighted(vis_img_np, 0.5, heatmap_colored, 0.5, 0)
        overlay_img = Image.fromarray(overlay_np)
        heatmap_only_img = Image.fromarray(heatmap_colored)
        
        return jsonify({
            'predicted_class': pred_class,
            'confidence': float(probabilities[pred_idx]),
            'probabilities': probs_sorted,
            'original_b64': image_to_base64(vis_img),
            'heatmap_b64': image_to_base64(heatmap_only_img),
            'overlay_b64': image_to_base64(overlay_img)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
