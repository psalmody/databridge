SELECT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND,
       SPRADDR_CURRENT.SPRADDR_STREET_LINE1 AS "Address1",
       TRIM (
             SPRADDR_CURRENT.SPRADDR_STREET_LINE2
          || ' '
          || SPRADDR_CURRENT.SPRADDR_STREET_LINE3)
          AS "Address2",
       SPRADDR_CURRENT.SPRADDR_CITY AS "City",
       SPRADDR_CURRENT.SPRADDR_ZIP AS "Zip",
       SPRADDR_CURRENT.SPRADDR_STAT_CODE AS "State",
       SPRADDR_CURRENT.SPRADDR_CNTY_CODE AS "Country"
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
       LEFT JOIN SPRADDR_CURRENT
          ON     SPRADDR_CURRENT.SPRADDR_PIDM = SPRIDEN.SPRIDEN_PIDM
             AND SPRADDR_CURRENT.SPRADDR_ATYP_CODE = 'MA'
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
