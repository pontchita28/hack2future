CREATE OR REPLACE TABLE claims AS
SELECT *
FROM read_csv_auto('claims.csv')
WHERE claim_id NOT ILIKE '%TEST%';

CREATE OR REPLACE TABLE policies AS
SELECT *
FROM read_csv_auto('policies.csv')
WHERE policy_id NOT ILIKE '%TEST%';

COPY claims TO 'claims.csv' (HEADER, DELIMITER ',');
COPY policies TO 'policies.csv' (HEADER, DELIMITER ',');
