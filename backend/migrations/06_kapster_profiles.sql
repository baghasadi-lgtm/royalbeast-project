CREATE TABLE kapster_profiles (
  kapster_id INT PRIMARY KEY REFERENCES users(id),
  full_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  age INT,
  photo_url TEXT,
  bio TEXT
);