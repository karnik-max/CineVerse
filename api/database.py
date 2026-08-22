import sqlite3
from pathlib import Path


# ==========================================================
# Database path
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(
    parents=True,
    exist_ok=True
)

DB_PATH = DATA_DIR / "cineverse.db"


# ==========================================================
# Connection
# ==========================================================

def get_connection():
    connection = sqlite3.connect(
        DB_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


# ==========================================================
# Initialize database
# ==========================================================

def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()

    # ----------------------------------------------
    # Users
    # ----------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # ----------------------------------------------
    # Ratings
    # ----------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id TEXT NOT NULL,

            canonical_movie_id INTEGER NOT NULL,

            rating INTEGER NOT NULL
                CHECK(rating >= 1 AND rating <= 5),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(
                user_id,
                canonical_movie_id
            ),

            FOREIGN KEY(user_id)
                REFERENCES users(user_id)
        )
        """
    )

    connection.commit()

    connection.close()


# ==========================================================
# User
# ==========================================================

def create_user_if_not_exists(user_id):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT OR IGNORE INTO users (user_id)
        VALUES (?)
        """,
        (user_id,)
    )

    connection.commit()

    connection.close()


# ==========================================================
# Save / update rating
# ==========================================================

def save_rating(
    user_id,
    canonical_movie_id,
    rating
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO ratings (
            user_id,
            canonical_movie_id,
            rating
        )

        VALUES (?, ?, ?)

        ON CONFLICT(
            user_id,
            canonical_movie_id
        )

        DO UPDATE SET
            rating = excluded.rating,
            updated_at = CURRENT_TIMESTAMP
        """,
        (
            user_id,
            canonical_movie_id,
            rating
        )
    )

    connection.commit()

    connection.close()


# ==========================================================
# Get user's rating
# ==========================================================

def get_user_rating(
    user_id,
    canonical_movie_id
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT rating
        FROM ratings
        WHERE user_id = ?
          AND canonical_movie_id = ?
        """,
        (
            user_id,
            canonical_movie_id
        )
    )

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    return row["rating"]


# ==========================================================
# Get all ratings for a user
# ==========================================================

def get_user_ratings(user_id):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            canonical_movie_id,
            rating,
            created_at,
            updated_at
        FROM ratings
        WHERE user_id = ?
        ORDER BY updated_at DESC
        """,
        (user_id,)
    )

    rows = cursor.fetchall()

    connection.close()

    return [
        dict(row)
        for row in rows
    ]