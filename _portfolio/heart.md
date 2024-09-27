---
title: "Heart-Disease-Prediction [![GitHub](https://img.shields.io/badge/-GitHub-black?style=flat-square&logo=github)](https://github.com/atishay-kasliwal/Heart-Disease-Prediction)"
excerpt: "Heart Disease Prediction: Saving Lives using Machine Learning by Sparsh Srivastava is a project that leverages machine learning to predict the likelihood of heart disease based on a variety of biological and physical parameters. Using the UCI Heart Disease dataset and advanced data analysis techniques, the project aims to build an accurate model, deploy it using AWS SageMaker, and make predictions accessible via an API and Android app, allowing users to assess their heart health anytime. The model achieved high accuracy with benchmarks focusing on precision, recall, and accuracy metrics.<br/><img src='/images/heart.png'>"
collection: portfolio
date: 2022-09-01

---

Heart Disease Prediction: Saving Lives using Machine Learning by Sparsh Srivastava addresses the critical issue of heart disease, a leading cause of death worldwide. The project uses the UCI Heart Disease dataset, containing medical and physical data such as age, cholesterol levels, blood pressure, and more, to predict the presence of heart disease. Key objectives include:

Conducting an in-depth analysis of the dataset to gain insights into the relationships between features.
Building a machine learning model with Linear Regression, focusing on high accuracy and precision for prediction.
Deploying the model on AWS SageMaker and integrating it with AWS Lambda and API Gateway to make predictions accessible via a public API.
Developing an Android app that allows users and patients to input their data and predict their heart health on the go.
The Exploratory Data Analysis (EDA) helps uncover patterns in the dataset, and a Correlation Matrix reveals relationships between different features. The dataset consists of attributes such as age, gender, cholesterol level, chest pain, and more. The project's main goal is to predict whether a person has heart disease based on these features.

The solution architecture involves:

A SageMaker-deployed model.
An AWS Lambda function to handle API requests and communicate with the SageMaker endpoint.
An API Gateway that facilitates the interaction between users and the model.
An Android App that collects user input and provides real-time heart disease predictions.
The project uses standard evaluation metrics like Accuracy, Precision, and Recall to assess model performance. By benchmarking with test data, the model's effectiveness is validated against false positives and false negatives.

This project provides a real-world solution that could save lives by giving people an accessible tool to monitor their heart health and seek medical help if necessary.