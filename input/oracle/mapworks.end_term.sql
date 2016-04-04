WITH cumcredits
        AS (SELECT DISTINCT
                   REG.STUDENT_PIDM AS PIDM,
                   SUM (REG.CREDIT_ATTEMPTED) AS CREDITS
              FROM DSDMGR.DSD_REGISTRATION REG
                   INNER JOIN DSDMGR.DSD_STUDENT_STATISTICS STUD
                      ON     REG.STUDENT_PIDM = STUD.STUDENT_PIDM
                         AND STUD.TERM_CODE = :current_term
                         AND STUD.ACADEMIC_ORGANIZATION = 'AC'
             WHERE     1 = 1
                   AND TO_NUMBER (
                          REGEXP_REPLACE (REG.COURSE_NUMBER, '[^0-9]+', '')) >=
                          100
                   AND REG.COURSE_NUMBER NOT LIKE 'A5%'
                   AND REG.OFFICIAL_GRADE IN ('A',
                                              'B',
                                              'C',
                                              'D',
                                              'P',
                                              'S')
                   AND REG.OFFICIAL_GRADE IS NOT NULL
                   AND REG.CREDIT_ENR = 'Y'
            GROUP BY REG.STUDENT_PIDM),
     cumrem
        AS (SELECT DISTINCT
                   REG.STUDENT_PIDM AS PIDM,
                   SUM (REG.CREDIT_ATTEMPTED) AS CREDITS
              FROM DSDMGR.DSD_REGISTRATION REG
                   INNER JOIN DSDMGR.DSD_STUDENT_STATISTICS STUD
                      ON     REG.STUDENT_PIDM = STUD.STUDENT_PIDM
                         AND STUD.TERM_CODE = :current_term
                         AND STUD.ACADEMIC_ORGANIZATION = 'AC'
             WHERE     1 = 1
                   AND TO_NUMBER (
                          REGEXP_REPLACE (REG.COURSE_NUMBER, '[^0-9]+', '')) BETWEEN 50
                                                                                 AND 99
                   AND REG.OFFICIAL_GRADE IN ('A',
                                              'B',
                                              'C',
                                              'D',
                                              'P',
                                              'S')
                   AND REG.OFFICIAL_GRADE IS NOT NULL
                   AND REG.CREDIT_ENR = 'Y'
            GROUP BY REG.STUDENT_PIDM)
SELECT SHRTGPA_PIDM AS PIDM_IND,
       SHRTGPA_GPA AS "EndTermGPA",
       SHRTGPA.SHRTGPA_HOURS_EARNED AS "EndTermCreditsEarned",
       SHRLGPA.SHRLGPA_GPA AS "EndTermCumGPA",
       cumcredits.CREDITS AS "EndTermCumCreditsEarned",
       cumrem.CREDITS AS "EndTermRemCredPass"
  FROM SHRTGPA
       INNER JOIN DSDMGR.DSD_STUDENT_STATISTICS STUD
          ON     SHRTGPA.SHRTGPA_PIDM = STUD.STUDENT_PIDM
             AND STUD.TERM_CODE = :current_term
             AND STUD.ACADEMIC_ORGANIZATION = 'AC'
       LEFT JOIN SHRLGPA
          ON     SHRTGPA.SHRTGPA_PIDM = SHRLGPA.SHRLGPA_PIDM
             AND SHRLGPA.SHRLGPA_LEVL_CODE = 'UA'
             AND SHRLGPA.SHRLGPA_GPA_TYPE_IND = 'O'
       LEFT JOIN cumcredits ON cumcredits.PIDM = SHRTGPA.SHRTGPA_PIDM
       LEFT JOIN cumrem ON cumrem.PIDM = SHRTGPA.SHRTGPA_PIDM
 WHERE     SHRTGPA_GPA_TYPE_IND = 'I'
       AND SHRTGPA_LEVL_CODE = 'UA'
       AND SHRTGPA_TERM_CODE = :current_term
