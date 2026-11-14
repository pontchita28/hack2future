SELECT
    c.*,
    p.customer_id,
    p.customer_age,
    p.city,
    p.policy_type,
    p.risk_band,
    p.channel,
    p.broker_code,
    p.start_date,
    p.deductible,
    p.annual_premium,
    p.renewal_status
FROM claims AS c
JOIN policies AS p
    ON c.policy_id = p.policy_id
WHERE TRY_CAST(
          REPLACE(REPLACE(CAST(p.deductible AS VARCHAR), '$', ''), ',', '')
          AS DECIMAL(12, 2)
      )
    > TRY_CAST(
          REPLACE(REPLACE(CAST(c.claim_amount AS VARCHAR), '$', ''), ',', '')
          AS DECIMAL(12, 2)
      );