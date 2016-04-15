SELECT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND,
       CASE
          WHEN ROUND (
                  TO_NUMBER (TRIM (REPLACE (SORHSCH.SORHSCH_GPA, '..', '.'))),
                  2) > 5
          THEN
             NULL
          ELSE
             ROUND (
                TO_NUMBER (TRIM (REPLACE (SORHSCH.SORHSCH_GPA, '..', '.'))),
                2)
       END
          AS "HighSchoolGPA_DEC",
       ROUND (
          TO_NUMBER (TRIM (REPLACE (SORHSCH.SORHSCH_PERCENTILE, '..', '.'))),
          2)
          AS "HighSchoolPercentile_DEC",
       TO_CHAR (SORHSCH.SORHSCH_GRADUATION_DATE, 'YYYY')
          AS "HighSchoolGradYear"
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
       LEFT JOIN SORHSCH
          ON     SORHSCH.SORHSCH_PIDM = spriden.SPRIDEN_PIDM
             AND SORHSCH.SORHSCH_GRADUATION_DATE IS NOT NULL
             AND NOT REGEXP_LIKE (REPLACE (SORHSCH.SORHSCH_GPA, '.'),
                                  '[^0-9]')
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
