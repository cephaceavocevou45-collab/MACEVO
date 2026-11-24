
import os

from dotenv import load_dotenv
from google import genai


def main():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY est requis pour ce test manuel.")

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        contents="Dis simplement Bonjour.",
    )
    print(response.text)


if __name__ == "__main__":
    main()