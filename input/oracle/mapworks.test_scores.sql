--LTD (Last Test Date): Last time each test was taken by each person

WITH LASTTESTDATE
        AS (SELECT SORTEST_PIDM AS LTD_PIDM,
                   SORTEST_TESC_CODE AS LTD_CODE,
                   MAX (SORTEST_TEST_DATE) AS LTD_DATE
              FROM SATURN.SORTEST SORTEST
            GROUP BY SORTEST_PIDM, SORTEST_TESC_CODE)
--TEST_SCORES (Last Test Score): Score of each test the last time it was taken by each person
SELECT DISTINCT
       LASTTESTDATE.LTD_PIDM AS LTS_PIDM_IND,
       LASTTESTDATE.LTD_CODE AS LTS_CODE_IND,
       SORTEST.SORTEST_TEST_SCORE AS LTS_SCORE
  FROM LASTTESTDATE
       INNER JOIN SATURN.SORTEST SORTEST
          ON     LASTTESTDATE.LTD_PIDM = SORTEST.SORTEST_PIDM
             AND LASTTESTDATE.LTD_CODE = SORTEST.SORTEST_TESC_CODE
             AND LASTTESTDATE.LTD_DATE = SORTEST.SORTEST_TEST_DATE
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_PIDM = SORTEST.SORTEST_PIDM
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
       INNER JOIN REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
          ON     1 = 1
             AND SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :current_term
             AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                              'JR',
                                                              'ND',
                                                              'PD',
                                                              'SO',
                                                              'SR')
             AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
