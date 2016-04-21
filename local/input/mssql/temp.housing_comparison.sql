WITH CUM_CREDITS
        AS (SELECT S1.STUDENT_PIDM,
                   SUM (CAST (S1.CREDIT_HOURS AS NUMERIC (6, 2))) CREDITS
              FROM RPTP.dsdmgr.dsd_student_statistics S1
             WHERE 1 = 1 AND S1.TERM_CODE < :term_code
            GROUP BY S1.STUDENT_PIDM)
SELECT DISTINCT
       STATS.STUDENT_ID,
       STATS.CREDIT_HOURS,
       CASE WHEN HOUSING.StudentNumber IS NOT NULL THEN 'Y' ELSE 'N' END
          AS [On campus],
       SHRTGPA.GPA,
       STUDENT.BIRTH_DATE
  FROM rptp.dsdmgr.dsd_student_statistics STATS
       LEFT JOIN csv.dbo.housing_fall_2015 HOUSING
          ON STATS.STUDENT_ID = HOUSING.StudentNumber
       LEFT JOIN rptp.dbo.shrtgpa SHRTGPA
          ON     STATS.TERM_CODE = SHRTGPA.TERM_CODE
             AND SHRTGPA.PIDM = STATS.STUDENT_PIDM
             AND SHRTGPA.LEVL_CODE =
                    CASE
                       WHEN STATS.AO_CLASS_STAND LIKE 'G%' THEN 'GA'
                       ELSE 'UA'
                    END
       INNER JOIN CUM_CREDITS
          ON     CUM_CREDITS.STUDENT_PIDM = STATS.STUDENT_PIDM
             AND CUM_CREDITS.CREDITS < 30.0
       LEFT JOIN rptp.dsdmgr.dsd_student STUDENT
          ON     STUDENT.STUDENT_PIDM = STATS.STUDENT_PIDM
             AND STUDENT.TERM_CODE = STATS.TERM_CODE
 WHERE     STATS.TERM_CODE = :term_code
       AND STATS.ACADEMIC_ORGANIZATION = 'AC'
       AND cast (STATS.CREDIT_HOURS AS NUMERIC (6, 2)) >= 9.0