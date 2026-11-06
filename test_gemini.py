"""Paso 1: comprobar que la clave de Gemini funciona."""

import os

from dotenv import load_dotenv
from google import genai

load_dotenv()  # lee las variables del archivo .env

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise SystemExit("Falta GEMINI_API_KEY en .env")

client = genai.Client(api_key=api_key)
response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents="Responde solo: 'Conexión con Gemini OK'",
)
print(response.text)
