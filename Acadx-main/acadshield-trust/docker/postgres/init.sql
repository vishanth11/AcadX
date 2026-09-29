-- ACADSHIELD TRUST (PROJECT B) - Initial Database Setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    RAISE NOTICE 'AcadShield Trust database initialized with pgcrypto and uuid-ossp.';
END $$;
