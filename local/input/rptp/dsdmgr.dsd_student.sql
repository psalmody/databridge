SELECT STUDENT.TERM_CODE TERM_CODE_IND,
       STUDENT.STUDENT_PIDM PIDM_IND,
       STUDENT.FISCAL_YEAR,
       STUDENT.HOME_CAMPUS,
       STUDENT.STUDENT_ID STUDENT_ID_IND,
       STUDENT.ORIGIN_AT_ENTRY,
       STUDENT.ORIGIN_CITY,
       STUDENT.ORIGIN_STATE,
       STUDENT.ORIGIN_ZIP,
       STUDENT.ORIGIN_NATION,
       STUDENT.ORIGIN_SOURCE,
       STUDENT.RESIDENCY_STATUS,
       STUDENT.CITIZENSHIP_COUNTRY,
       STUDENT.FOREIGN_STUDENT,
       STUDENT.VISA_TYPE,
       STUDENT.GENDER,
       STUDENT.ETHNICITY_CODE,
       STUDENT.ETHNICITY_UAR,
       STUDENT.ETHNICITY_IPEDS,
       TO_CHAR (STUDENT.BIRTH_DATE, 'MM/DD/YYYY') AS BIRTH_DATE,
       STUDENT.STUDENT_AGE,
       STUDENT.MARITAL_STATUS
  FROM DSDMGR.DSD_STUDENT STUDENT
       INNER JOIN DSDMGR.DSD_STUDENT_STATISTICS STATS
          ON     STATS.STUDENT_PIDM = STUDENT.STUDENT_PIDM
             AND STATS.ACADEMIC_ORGANIZATION = 'AC'
             AND STATS.TERM_CODE = STUDENT.TERM_CODE
 WHERE 1 = 1 AND stats.FISCAL_YEAR > 2012 AND STATS.MAU = 'UAA'