WITH amount_paid_by_year AS (
    SELECT
        customer_id,
        deductible,
        SUM(
            CAST(
                REPLACE(REPLACE(annual_premium, '$', ''), ',', '')
                AS DECIMAL(12, 2)
            )
        ) AS total_annual_premium
    FROM policies
    WHERE policy_id NOT LIKE '%TEST%'
    GROUP BY customer_id, deductible
    )

SELECT *
FROM amount_paid_by_year
