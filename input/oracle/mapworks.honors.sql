WITH lsgrsatt
        AS (SELECT SGRSATT.SGRSATT_PIDM,
                   MAX (SGRSATT_TERM_CODE_EFF) AS TERM_CODE
              FROM SGRSATT
            GROUP BY SGRSATT.SGRSATT_PIDM)
SELECT DISTINCT SGRSATT.SGRSATT_PIDM AS PIDM_IND
  FROM SGRSATT
       INNER JOIN lsgrsatt
          ON     SGRSATT.SGRSATT_PIDM = lsgrsatt.SGRSATT_PIDM
             AND SGRSATT.SGRSATT_TERM_CODE_EFF = lsgrsatt.TERM_CODE
 WHERE SGRSATT.SGRSATT_ATTS_CODE = 'AHNS'
