-- SummerMate PostgreSQL initialization
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE summermate_db TO summermate;
GRANT ALL ON SCHEMA public TO summermate;
ALTER USER summermate CREATEDB;
