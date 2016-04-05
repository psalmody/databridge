SELECT DISTINCT
       DEMOG.TERM_CODE,
       STATS.STUDENT_ID UAID,
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
          IPEDS_RACE_ETHNICITY,
       CASE
          WHEN GOREMAL.GOREMAL_EMAIL_ADDRESS IS NULL
          THEN
             (DEMOG.UASUER_ID || '@alaska.edu')
          ELSE
             GOREMAL.GOREMAL_EMAIL_ADDRESS
       END
          AS PREFERRED_EMAIL
  FROM DSDMGR.DSD_STUDENT_DEMOG_OPEN DEMOG
       INNER JOIN DSDMGR.DSD_STUDENT_STATS_OPEN STATS
          ON     DEMOG.STUDENT_PIDM = STATS.STUDENT_PIDM
             AND DEMOG.TERM_CODE = STATS.TERM_CODE
             AND STATS.MAU = 'UAA'
       LEFT JOIN SPRIDEN
          ON     SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND DEMOG.STUDENT_PIDM = SPRIDEN.SPRIDEN_PIDM
       LEFT JOIN GOREMAL
          ON     GOREMAL.GOREMAL_PREFERRED_IND = 'Y'
             AND GOREMAL.GOREMAL_STATUS_IND = 'A'
             AND DEMOG.STUDENT_PIDM = GOREMAL.GOREMAL_PIDM
 WHERE DEMOG.TERM_CODE = :current_term