SELECT SPRIDEN.SPRIDEN_PIDM AS PIDM_IND,
       CASE
          WHEN     DSD_STUDENT_DEMOG_OPEN.UAR_RACE LIKE 'A%'
               AND DSD_STUDENT_DEMOG_OPEN.ipeds_race LIKE '2%'
          THEN
             6                                     --'Alaska Native Multirace'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = '2RACE'
          THEN
             6                                      --'Non Hispanic Multirace'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race IN ('AA',
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
             1                                               --'Alaska Native'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = 'BL'
          THEN
             3                                            --'African American'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = 'IN'
          THEN
             1                                             --'American Indian'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = 'NH'
          THEN
             4                                     --'Native Hawaiian/Pac Is.'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = 'SI'
          THEN
             2                                                       --'Asian'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = 'HISPA'
          THEN
             0                                                    --'Hispanic'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = 'WH'
          THEN
             5                                                       --'White'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = '2HISP'
          THEN
             6                                          --'Hispanic Multirace'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race IN ('2LIEN', 'ALIEN')
          THEN
             7                                          --'Non Resident Alien'
          WHEN DSD_STUDENT_DEMOG_OPEN.ipeds_race = 'UN'
          THEN
             8                                                     --'Unknown'
          ELSE
             8
       END
          AS "RaceEthnicity",
       CASE
          WHEN DSD_STUDENT_DEMOG_OPEN.RESIDENCY_CODE = 'I' THEN 1
          ELSE 0
       END
          AS "InternationalStudent"
  FROM REPORTS.ENROLLED_STUDENTS_BY_TERM ENROLLED_STUDENTS_BY_TERM
       LEFT JOIN SATURN.SPRIDEN SPRIDEN
          ON     SPRIDEN.SPRIDEN_ID = ENROLLED_STUDENTS_BY_TERM.STUDENT_ID
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
       LEFT JOIN DSDMGR.DSD_STUDENT_DEMOG_OPEN DSD_STUDENT_DEMOG_OPEN
          ON     DSD_STUDENT_DEMOG_OPEN.TERM_CODE = :term_code
             AND DSD_STUDENT_DEMOG_OPEN.STUDENT_PIDM = spriden.SPRIDEN_PIDM
 WHERE     1 = 1
       AND ENROLLED_STUDENTS_BY_TERM.TERM_CODE = :term_code
       AND enrolled_students_by_term.CLASS_STANDING IN ('FR',
                                                        'JR',
                                                        'ND',
                                                        'PD',
                                                        'SO',
                                                        'SR')
       AND ENROLLED_STUDENTS_BY_TERM.PRIMARY_DEGREE_CAMPUS = 'A'
