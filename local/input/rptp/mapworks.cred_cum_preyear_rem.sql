SELECT DISTINCT
       REG.STUDENT_PIDM AS PIDM_IND, SUM (REG.CREDIT_ATTEMPTED) AS CREDITS
  FROM DSDMGR.DSD_REGISTRATION REG
       INNER JOIN DSDMGR.DSD_STUDENT_STATISTICS STUD
          ON     REG.STUDENT_PIDM = STUD.STUDENT_PIDM
             AND STUD.TERM_CODE = :current_term
             AND STUD.ACADEMIC_ORGANIZATION = 'AC'
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
       AND TO_NUMBER (REGEXP_REPLACE (REG.COURSE_NUMBER, '[^0-9]+', '')) between 50 and 99
       AND REG.OFFICIAL_GRADE IN ('A',
                                  'B',
                                  'C',
                                  'D',
                                  'P',
                                  'S')
       AND REG.OFFICIAL_GRADE IS NOT NULL
       AND REG.CREDIT_ENR = 'Y'
GROUP BY REG.STUDENT_PIDM
