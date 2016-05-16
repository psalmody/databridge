SELECT REG.STUDENT_PIDM AS PIDM_IND,
       SUM (REG.CREDIT_ATTEMPTED) AS CREDITS
  FROM DSDMGR.DSD_REGISTRATION_OPEN REG
       INNER JOIN DSDMGR.DSD_STUDENT_STATS_OPEN STUD
          ON     REG.STUDENT_PIDM = STUD.STUDENT_PIDM
             AND REG.TERM_CODE = STUD.TERM_CODE
             AND STUD.ACADEMIC_ORGANIZATION = 'AC'
 WHERE     1 = 1
       AND REG.TERM_CODE = :current_term
       AND REG.CREDIT_ENR = 'Y'
       AND (   TO_NUMBER (REGEXP_REPLACE (REG.COURSE_NUMBER, '[^0-9]+', '')) BETWEEN 100
                                                                                 AND 499
            OR TO_NUMBER (REGEXP_REPLACE (REG.COURSE_NUMBER, '[^0-9]+', '')) BETWEEN 500
                                                                                 AND 599)
       AND REG.REGISTRATION_STATUS NOT IN ('AU', 'FW')
       AND REG.REGISTRATION_STATUS NOT LIKE 'W%'
GROUP BY REG.STUDENT_PIDM
