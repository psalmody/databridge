--  Query uses the population of UAA students defined in the semester open DSD snapshot.
--Pulls basic info from the student statistics table (IDs, class
--standings, full-time/part-time status); demographic info from the
--demographic table; and information about the student's primary program from the
--curriculum table. Additional information is pulled directly from
--RPTP Banner tables - specifically, GPA and contact info. GPA and previous term enrolled
--are based on SHRTGPA (term GPA) records for the level of the student's
--primary program as recorded in the DSD curriculum table.
--  NOTE: if the opening freeze has not occurred yet, the query will
--retern no results



SELECT /*Determines how system imports data (Creates new user if Username field not currently in system)
       Choices - 'Update': changes blank or non-blank values for existing users with only non-blank values;
       'Append': changes only blank values for existing users with only non-blank values;
       'Overwrite': changes all values for existing users with all blank or non-blank values*/
--       CASE WHEN pop.STUDENT_PIDM IS NOT NULL THEN :Action ELSE NULL END
--          AS "Action",
       GOBTPAC_EXTERNAL_USER AS "Username",
       SPRIDEN_FIRST_NAME AS "FirstName",
       CASE
          WHEN SPBPERS_PREF_FIRST_NAME IS NULL THEN SPRIDEN_FIRST_NAME
          ELSE SPBPERS_PREF_FIRST_NAME
       END
          AS "PreferredFirstName",
       SPRIDEN_MI AS "MiddleName",
       SPRIDEN_LAST_NAME AS "LastName",
       SPBPERS_NAME_SUFFIX AS "Suffix",
       REPLACE (ORIGIN_AT_ENTRY, '_', ' ') AS "Hometown",
       CASE WHEN pop.STUDENT_PIDM IS NOT NULL THEN 'Student' ELSE NULL END
          AS "Affiliation",
       uaa_e.GOREMAL_EMAIL_ADDRESS AS "CampusEmail",
       pref_e.GOREMAL_EMAIL_ADDRESS AS "PreferredEmail",
       STUDENT_ID AS "CardID",
       STUDENT_ID AS "SISID_IND",
       '' AS "MobilePhone",
       TO_CHAR(BIRTH_DATE,'YYYY-MM-DD hh24:mm:ss') AS "DateOfBirth",
       CASE WHEN GENDER = 'F' THEN 'Female' ELSE 'Male' END AS "Sex",
       GORRACE_DESC AS "Race",
       CASE WHEN HISP_FLAG = 'Y' THEN 'Hispanic' ELSE 'Not Hispanic' END
          AS "Ethnicity",
       CASE
          WHEN MAU_FTPT = 'FTG' THEN 'Full-time Grad'
          WHEN MAU_FTPT = 'FTU' THEN 'Full-time Undergrad'
          WHEN MAU_FTPT = 'PTG' THEN 'Part-time Grad'
          WHEN MAU_FTPT = 'PTU' THEN 'Part-time Undergrad'
          ELSE MAU_FTPT
       END
          AS "EnrollmentStatus",
       TERM_CODE AS "CurrentTermEnrolled",
       CASE
          WHEN shrtgpa.SHRTGPA_GPA IS NULL THEN NULL
          ELSE TRUNC (SHRLGPA_GPA, 2)
       END
          AS "CurrentTermGPA", --overall GPA is used; however, if the student does not have earned institutional credits at their primary level for a term, no value is returned
       shrtgpa.SHRTGPA_TERM_CODE AS "PreviousTermEnrolled",
       TRUNC (shrtgpa.SHRTGPA_GPA, 2) AS "PreviousTermGPA",
       '' AS "CreditHoursEarned",
       '' AS "AnticipatedDateOfGraduation",
       CASE
          WHEN LEVL_CODE_1 IN ('UA', 'UV') AND DEGC_CODE_1 <> 'NDS'
          THEN
             'Undergraduate'
          WHEN LEVL_CODE_1 = 'GA' AND DEGC_CODE_1 <> 'NDS'
          THEN
             'Graduate'
          ELSE
             'Non-Degree Seeking'
       END
          AS "CareerLevel",
       MAU_CLASS_STAND AS "ClassStanding",
       CASE
          WHEN LEVL_CODE_1 IN ('UA', 'UV', 'GA') AND DEGC_CODE_1 <> 'NDS'
          THEN
             STVCOLL_DESC
          WHEN LEVL_CODE_1 = 'UF'
          THEN
             'UAF Undergrad'
          WHEN LEVL_CODE_1 = 'GF'
          THEN
             'UAF Graduate'
          WHEN LEVL_CODE_1 = 'US'
          THEN
             'UAS Undergrad'
          WHEN LEVL_CODE_1 = 'GS'
          THEN
             'UAS Graduate'
          ELSE
             'Non-Degree Seeking'
       END
          AS "PrimarySchoolOfEnrollment", --if the student is a UAA student, their college is pulled here, if they are UAF or UAS they are noted as such (rather than the college)
       CASE
          WHEN LEVL_CODE_1 IN ('UA', 'UV', 'GA') AND DEGC_CODE_1 <> 'NDS'
          THEN
             STVDEGC_DESC
          ELSE
             'Non-Degree Seeking'
       END
          AS "DegreeSought",
       CASE
          WHEN LEVL_CODE_1 IN ('UA', 'UV', 'GA') AND DEGC_CODE_1 <> 'NDS'
          THEN
             mjr.STVMAJR_DESC
          ELSE
             'Non-Degree Seeking'
       END
          AS "Major",
       CASE
          WHEN LEVL_CODE_1 IN ('UA', 'UV', 'GA') AND DEGC_CODE_1 <> 'NDS'
          THEN
             mnr.STVMAJR_DESC
          ELSE
             NULL
       END
          AS "Minor",
       '' AS "MajorAdvisor",
       '' AS "OtherAdvisor",
       '' AS "LocalResidencyStatus",
       --'' AS "HousingFacility", (will come from csv file)
       CASE WHEN ORIGIN_AT_ENTRY = 'Foreign' THEN 'True' ELSE 'False' END
          AS "International",
       CASE WHEN trans.STUDENT_PIDM IS NOT NULL THEN 'True' ELSE 'False' END
          AS "Transfer",
       '' AS "Athlete",
       '' AS "AthleticParticipation",
       '' AS "LocalPhoneCountryCode",
       '' AS "LocalPhone",
       '' AS "LocalPhoneExtension",
       '' AS "LocalStreet1",
       '' AS "LocalStreet2",
       '' AS "LocalStreet3",
       '' AS "LocalCity",
       '' AS "LocalStateProvince",
       '' AS "LocalPostalCode",
       '' AS "LocalCountry",
       '' AS "HomePhoneCountryCode",
       '' AS "HomePhone",
       '' AS "HomePhoneExtension",
       '' AS "HomeStreet1",
       '' AS "HomeStreet2",
       '' AS "HomeStreet3",
       CASE WHEN ORIGIN_CITY IS NOT NULL THEN ORIGIN_CITY ELSE NULL END
          AS "HomeCity",
       CASE WHEN ORIGIN_STATE IS NOT NULL THEN ORIGIN_STATE ELSE NULL END
          AS "HomeStateProvince",
       '' AS "HomePostalCode",
       CASE WHEN ORIGIN_NATION IS NOT NULL THEN ORIGIN_NATION ELSE NULL END
          AS "HomeCountry",
       '' AS "AbroadPhoneCountryCode",
       '' AS "AbroadPhone",
       '' AS "AbroadPhoneExtension",
       '' AS "AbroadStreet1",
       '' AS "AbroadStreet2",
       '' AS "AbroadStreet3",
       '' AS "AbroadCity",
       '' AS "AbroadStateProvince",
       '' AS "AbroadPostalCode",
       '' AS "AbroadCountry"
  FROM (SELECT DISTINCT stat.TERM_CODE,
                        stat.STUDENT_PIDM,
                        STUDENT_ID,
                        MAU_FTPT,
                        MAU_CLASS_STAND,
                        GORRACE_DESC,
                        HISP_FLAG,
                        GENDER,
                        BIRTH_DATE,
                        ORIGIN_AT_ENTRY,
                        LEVL_CODE_1,
                        COLL_CODE_1,
                        DEGC_CODE_1,
                        MAJR_CODE_1,
                        MAJR_CODE_MINR_1,
                        SPRIDEN_FIRST_NAME,
                        SPRIDEN_MI,
                        SPRIDEN_LAST_NAME,
                        SPBPERS_PREF_FIRST_NAME,
                        SPBPERS_NAME_SUFFIX
          FROM DSDMGR.DSD_STUDENT_STATS_OPEN stat,
               DSDMGR.DSD_STUDENT_DEMOG_OPEN demog,
               GORRACE,
               DSDMGR.DSD_STUDENT_CURRICULUM_OPEN curric,
               SPRIDEN,
               SPBPERS
         WHERE     stat.STUDENT_PIDM = demog.STUDENT_PIDM
               AND demog.UAR_RACE = GORRACE_RACE_CDE
               AND stat.STUDENT_PIDM = curric.PIDM
               AND stat.STUDENT_PIDM = SPRIDEN_PIDM
               AND SPRIDEN_CHANGE_IND IS NULL
               AND stat.STUDENT_PIDM = SPBPERS_PIDM
               AND stat.TERM_CODE = :current_term /*YYYY0_(1 for spring, 2 for summer, 3 for fall)*/
               AND stat.MAU = 'UAA'
               AND demog.TERM_CODE = :current_term
               AND demog.UAR_RACE = GORRACE_RACE_CDE
               AND curric.TERM_CODE = :current_term) pop
       LEFT OUTER JOIN
       (SELECT SHRTGPA_PIDM,
               SHRTGPA_LEVL_CODE,
               MAX (SHRTGPA_TERM_CODE) AS MAX_SHRTGPA_TERM_CODE
          FROM SHRTGPA
         WHERE SHRTGPA_GPA_TYPE_IND = 'I' AND SHRTGPA_TERM_CODE < :current_term
        GROUP BY SHRTGPA_PIDM, SHRTGPA_LEVL_CODE) shrtlevl
          ON     pop.STUDENT_PIDM = SHRTGPA_PIDM
             AND LEVL_CODE_1 = SHRTGPA_LEVL_CODE
       LEFT OUTER JOIN (SELECT SHRTGPA_PIDM,
                               SHRTGPA_LEVL_CODE,
                               SHRTGPA_TERM_CODE,
                               SHRTGPA_GPA
                          FROM SHRTGPA
                         WHERE SHRTGPA_GPA_TYPE_IND = 'I') shrtgpa
          ON     shrtlevl.SHRTGPA_PIDM = shrtgpa.SHRTGPA_PIDM
             AND shrtlevl.SHRTGPA_LEVL_CODE = shrtgpa.SHRTGPA_LEVL_CODE
             AND MAX_SHRTGPA_TERM_CODE = SHRTGPA_TERM_CODE
       LEFT OUTER JOIN (SELECT SHRLGPA_PIDM, SHRLGPA_LEVL_CODE, SHRLGPA_GPA
                          FROM SHRLGPA
                         WHERE SHRLGPA_GPA_TYPE_IND = 'O')
          ON     pop.STUDENT_PIDM = SHRLGPA_PIDM
             AND LEVL_CODE_1 = SHRLGPA_LEVL_CODE
       LEFT OUTER JOIN (SELECT STVLEVL_CODE, STVLEVL_DESC FROM STVLEVL)
          ON LEVL_CODE_1 = STVLEVL_CODE
       LEFT OUTER JOIN (SELECT STVCOLL_CODE, STVCOLL_DESC FROM STVCOLL)
          ON COLL_CODE_1 = STVCOLL_CODE
       LEFT OUTER JOIN (SELECT STVDEGC_CODE, STVDEGC_DESC FROM STVDEGC)
          ON DEGC_CODE_1 = STVDEGC_CODE
       LEFT OUTER JOIN (SELECT STVMAJR_CODE, STVMAJR_DESC FROM STVMAJR) mjr
          ON MAJR_CODE_1 = mjr.STVMAJR_CODE
       LEFT OUTER JOIN (SELECT STVMAJR_CODE, STVMAJR_DESC FROM STVMAJR) mnr
          ON MAJR_CODE_MINR_1 = mnr.STVMAJR_CODE
       LEFT OUTER JOIN
       --selecting UAA email address; above the suffix will be removed to create Username (if no 'UAA Account' email address (11 of ~18,0000 were missing for 201403) then the UASUER data from the freeze demog file is selected above)
       (SELECT DISTINCT GOREMAL_PIDM, GOREMAL_EMAIL_ADDRESS
          FROM GOREMAL
         WHERE GOREMAL_COMMENT = 'UAA Account' AND GOREMAL_EMAL_CODE = 'AGEN')
       uaa_e
          ON pop.STUDENT_PIDM = GOREMAL_PIDM
       LEFT OUTER JOIN
       --selecting active preferred email address with the most recent activity; above, if the student has no active preferred email address, the UAA email will be substituted

       (SELECT DISTINCT
               GOREMAL_PIDM, GOREMAL_EMAIL_ADDRESS, GOREMAL_ACTIVITY_DATE
          FROM GOREMAL a
         WHERE     GOREMAL_PREFERRED_IND = 'Y'
               AND GOREMAL_STATUS_IND = 'A'
               AND GOREMAL_ACTIVITY_DATE =
                      (SELECT MAX (GOREMAL_ACTIVITY_DATE)
                         FROM GOREMAL b
                        WHERE     a.GOREMAL_PIDM = b.GOREMAL_PIDM
                              AND GOREMAL_PREFERRED_IND = 'Y'
                              AND GOREMAL_STATUS_IND = 'A')) pref_e
          ON pop.STUDENT_PIDM = pref_e.GOREMAL_PIDM
       LEFT OUTER JOIN
       (SELECT GOBTPAC_PIDM, GOBTPAC_EXTERNAL_USER FROM GOBTPAC)
          ON pop.STUDENT_PIDM = GOBTPAC_PIDM
       LEFT OUTER JOIN
       --pulling PIDMs of students who have been previously been classified as a new UAA transfer student in a previous open or close snapshot
       ( (SELECT DISTINCT STUDENT_PIDM
            FROM DSDMGR.DSD_STUDENT_STATS_OPEN
           WHERE MAU = 'UAA' AND MAU_TYPE IN ('new_int', 'new_ext'))
        UNION
        (SELECT DISTINCT STUDENT_PIDM
           FROM DSDMGR.DSD_STUDENT_STATISTICS
          WHERE MAU = 'UAA' AND MAU_TYPE IN ('new_int', 'new_ext'))) trans
          ON pop.STUDENT_PIDM = trans.STUDENT_PIDM
       LEFT OUTER JOIN (SELECT ORIGIN_PIDM,
                               ORIGIN_CITY,
                               ORIGIN_STATE,
                               ORIGIN_NATION
                          FROM DSDMGR.DSD_STUDENT_ORIGIN_OPEN
                         WHERE ORIGIN_TERM_CODE = :current_term)
          ON pop.STUDENT_PIDM = ORIGIN_PIDM
