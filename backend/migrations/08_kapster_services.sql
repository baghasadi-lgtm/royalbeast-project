CREATE TABLE kapster_services (
    id SERIAL PRIMARY KEY,
    kapster_profile_id INT NOT NULL REFERENCES kapster_profiles(kapster_id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);
