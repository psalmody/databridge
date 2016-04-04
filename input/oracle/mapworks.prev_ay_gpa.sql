SELECT SHRTGPA.SHRTGPA_PIDM AS PIDM_IND,
       CASE
          WHEN SUM (SHRTGPA.SHRTGPA_QUALITY_POINTS) = 0
          THEN
             NULL
          ELSE
             ROUND (
                  SUM (SHRTGPA.SHRTGPA_QUALITY_POINTS * SHRTGPA.SHRTGPA_GPA)
                / SUM (SHRTGPA.SHRTGPA_QUALITY_POINTS),
                2)
       END
          AS GPA
  FROM SHRTGPA
       INNER JOIN DSDMGR.DSD_STUDENT_STATS_OPEN STUD
          ON     SHRTGPA.SHRTGPA_PIDM = STUD.STUDENT_PIDM
             AND STUD.TERM_CODE = :current_term
             AND STUD.ACADEMIC_ORGANIZATION = 'AC'
 WHERE     1 = 1
       AND SHRTGPA.SHRTGPA_GPA_TYPE_IND = 'I'
       AND SHRTGPA.SHRTGPA_LEVL_CODE = 'UA'
       AND SHRTGPA.SHRTGPA_TERM_CODE <=
              CASE
                 WHEN :current_term LIKE '%01' THEN TO_CHAR ( :current_term - 100)
                 WHEN :current_term LIKE '%03' THEN TO_CHAR ( :current_term - 2)
                 ELSE NULL
              END
GROUP BY SHRTGPA.SHRTGPA_PIDM
