WITH LRESD
        AS (SELECT MAX (sgbstdn.SGBSTDN_TERM_CODE_EFF) TERM_CODE,
                   SGBSTDN.SGBSTDN_PIDM PIDM
              FROM SATURN.SGBSTDN SGBSTDN
             WHERE     1 = 1
                   AND SGBSTDN.SGBSTDN_CAMP_CODE = 'A'
                   AND SGBSTDN.SGBSTDN_TERM_CODE_EFF <= :current_term
            GROUP BY SGBSTDN_PIDM)
-- pulls pidm for students considered residents by tuition rate
SELECT SPRIDEN.SPRIDEN_ID AS STUDENT_ID_IND /*, SGBSTDN.SGBSTDN_LEVL_CODE as LEVL*/
  FROM SATURN.SGBSTDN SGBSTDN
       INNER JOIN LRESD
          ON     LRESD.PIDM = SGBSTDN.SGBSTDN_PIDM
             AND LRESD.TERM_CODE = SGBSTDN.SGBSTDN_TERM_CODE_EFF
       LEFT JOIN SPRIDEN
          ON     SPRIDEN.SPRIDEN_PIDM = SGBSTDN.SGBSTDN_PIDM
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
 WHERE     1 = 1
       AND SGBSTDN.SGBSTDN_CAMP_CODE = 'A'
       AND SGBSTDN.SGBSTDN_LEVL_CODE = 'UA'
       AND (   SGBSTDN.SGBSTDN_RESD_CODE IN ('R',
                                             'M',
                                             'V',
                                             'S',
                                             'E',
                                             'A',
                                             'U')
            -- per financial services, either one of those
            --   resd codes, or the rate is overried by rate_code
            OR SGBSTDN.SGBSTDN_RATE_CODE IN ('CHAK', 'NSEIB'))