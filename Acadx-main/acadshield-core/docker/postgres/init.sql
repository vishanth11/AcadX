-- ACADSHIELD CORE - Initial Database Extension Setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log database initialization
DO $$
BEGIN
    RAISE NOTICE 'AcadShield Core database initialized with pgcrypto and uuid-ossp extensions.';
END $$;
