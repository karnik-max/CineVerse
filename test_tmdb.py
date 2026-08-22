import os
import requests
from dotenv import load_dotenv


load_dotenv()

token = os.getenv("TMDB_API_TOKEN")


if not token:
    print("ERROR: TMDB_API_TOKEN was not found.")
    raise SystemExit(1)


print("TMDB token found.")


url = "https://api.themoviedb.org/3/movie/862"

headers = {
    "accept": "application/json",
    "Authorization": f"Bearer {token}"
}


response = requests.get(
    url,
    headers=headers,
    timeout=15
)


print("Status code:", response.status_code)


if response.ok:

    data = response.json()

    print("Movie:", data.get("title"))
    print("TMDB ID:", data.get("id"))
    print("Poster path:", data.get("poster_path"))
    print("Backdrop path:", data.get("backdrop_path"))

else:

    print("TMDB request failed:")
    print(response.text)