WITH T1
       AS (SELECT SCBCRSE.SCBCRSE_SUBJ_CODE,
                  SCBCRSE.SCBCRSE_CRSE_NUMB,
                  MAX(SCBCRSE.SCBCRSE_EFF_TERM) AS TERM_CODE
             FROM SCBCRSE
            WHERE     SCBCRSE.SCBCRSE_CRSE_NUMB LIKE 'A%'
                  AND SCBCRSE.SCBCRSE_EFF_TERM <= :current_term
           GROUP BY SCBCRSE.SCBCRSE_SUBJ_CODE, SCBCRSE.SCBCRSE_CRSE_NUMB),
     COURSES
       AS (SELECT SCBCRSE.SCBCRSE_SUBJ_CODE,
                  SCBCRSE.SCBCRSE_CRSE_NUMB,
                  SCBCRSE.SCBCRSE_EFF_TERM,
                  SCBCRSE.SCBCRSE_COLL_CODE,
                  SCBCRSE.SCBCRSE_DIVS_CODE,
                  SCBCRSE.SCBCRSE_DEPT_CODE,
                  SCBCRSE.SCBCRSE_CSTA_CODE,
                  SCBCRSE.SCBCRSE_TITLE,
                  SCBCRSE.SCBCRSE_CREDIT_HR_IND,
                  SCBCRSE.SCBCRSE_CREDIT_HR_LOW,
                  SCBCRSE.SCBCRSE_CREDIT_HR_HIGH
             FROM SCBCRSE
                  INNER JOIN T1
                    ON     T1.SCBCRSE_SUBJ_CODE = SCBCRSE.SCBCRSE_SUBJ_CODE
                       AND T1.SCBCRSE_CRSE_NUMB = SCBCRSE.SCBCRSE_CRSE_NUMB
                       AND T1.TERM_CODE = SCBCRSE.SCBCRSE_EFF_TERM
            WHERE SCBCRSE.SCBCRSE_CRSE_NUMB LIKE 'A%'),
     TXT1
       AS (SELECT TRIM(REPLACE(TEXTT1.SCRTEXT_TEXT, 'T1#', '')) AS T1,
                  TEXTT1.SCRTEXT_SUBJ_CODE,
                  TEXTT1.SCRTEXT_CRSE_NUMB
             FROM SCRTEXT TEXTT1
            WHERE     TEXTT1.SCRTEXT_CRSE_NUMB LIKE 'A%'
                  AND TEXTT1.SCRTEXT_TEXT LIKE 'T1%'
                  AND TEXTT1.SCRTEXT_EFF_TERM =
                        (SELECT MAX(SCRTEXT2.SCRTEXT_EFF_TERM)
                           FROM SCRTEXT SCRTEXT2
                          WHERE     SCRTEXT2.SCRTEXT_SUBJ_CODE = TEXTT1.SCRTEXT_SUBJ_CODE
                                AND SCRTEXT2.SCRTEXT_CRSE_NUMB = TEXTT1.SCRTEXT_CRSE_NUMB)),
     TXT2
       AS (SELECT TRIM(REPLACE(TEXTT2.SCRTEXT_TEXT, 'T2#', '')) AS T2,
                  TEXTT2.SCRTEXT_SUBJ_CODE,
                  TEXTT2.SCRTEXT_CRSE_NUMB
             FROM SCRTEXT TEXTT2
            WHERE     TEXTT2.SCRTEXT_CRSE_NUMB LIKE 'A%'
                  AND TEXTT2.SCRTEXT_TEXT LIKE 'T2%'
                  AND TEXTT2.SCRTEXT_EFF_TERM =
                        (SELECT MAX(SCRTEXT2.SCRTEXT_EFF_TERM)
                           FROM SCRTEXT SCRTEXT2
                          WHERE     SCRTEXT2.SCRTEXT_SUBJ_CODE = TEXTT2.SCRTEXT_SUBJ_CODE
                                AND SCRTEXT2.SCRTEXT_CRSE_NUMB = TEXTT2.SCRTEXT_CRSE_NUMB)),
     SECTS
       AS (SELECT SSBSECT.SSBSECT_TERM_CODE,
                  SSBSECT.SSBSECT_CRN,
                  SSBSECT.SSBSECT_SUBJ_CODE,
                  SSBSECT.SSBSECT_CRSE_NUMB,
                  SSBSECT.SSBSECT_SEQ_NUMB,
                  SSBSECT.SSBSECT_CAMP_CODE,
                  SSBSECT.SSBSECT_CREDIT_HRS,
                  SSBSECT.SSBSECT_SSTS_CODE
             FROM SSBSECT
            WHERE     SSBSECT_TERM_CODE = :current_term
                  AND (   SSBSECT_SUBJ_CODE = 'PRPE'
                       OR (    SSBSECT_SUBJ_CODE = 'GUID'
                           AND SSBSECT_CRSE_NUMB = 'A150')
                       OR (    SSBSECT_SUBJ_CODE = 'MATH'
                           AND REGEXP_REPLACE(SSBSECT_CRSE_NUMB, '[^0-9]+', '') < 121))
                  AND SSBSECT.SSBSECT_CAMP_CODE = 'A'
                  AND SSBSECT.SSBSECT_CRSE_NUMB LIKE 'A%'
                  AND SSBSECT.SSBSECT_SSTS_CODE = 'A'
                  AND SSBSECT.SSBSECT_SEQ_NUMB NOT LIKE '_M_')
SELECT (   '20'
        || CASE
             WHEN :current_term LIKE '%01' THEN
               CONCAT(SUBSTR( :current_term, 3, 2) - 1, SUBSTR( :current_term, 3, 2))
             WHEN :current_term LIKE '%03' THEN
               CONCAT(SUBSTR( :current_term, 3, 2), SUBSTR( :current_term, 3, 2) + 1)
             ELSE
               NULL
           END)
         AS "YearId",
       SECTS.SSBSECT_TERM_CODE AS "TermId",
       (SECTS.SSBSECT_TERM_CODE || SECTS.SSBSECT_CRN) AS "UniqueCourseSectionId",
       SECTS.SSBSECT_SUBJ_CODE AS "SubjectCode",
       SECTS.SSBSECT_CRSE_NUMB AS "CourseNumber",
       SECTS.SSBSECT_SEQ_NUMB AS "SectionNumber",
       TRIM(TXT1.T1 || ' ' || TXT2.T2) AS "CourseName",
          COURSES.SCBCRSE_CREDIT_HR_LOW
       || ' '
       || REPLACE(REPLACE(COURSES.SCBCRSE_CREDIT_HR_IND, 'TO', '-'), 'OR', 'or')
       || ' '
       || COURSES.SCBCRSE_CREDIT_HR_HIGH
         AS "CreditHours",
       COURSES.SCBCRSE_COLL_CODE AS "CollegeCode",
       COURSES.SCBCRSE_DEPT_CODE AS "DeptCode"
  FROM SECTS
       LEFT JOIN COURSES
         ON     COURSES.SCBCRSE_CRSE_NUMB = SECTS.SSBSECT_CRSE_NUMB
            AND COURSES.SCBCRSE_SUBJ_CODE = SECTS.SSBSECT_SUBJ_CODE
       LEFT JOIN TXT1
         ON     TXT1.SCRTEXT_SUBJ_CODE = SECTS.SSBSECT_SUBJ_CODE
            AND TXT1.SCRTEXT_CRSE_NUMB = SECTS.SSBSECT_CRSE_NUMB
       LEFT JOIN TXT2
         ON     TXT2.SCRTEXT_SUBJ_CODE = SECTS.SSBSECT_SUBJ_CODE
            AND TXT2.SCRTEXT_CRSE_NUMB = SECTS.SSBSECT_CRSE_NUMB
       