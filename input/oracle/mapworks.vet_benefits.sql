/* certified military benefits for credits */
SELECT DISTINCT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
       INNER JOIN SGRVETN
          ON     SGRVETN.SGRVETN_PIDM = SPRIDEN.SPRIDEN_PIDM
             AND SGRVETN.SGRVETN_CERT_HOURS > 0
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
UNION
/* resident tuition because of military/veteran status */
SELECT DISTINCT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
       INNER JOIN SGBSTDN
          ON     SGBSTDN.SGBSTDN_PIDM = SPRIDEN.SPRIDEN_PIDM
             AND SGBSTDN.SGBSTDN_RESD_CODE IN ('M', 'V')
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
UNION
/* tuition assistance (active military) */
SELECT DISTINCT TBRACCD.TBRACCD_PIDM AS PIDM_IND
  FROM TAISMGR.TBRACCD TBRACCD
 WHERE TBRACCD.TBRACCD_DETAIL_CODE IN ('A33V',
                                       'P33V',
                                       'D33V',
                                       'V33V',
                                       'I33V')
