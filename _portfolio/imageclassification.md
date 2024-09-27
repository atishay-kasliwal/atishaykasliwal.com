---
title: "Twitter-Sentiment-Analyzer  [![GitHub](https://img.shields.io/badge/-GitHub-black?style=flat-square&logo=github)](https://github.com/atishay-kasliwal/Twitter-Sentiment-Analyzer)"
excerpt: "This project focuses on classifying images of natural scenes from around the world using the Intel Image Classification dataset from Kaggle. The dataset contains six categories: buildings, forest, glacier, mountain, sea, and street. A ResNet-152 neural network model was used, with pre-trained weights updated by training on the provided training dataset (seg_train). The model achieved 90.7% accuracy on the validation dataset (seg_test). Both an offline notebook and a Google Colab notebook were used for experimentation and model training.<br/><img src='/images/image.png'>"
collection: portfolio
date: 2020-06-01

---

This project tackles the Intel Image Classification challenge from Kaggle, which involves classifying images of natural scenes into six different categories: buildings, forest, glacier, mountain, sea, and street. The dataset, structured into folders for training and prediction, includes seg_train for training images and seg_pred for images to be predicted. These are stored in a folder named classification.

The core task was to build a robust Convolutional Neural Network (CNN) using ResNet-152, a deep learning model that is known for its superior performance in image recognition tasks. Initially, the model utilized pre-trained weights, which were further fine-tuned by training on the seg_train dataset. The model then evaluated its performance on the seg_test dataset.

With effective data augmentation, optimization, and fine-tuning, the ResNet-152 model achieved an impressive 90.7% accuracy on the validation set.

Both an offline Jupyter notebook and a Google Colab notebook were used for experimentation. The Colab notebook provides an accessible platform for training the model with high computational power, while the offline notebook offers flexibility for local modifications and testing.