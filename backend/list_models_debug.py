import google.generativeai as genai
import os

# Set your Gemini API key here
os.environ["GEMINI_API_KEY"] = "AIzaSyA7lctcuV6WsvUflnFqClJeHhuzfWZ9-DM"
genai.configure(api_key="AIzaSyA7lctcuV6WsvUflnFqClJeHhuzfWZ9-DM")

models = genai.list_models()
for model in models:
    print(model.name)
