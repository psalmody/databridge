/**
 *
 * Firs year housing student GPA, health fee
 *
 * 2016-02-11 Michael A Smith michael@uaa.alaska.edu
 *
 * Instructions: Run and enter term and fee detail code to check
 *
 * Run time: approximately 0:20
 *
 */

WITH cumcredits
        AS (SELECT SHRTGPA.SHRTGPA_PIDM,
                   SUM (SHRTGPA.SHRTGPA_HOURS_EARNED) HOURS_EARNED
              FROM shrtgpa
             WHERE     SHRTGPA.SHRTGPA_TERM_CODE <= :term_code
                   AND SHRTGPA.SHRTGPA_GPA_TYPE_IND = 'I'
                   AND SHRTGPA.SHRTGPA_LEVL_CODE IN ('UA', 'GA')
            GROUP BY shrtgpa.shrtgpa_pidm)
SELECT DISTINCT
       SHRTGPA.SHRTGPA_TERM_CODE TERM_CODE_IND,
       TO_NUMBER (spriden.spriden_id) "StudentID_IND",
       SHRTGPA.SHRTGPA_GPA "GPA",
       SHRTGPA.SHRTGPA_HOURS_ATTEMPTED "CreditsAttempted",
       SHRTGPA.SHRTGPA_HOURS_EARNED "CreditsEarned",
       SHRTGPA.SHRTGPA_GPA_HOURS "GPAHours",
       cumcredits.HOURS_EARNED AS "CumulativeHoursEarned",
       SHRTGPA.SHRTGPA_LEVL_CODE AS "Level",
       SPRIDEN.SPRIDEN_FIRST_NAME FIRSTNAME,
       SPRIDEN.SPRIDEN_LAST_NAME LASTNAME,
       STATS.HOME_CAMPUS,
       CASE
          WHEN STATS.MAU_FTPT LIKE 'P%' THEN 'Part-time'
          WHEN STATS.MAU_FTPT LIKE 'F%' THEN 'Full-time'
          ELSE NULL
       END
          AS FTPT,
       STATS.MAU_CLASS_STAND CLASS_STAND,
       DEMOG.GENDER,
       FLOOR (MONTHS_BETWEEN (SYSDATE, DEMOG.BIRTH_DATE) / 12) AS AGE,
       CASE
          WHEN DEMOG.UAR_RACE LIKE 'A%' AND DEMOG.ipeds_race LIKE '2%'
          THEN
             'Alaska Native Multirace'
          WHEN DEMOG.ipeds_race = '2RACE'
          THEN
             'Non Hispanic Multirace'
          WHEN DEMOG.ipeds_race IN ('AA',
                                    'AE',
                                    'AH',
                                    'AI',
                                    'AK',
                                    'AM',
                                    'AN',
                                    'AQ',
                                    'AS',
                                    'AT',
                                    'AY',
                                    'XX')
          THEN
             'Alaska Native'
          WHEN DEMOG.ipeds_race = 'BL'
          THEN
             'African American'
          WHEN DEMOG.ipeds_race = 'IN'
          THEN
             'American Indian'
          WHEN DEMOG.ipeds_race = 'NH'
          THEN
             'Native Hawaiian/Pac Is.'
          WHEN DEMOG.ipeds_race = 'SI'
          THEN
             'Asian'
          WHEN DEMOG.ipeds_race = 'HISPA'
          THEN
             'Hispanic'
          WHEN DEMOG.ipeds_race = 'WH'
          THEN
             'White'
          WHEN DEMOG.ipeds_race = '2HISP'
          THEN
             'Hispanic Multirace'
          WHEN DEMOG.ipeds_race IN ('2LIEN', 'ALIEN')
          THEN
             'Non Resident Alien'
          WHEN DEMOG.ipeds_race = 'UN'
          THEN
             'Unknown'
          ELSE
             'Unknown'
       END
          IPEDS_RACE_ETHNICITY
  FROM shrtgpa
       LEFT JOIN SPRIDEN
          ON     SHRTGPA.SHRTGPA_PIDM = SPRIDEN.SPRIDEN_PIDM
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
       LEFT JOIN cumcredits ON spriden.spriden_pidm = cumcredits.shrtgpa_pidm
       LEFT JOIN DSDMGR.DSD_STUDENT_DEMOG_CLOS DEMOG
          ON     SHRTGPA.SHRTGPA_PIDM = DEMOG.STUDENT_PIDM
             AND DEMOG.TERM_CODE = SHRTGPA.SHRTGPA_TERM_CODE
       INNER JOIN DSDMGR.DSD_STUDENT_STATISTICS STATS
          ON     STATS.STUDENT_PIDM = DEMOG.STUDENT_PIDM
             AND STATS.MAU = 'UAA'
             AND STATS.TERM_CODE = DEMOG.TERM_CODE
             AND STATS.HOME_CAMPUS = 'A'
 WHERE     1 = 1
       AND SHRTGPA.SHRTGPA_TERM_CODE = :term_code
       AND SHRTGPA.SHRTGPA_GPA_TYPE_IND = 'I'
       AND SHRTGPA.SHRTGPA_LEVL_CODE IN ('UA', 'GA')
       AND SHRTGPA.SHRTGPA_HOURS_ATTEMPTED > 0

/* -- end -- */