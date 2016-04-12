/**
 *
 * Targeted sumer grant expenditure students
 *
 * 2016-04-11 Michael A Smith michael@uaa.alaska.edu
 *
 * 
 * Run time: approximately 1 minute
 * 
 */

WITH CUM
        AS (SELECT S1.SHRTGPA_PIDM AS PIDM,
                   S1.SHRTGPA_LEVL_CODE AS LVL,
                   SUM (S1.SHRTGPA_HOURS_EARNED) AS CUMULATIVE_CREDITS,
                   CASE
                      WHEN SUM (S1.SHRTGPA_GPA_HOURS) = 0
                      THEN
                         NULL
                      ELSE
                         ROUND (
                              SUM (S1.SHRTGPA_QUALITY_POINTS)
                            / SUM (S1.SHRTGPA_GPA_HOURS),
                            2)
                   END
                      AS CUMULATIVE_GPA
              FROM SHRTGPA S1
             WHERE S1.SHRTGPA_LEVL_CODE IN ('UA', 'UV')
            GROUP BY S1.SHRTGPA_PIDM, S1.SHRTGPA_LEVL_CODE),
     PELL
        AS (SELECT RCRAPP1.RCRAPP1_PIDM AS PIDM,
                   TO_CHAR (RCRAPP2.RCRAPP2_PELL_PGI) AS PELL_PGI,
                   TO_CHAR (RORSTAT.RORSTAT_UNMET_NEED) AS UNMET_NEED
              FROM FAIAMGR.RCRAPP2 RCRAPP2
                   INNER JOIN FAIAMGR.RCRAPP1 RCRAPP1
                      ON     RCRAPP2.RCRAPP2_AIDY_CODE =
                                RCRAPP1.RCRAPP1_AIDY_CODE
                         AND RCRAPP2.RCRAPP2_PIDM = RCRAPP1.RCRAPP1_PIDM
                         AND RCRAPP2.RCRAPP2_INFC_CODE =
                                RCRAPP1.RCRAPP1_INFC_CODE
                         AND RCRAPP2.RCRAPP2_SEQ_NO = RCRAPP1.RCRAPP1_SEQ_NO
                   INNER JOIN FAIAMGR.RORSTAT RORSTAT
                      ON     RORSTAT.RORSTAT_AIDY_CODE =
                                RCRAPP1.RCRAPP1_AIDY_CODE
                         AND RORSTAT.RORSTAT_PIDM = RCRAPP1.RCRAPP1_PIDM
             WHERE     RCRAPP1.RCRAPP1_AIDY_CODE = 1516
                   AND RCRAPP1.RCRAPP1_CURR_REC_IND = 'Y'
                   AND RCRAPP1.RCRAPP1_INFC_CODE = 'EDE')
SELECT DISTINCT
       STATS.STUDENT_ID,
       STATS.STUDENT_PIDM,
       STATS.HOME_CAMPUS,
       STATS.MAU_CLASS_STAND,
       FALL_GPA.SHRTGPA_HOURS_EARNED AS FALL_15_HOURS_EARNED,
       SPRING_GPA.SHRTGPA_HOURS_EARNED AS SPRING_16_HOURS_EARNED,
       (SELECT SUM (CLASS_LIST.CRN_CREDIT_HOURS)
          FROM CLASS_LIST
         WHERE     CLASS_LIST.STUDENT_ID = STATS.STUDENT_ID
               AND CLASS_LIST.TERM_CODE = 201602
               AND CLASS_LIST.REGISTRATION_STATUS = 'Enrolled')
          SUMMER_HRS_ENROLLED,
       CUM.CUMULATIVE_CREDITS,
       CUM.CUMULATIVE_GPA,
       (SELECT DISTINCT V1.RTVSAPR_DESC
          FROM RORSAPR_A T1
               LEFT JOIN RTVSAPR_A V1
                  ON T1.RORSAPR_SAPR_CODE = V1.RTVSAPR_CODE
         WHERE     1 = 1
               AND T1.RORSAPR_TERM_CODE =
                      (SELECT MAX (T2.RORSAPR_TERM_CODE)
                         FROM RORSAPR_A T2
                        WHERE T2.RORSAPR_PIDM = T1.RORSAPR_PIDM)
               AND T1.RORSAPR_ACTIVITY_DATE =
                      (SELECT MAX (T2.RORSAPR_ACTIVITY_DATE)
                         FROM RORSAPR_A T2
                        WHERE T2.RORSAPR_PIDM = T1.RORSAPR_PIDM)
               AND T1.RORSAPR_PIDM = REQ.RRRAREQ_PIDM)
          AS MAX_SAP,
       CASE WHEN APS.RPRAWRD_PIDM IS NOT NULL THEN 'Y' ELSE 'N' END
          AS RCVD_APS,
       CASE WHEN UAS.RPRAWRD_PIDM IS NOT NULL THEN 'Y' ELSE 'N' END
          AS RCVD_UAS,
       PELL.PELL_PGI,
       PELL.UNMET_NEED
  FROM RRRAREQ_A REQ
       INNER JOIN DSDMGR.DSD_STUDENT_STATS_OPEN STATS
          ON     STATS.STUDENT_PIDM = REQ.RRRAREQ_PIDM
             AND STATS.TERM_CODE = 201601
             AND STATS.MAU = 'UAA'
             AND STATS.MAU_CLASS_STAND IN ('FF',
                                           'FR',
                                           'SO',
                                           'JR',
                                           'SR')
       LEFT JOIN SHRTGPA FALL_GPA
          ON     FALL_GPA.SHRTGPA_TERM_CODE = 201503
             AND FALL_GPA.SHRTGPA_LEVL_CODE IN ('UA', 'UV')
             AND FALL_GPA.SHRTGPA_GPA_TYPE_IND = 'I'
             AND FALL_GPA.SHRTGPA_PIDM = REQ.RRRAREQ_PIDM
       LEFT JOIN SHRTGPA SPRING_GPA
          ON     SPRING_GPA.SHRTGPA_TERM_CODE = STATS.TERM_CODE
             AND SPRING_GPA.SHRTGPA_LEVL_CODE IN ('UA', 'UV')
             AND SPRING_GPA.SHRTGPA_GPA_TYPE_IND = 'I'
             AND REQ.RRRAREQ_PIDM = SPRING_GPA.SHRTGPA_PIDM
       LEFT JOIN CUM
          ON     CUM.PIDM = REQ.RRRAREQ_PIDM
             AND CUM.LVL =
                    CASE WHEN STATS.HOME_CAMPUS = 'V' THEN 'UV' ELSE 'UA' END
       LEFT JOIN RPRAWRD_A APS
          ON     APS.RPRAWRD_PIDM = REQ.RRRAREQ_PIDM
             AND APS.RPRAWRD_FUND_CODE = 'AAPS'
             AND APS.RPRAWRD_PAID_AMT > 0
             AND APS.RPRAWRD_AIDY_CODE = REQ.RRRAREQ_AIDY_CODE
       LEFT JOIN RPRAWRD_A UAS
          ON     UAS.RPRAWRD_PIDM = REQ.RRRAREQ_PIDM
             AND UAS.RPRAWRD_FUND_CODE = 'AASP6'
             AND UAS.RPRAWRD_AIDY_CODE = REQ.RRRAREQ_AIDY_CODE
             AND UAS.RPRAWRD_PAID_AMT > 0
       LEFT JOIN PELL ON PELL.PIDM = REQ.RRRAREQ_PIDM
 WHERE     REQ.RRRAREQ_TREQ_CODE = 'FAFSA'
       AND REQ.RRRAREQ_TRST_CODE = 'S'
       AND REQ.RRRAREQ_AIDY_CODE = 1516

/* -- end -- */