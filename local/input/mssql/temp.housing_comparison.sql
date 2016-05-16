WITH CUM_CREDITS
        AS (SELECT reg.STUDENT_PIDM,
                   SUM (CAST (reg.CREDIT_ATTEMPTED AS NUMERIC (6, 2)))
                      CREDITS
              FROM oracle.dsdmgr.dsd_registration reg
             WHERE     1 = 1
                   AND reg.TERM_CODE <= 201503
                   AND reg.CREDIT_ENR = 'Y'
                   AND REG.OFFICIAL_GRADE IN ('A',
                                              'B',
                                              'C',
                                              'D',
                                              'P',
                                              'S')
                   AND REG.OFFICIAL_GRADE IS NOT NULL
                   AND Left (
                          SubString (
                             REG.COURSE_NUMBER,
                             PatIndex ('%[0-9.-]%', REG.COURSE_NUMBER),
                             8000),
                            PatIndex (
                               '%[^0-9.-]%',
                                 SubString (
                                    REG.COURSE_NUMBER,
                                    PatIndex ('%[0-9.-]%', REG.COURSE_NUMBER),
                                    8000)
                               + 'X')
                          - 1) >= 100
                   AND REG.COURSE_NUMBER NOT LIKE 'A5%'
            GROUP BY reg.STUDENT_PIDM)
SELECT DISTINCT
       STATS.STUDENT_ID,
       STATS.CREDIT_HOURS,
       SHRTGPA.HOURS_ATTEMPTED,
       SHRTGPA.HOURS_EARNED,
       SHRTGPA.G_HOURS,
       SHRTGPA.QUALITY_POINTS,
       CASE WHEN HOUSING.StudentNumber IS NOT NULL THEN 'Y' ELSE 'N' END
          AS [On campus],
       CASE
          WHEN CAST (SHRTGPA.G_HOURS AS NUMERIC (6, 2)) <> 0.0
          THEN
             SHRTGPA.GPA
          ELSE
             NULL
       END
          AS GPA,
       STUDENT.BIRTH_DATE BIRTH_DATE,
       CUM_CREDITS.CREDITS AS CUM_CREDITS
  FROM oracle.dsdmgr.dsd_student_statistics STATS
       LEFT JOIN csv.dbo.housing_fall_2015 HOUSING
          ON STATS.STUDENT_ID = HOUSING.StudentNumber
       LEFT JOIN oracle.dbo.shrtgpa SHRTGPA
          ON     STATS.TERM_CODE = SHRTGPA.TERM_CODE
             AND SHRTGPA.PIDM = STATS.STUDENT_PIDM
             AND SHRTGPA.LEVL_CODE = 'UA'
       INNER JOIN CUM_CREDITS
          --LEFT JOIN CUM_CREDITS
          ON     CUM_CREDITS.STUDENT_PIDM = STATS.STUDENT_PIDM
             AND CUM_CREDITS.CREDITS < 30.0
       INNER JOIN (SELECT STUDENT_PIDM
                     FROM oracle.dsdmgr.dsd_student_statistics s2
                    WHERE 1 = 1 AND s2.AO_CLASS_STAND = 'FF') FF
          ON FF.STUDENT_PIDM = STATS.STUDENT_PIDM
       LEFT JOIN oracle.dsdmgr.dsd_student STUDENT
          ON     STUDENT.STUDENT_ID = STATS.STUDENT_ID
             AND STUDENT.TERM_CODE = STATS.TERM_CODE
 WHERE     1 = 1
       AND STATS.TERM_CODE = 201503
       AND STATS.ACADEMIC_ORGANIZATION = 'AC'
       AND cast (STATS.CREDIT_HOURS AS NUMERIC (6, 2)) >= 9.0
--AND HOUSING.StudentNumber is not null
--AND STATS.AO_CLASS_STAND NOT IN ('FG', 'GM', 'GD')
--AND STATS.AO_CLASS_STAND = 'FF'