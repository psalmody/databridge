WITH REG_OPEN
        AS (SELECT DISTINCT OPEN_REG.STUDENT_PIDM
              FROM DSDMGR.DSD_REGISTRATION_OPEN OPEN_REG
             WHERE     OPEN_REG.MAU = 'UAA'
                   AND OPEN_REG.CAMPUS_CODE = 'A'
                   AND OPEN_REG.TERM_CODE = :current_term)
SELECT DISTINCT REG.STUDENT_PIDM, SUM (REG.CREDIT_ATTEMPTED) AS CREDITS
  FROM DSDMGR.DSD_REGISTRATION REG
 WHERE     REG.TERM_CODE <=
              TO_NUMBER (
                 CASE
                    WHEN :current_term LIKE '%01'
                    THEN
                       TO_CHAR ( :current_term - 100)
                    WHEN :current_term LIKE '%03'
                    THEN
                       TO_CHAR ( :current_term - 2)
                    ELSE
                       NULL
                 END)
       AND TO_NUMBER (REGEXP_REPLACE (REG.COURSE_NUMBER, '[^0-9]+', '')) BETWEEN 50
                                                                             AND 100
       AND REG.COURSE_NUMBER NOT LIKE 'A5%'
       AND REG.OFFICIAL_GRADE IN ('A',
                                  'B',
                                  'C',
                                  'D',
                                  'P',
                                  'S')
       AND REG.OFFICIAL_GRADE IS NOT NULL
       AND REG.CREDIT_ENR = 'Y'
       AND REG.STUDENT_PIDM IN (SELECT reg_open.student_pidm
                                  FROM REG_OPEN)
GROUP BY REG.STUDENT_PIDM
