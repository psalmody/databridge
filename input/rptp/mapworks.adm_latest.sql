WITH LADM_LATEST
        AS (SELECT SARAPPD.SARAPPD_PIDM,
                   MAX (
                         SARAPPD_TERM_CODE_ENTRY
                      || SARAPPD_APPL_NO
                      || SARAPPD_SEQ_NO)
                      APPLICATION
              FROM SARAPPD
             WHERE     1 = 1
                   AND SARAPPD_APDC_CODE IN ('SC',
                                             'AC',
                                             'SB',
                                             'AP',
                                             'SP',
                                             'AD',
                                             'SD')
                   AND SARAPPD_TERM_CODE_ENTRY <= :current_term
            GROUP BY SARAPPD_PIDM)
SELECT SARADAP_TERM_CODE_ENTRY AS APPLICATION_TERM,
       SARADAP_CAMP_CODE AS CAMPUS_CODE,
       SARADAP_PIDM AS STUDENT_PIDM_IND,
       SPRIDEN.SPRIDEN_ID AS STUDENT_ID_IND,
       TO_CHAR (SARADAP_APPL_DATE, 'MM/DD/YYYY') AS APPLICATION_DATE,
       SARADAP_APST_CODE APPLICATIONS_STATUS,
       SARAPPD_APDC_CODE AS DECISION_CODE,
       STVAPDC_DESC AS DECISION_CODE_DESC,
       TO_CHAR (SARAPPD_APDC_DATE, 'MM/DD/YYYY') AS DECISION_DATE,
       SARADAP_ADMT_CODE AS ADMIT_TYPE,
       SARADAP_STYP_CODE AS STUDENT_TYPE,
       SARADAP_LEVL_CODE AS LEVEL_CODE,
       SARADAP_PROGRAM_1 AS PRIMARY_PROGRAM,
       E.STVCOLL_DESC AS PRIMARY_COLLEGE_DESC,
       SARADAP_MAJR_CODE_1 AS PRIMARY_MAJOR_1,
       SARADAP_RESD_CODE AS SARADAP_RESD_CODE
  FROM SARAPPD A
       LEFT JOIN SPRIDEN
          ON     SPRIDEN.SPRIDEN_PIDM = A.SARAPPD_PIDM
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
       INNER JOIN LADM_LATEST
          ON     1 = 1
             AND (A.SARAPPD_TERM_CODE_ENTRY || A.SARAPPD_APPL_NO || A.SARAPPD_SEQ_NO) =
                    LADM_LATEST.APPLICATION
             AND A.SARAPPD_PIDM = LADM_LATEST.SARAPPD_PIDM
       INNER JOIN SARADAP
          ON     SARADAP.SARADAP_TERM_CODE_ENTRY = A.SARAPPD_TERM_CODE_ENTRY
             AND A.SARAPPD_PIDM = SARADAP.SARADAP_PIDM
             AND A.SARAPPD_APPL_NO = SARADAP.SARADAP_APPL_NO
             AND SARADAP.SARADAP_CAMP_CODE = 'A'
       INNER JOIN REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
             AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                              'JR',
                                                              'ND',
                                                              'PD',
                                                              'SO',
                                                              'SR')
             AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
       LEFT JOIN STVCOLL E ON E.STVCOLL_CODE = SARADAP.SARADAP_COLL_CODE_1
       LEFT JOIN STVAPDC ON STVAPDC.STVAPDC_CODE = A.SARAPPD_APDC_CODE
