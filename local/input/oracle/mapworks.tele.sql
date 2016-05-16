WITH TELE
        AS (SELECT SPRTELE.SPRTELE_PIDM,
                   TRIM (
                         SPRTELE.SPRTELE_PHONE_AREA
                      || ' '
                      || SPRTELE.SPRTELE_PHONE_NUMBER)
                      AS PHONE
              FROM SPRTELE
             WHERE     1 = 1
                   AND SPRTELE.SPRTELE_TELE_CODE = 'CELL'
                   AND SPRTELE.SPRTELE_SEQNO =
                          (SELECT MAX (sprtele2.SPRTELE_SEQNO)
                             FROM sprtele sprtele2
                            WHERE     sprtele.sprtele_pidm =
                                         sprtele2.SPRTELE_PIDM
                                  AND sprtele2.sprtele_tele_code = 'CELL'))

SELECT DISTINCT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND, TELE.PHONE AS PHONE
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
       LEFT JOIN TELE ON tele.sprtele_pidm = SPRIDEN.SPRIDEN_PIDM
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
