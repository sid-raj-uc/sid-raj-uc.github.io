# CNN Vision Visualizer

An interactive web application to visualize a Convolutional Neural Network's predictions and interpret its decisions using **Gradient-weighted Class Activation Mapping (Grad-CAM)**.

This project was built to showcase the inner workings of a custom CNN trained on the CIFAR-10 dataset.

## Features
- **Flask Backend API**: Loads the saved PyTorch model (`my_model.pth`), runs inference, and computes the Grad-CAM heatmaps.
- **Modern Web Interface**: Built with raw HTML, CSS (featuring glassmorphism and animations), and Vanilla JS.
- **Sample Images**: Pre-loaded with 50 samples from the CIFAR-10 test set for quick testing.

## Installation & Setup

1. **Clone/Download this repository.**
   Make sure all files (`app.py`, `my_model.pth`, `requirements.txt`, and the `static` folder) are kept together.

2. **Create a Python Virtual Environment** (Recommended)
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application**
   ```bash
   python app.py
   ```

5. **View in Browser**
   Open your browser and navigate to: [http://127.0.0.1:5001](http://127.0.0.1:5001)

## How it Works
When you upload an image or click a sample, the backend passes the image through the custom CNN. It calculates the top predictions and then runs a backward pass to compute gradients for the top predicted class. These gradients are pooled and multiplied by the feature maps from the final convolutional layer to create a heatmap. The heatmap highlights the exact regions of the image that strongly influenced the model's decision!
