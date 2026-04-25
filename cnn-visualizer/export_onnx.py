#!/usr/bin/env python3
"""
Export my_model.pth → model.onnx for in-browser inference.

The exported model has TWO outputs:
  logits   : (1, 10)     — raw class scores
  features : (1, 64, 8, 8) — conv3 activation maps used for CAM heatmap

Run once:
    pip install torch onnx
    python export_onnx.py
Then commit model.onnx to the repo.
"""
import os
import torch
import torch.nn as nn
import torch.nn.functional as F

HERE = os.path.dirname(os.path.abspath(__file__))


class CIFAR_CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1   = nn.Conv2d(3, 32, 3, padding=1)
        self.pool    = nn.MaxPool2d(2, 2)
        self.bn1     = nn.BatchNorm2d(32)
        self.conv2   = nn.Conv2d(32, 64, 3, padding=1)
        self.bn2     = nn.BatchNorm2d(64)
        self.conv3   = nn.Conv2d(64, 64, 3, padding=1)
        self.bn3     = nn.BatchNorm2d(64)
        self.fc1     = nn.Linear(64 * 8 * 8, 128)
        self.bn_fc   = nn.BatchNorm1d(128)
        self.fc2     = nn.Linear(128, 64)
        self.fc3     = nn.Linear(64, 10)
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
        return self.fc3(x)


class ExportWrapper(nn.Module):
    """Returns (logits, cam) — dropout disabled at inference. Computes Grad-CAM internally."""
    def __init__(self, base: CIFAR_CNN):
        super().__init__()
        self.base = base

    def forward(self, x):
        # 1. Forward pass up to features
        x = F.relu(self.base.bn1(self.base.conv1(x)))
        x = self.base.pool(x)
        x = F.relu(self.base.bn2(self.base.conv2(x)))
        x = self.base.pool(x)
        features = F.relu(self.base.bn3(self.base.conv3(x)))  # (1, 64, 8, 8)
        
        flat = features.view(features.size(0), -1)
        
        # 2. FC layers forward
        pre_h1 = self.base.bn_fc(self.base.fc1(flat))
        h1 = F.relu(pre_h1)
        pre_h2 = self.base.fc2(h1)
        h2 = F.relu(pre_h2)
        logits = self.base.fc3(h2)  # (1, 10)
        
        # 3. Get the predicted class index
        pred_class = torch.argmax(logits, dim=1) # (1,)
        
        # 4. Manual backward pass for the predicted class
        grad_h2 = self.base.fc3.weight[pred_class] # (1, 64)
        grad_pre_h2 = grad_h2 * (pre_h2 > 0).float() # (1, 64)
        grad_h1 = torch.matmul(grad_pre_h2, self.base.fc2.weight) # (1, 128)
        grad_pre_h1 = grad_h1 * (pre_h1 > 0).float() # (1, 128)
        
        std = torch.sqrt(self.base.bn_fc.running_var + self.base.bn_fc.eps)
        grad_flat = grad_pre_h1 * (self.base.bn_fc.weight / std) # (1, 128)
        
        grad_flat = torch.matmul(grad_flat, self.base.fc1.weight) # (1, 4096)
        
        grad_features = grad_flat.view(1, 64, 8, 8)
        
        # 5. Grad-CAM weights: global average pooling of gradients
        weights = torch.mean(grad_features, dim=(2, 3), keepdim=True) # (1, 64, 1, 1)
        
        # 6. Grad-CAM heatmap: weighted sum of features
        cam = torch.sum(weights * features, dim=1, keepdim=True) # (1, 1, 8, 8)
        cam = F.relu(cam) # (1, 1, 8, 8)
        
        # Normalize to [0, 1] internally for convenience
        cam_min = torch.min(cam.view(cam.size(0), -1), dim=1, keepdim=True)[0].view(cam.size(0), 1, 1, 1)
        cam_max = torch.max(cam.view(cam.size(0), -1), dim=1, keepdim=True)[0].view(cam.size(0), 1, 1, 1)
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
        
        return logits, cam.squeeze(0).squeeze(0)


def main():
    pth_path  = os.path.join(HERE, 'my_model.pth')
    onnx_path = os.path.join(HERE, 'model.onnx')

    base = CIFAR_CNN()
    base.load_state_dict(torch.load(pth_path, map_location='cpu'))
    base.eval()

    model = ExportWrapper(base)
    model.eval()

    dummy = torch.zeros(1, 3, 32, 32)

    torch.onnx.export(
        model, dummy, onnx_path,
        input_names=['image'],
        output_names=['logits', 'cam'],
        opset_version=15,
        do_constant_folding=True,
    )

    # New PyTorch exporters may split weights into model.onnx.data.
    # Merge everything back into a single self-contained file so ONNX
    # Runtime Web can fetch it with one request.
    import onnx
    data_file = onnx_path + '.data'
    proto = onnx.load(onnx_path)          # loads external data automatically
    onnx.save_model(proto, onnx_path, save_as_external_data=False)
    if os.path.exists(data_file):
        os.remove(data_file)
        print('Merged external weights into single file.')

    print(f'Exported → {onnx_path}')

    try:
        onnx.checker.check_model(onnx.load(onnx_path))
        print('ONNX model verified ✓')
    except Exception as e:
        print(f'Verification warning: {e}')


if __name__ == '__main__':
    main()
