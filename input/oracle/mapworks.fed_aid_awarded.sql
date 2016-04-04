SELECT DISTINCT RPRAWRD_A.RPRAWRD_PIDM AS PIDM_IND
  FROM RPRAWRD_A
       INNER JOIN RFRBASE_A
          ON RPRAWRD_A.RPRAWRD_FUND_CODE = RFRBASE_A.RFRBASE_FUND_CODE
 WHERE     RPRAWRD_AIDY_CODE =
              CASE
                 WHEN :current_term LIKE '%01'
                 THEN
                    (   TO_CHAR (SUBSTR ( :current_term, 3, 2)) - 1
                     || SUBSTR ( :current_term, 3, 2))
                 WHEN :current_term LIKE '%03'
                 THEN
                    (   SUBSTR ( :current_term, 3, 2)
                     || TO_CHAR (SUBSTR ( :current_term, 3, 2) + 1))
                 ELSE
                    NULL
              END
       AND RFRBASE_A.RFRBASE_FSRC_CODE = 'FED'
       AND RPRAWRD_A.RPRAWRD_PAID_AMT > 0
