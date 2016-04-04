WITH max_terms
        AS (SELECT RORSAPR_PIDM PIDM, MAX (RORSAPR_TERM_CODE) TERM_CODE
              FROM RORSAPR_A
            GROUP BY RORSAPR_PIDM)
SELECT RORSAPR_PIDM PIDM_IND, RORSAPR_SAPR_CODE SAPR_CODE, RTVSAPR.RTVSAPR_DESC
  FROM RORSAPR_A
       INNER JOIN max_terms
          ON     max_terms.pidm = RORSAPR_A.RORSAPR_PIDM
             AND max_terms.TERM_CODE = RORSAPR_A.RORSAPR_TERM_CODE
       LEFT JOIN FAIAMGR.RTVSAPR RTVSAPR
          ON RORSAPR_A.RORSAPR_SAPR_CODE = RTVSAPR.RTVSAPR_CODE
       LEFT JOIN spriden
          ON     spriden.spriden_pidm = RORSAPR_A.RORSAPR_PIDM
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
       INNER JOIN ENROLLED_STUDENTS_BY_TERM
          ON     1 = 1
             AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
             AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                              'JR',
                                                              'ND',
                                                              'PD',
                                                              'SO',
                                                              'SR')
             AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
             AND SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
 WHERE RTVSAPR.RTVSAPR_DISB_IND = 'Y'          --Y means blocking disbursement
