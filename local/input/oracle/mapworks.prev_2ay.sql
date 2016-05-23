SELECT DISTINCT STUDENT_PIDM PIDM_IND
  FROM DSDMGR.DSD_REGISTRATION
 WHERE     MAU = 'UAA'
       AND ACADEMIC_ORGANIZATION = 'AC'
       AND CAMPUS_CODE = 'A'
       AND CREDIT_ENR = 'Y'
       AND TERM_CODE BETWEEN (CASE
                                 WHEN :current_term LIKE '%01'
                                 THEN
                                    :current_term - 298
                                 WHEN :current_term LIKE '%03'
                                 THEN
                                    :current_term - 200
                                 ELSE
                                    NULL
                              END)
                         AND (CASE
                                 WHEN :current_term LIKE '%01'
                                 THEN
                                    :current_term - 100
                                 WHEN :current_term LIKE '%03'
                                 THEN
                                    :current_term - 102
                                 ELSE
                                    NULL
                              END)
