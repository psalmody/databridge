SELECT DISTINCT STUDENT_PIDM PIDM_IND
  FROM DSDMGR.DSD_REGISTRATION
 WHERE     MAU = 'UAA'
       AND ACADEMIC_ORGANIZATION = 'AC'
       AND CAMPUS_CODE = 'A'
       AND CREDIT_ENR = 'Y'
       AND TERM_CODE =
              CASE
                 WHEN :current_term LIKE '%01' THEN :current_term - 98
                 ELSE NULL
              END
