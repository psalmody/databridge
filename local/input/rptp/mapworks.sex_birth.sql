SELECT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND,
       TO_CHAR (SPBPERS.SPBPERS_BIRTH_DATE, 'YYYY') AS "BirthYear",
       SPBPERS.SPBPERS_SEX,
       SPBPERS.SPBPERS_CONFID_IND as SPBPERS_CONFID
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
       LEFT JOIN SPBPERS ON spriden.SPRIDEN_PIDM = SPBPERS.SPBPERS_PIDM
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
