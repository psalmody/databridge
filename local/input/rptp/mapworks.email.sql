WITH PRIM_EMAL
        AS (SELECT GOREMAL.GOREMAL_EMAIL_ADDRESS, GOREMAL.GOREMAL_PIDM
              FROM GOREMAL
             WHERE     GOREMAL.GOREMAL_PREFERRED_IND = 'Y'
                   AND GOREMAL_STATUS_IND = 'A'),
     AGEN_EMAL
        AS (SELECT GOREMAL.GOREMAL_EMAIL_ADDRESS, GOREMAL.GOREMAL_PIDM
              FROM goremal
             WHERE     GOREMAL.GOREMAL_EMAL_CODE = 'AGEN'
                   AND GOREMAL.GOREMAL_STATUS_IND = 'A')
SELECT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND,
       PRIM_EMAL.GOREMAL_EMAIL_ADDRESS AS EMAIL_PRIMARY,
       AGEN_EMAL.GOREMAL_EMAIL_ADDRESS AS EMAIL_ALT
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
       LEFT JOIN PRIM_EMAL ON PRIM_EMAL.GOREMAL_PIDM = SPRIDEN.SPRIDEN_PIDM
       LEFT JOIN AGEN_EMAL ON AGEN_EMAL.GOREMAL_PIDM = SPRIDEN.SPRIDEN_PIDM
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
