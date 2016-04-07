SELECT DISTINCT
       enrolled.STUDENT_ID "ExternalId",
       username.AuthUsername "AuthUsername",
       REPLACE (enrolled.STUDENT_NAME_FIRST, ',', '') AS "Firstname",
       REPLACE (enrolled.STUDENT_NAME_LAST, ',', '') AS "Lastname",
       1 AS "IsActive",
       NULL AS "SurveyCohort",
       CASE WHEN ENROLLED.CLASS_STANDING IN ('FR', 'SO') THEN 1 ELSE 0 END
          AS "ReceiveSurvey",
       CONCAT (
          '20',
          CASE
             WHEN :current_term LIKE '%01'
             THEN
                CONCAT (SUBSTRING (CAST(:current_term AS VARCHAR(10)), 3, 2) - 1,
                        SUBSTRING (CAST(:current_term AS VARCHAR(10)), 3, 2))
             WHEN :current_term LIKE '%03'
             THEN
                CONCAT (SUBSTRING (CAST(:current_term AS VARCHAR(10)), 3, 2),
                        SUBSTRING (CAST(:current_term AS VARCHAR(10)), 3, 2) + 1)
             ELSE
                NULL
          END)
          AS "YearId",
       :current_term AS "TermId",
       NULL AS "RiskGroupId",
       LTRIM (RTRIM (addr_current.Address1)) AS "Address1",
       LTRIM (RTRIM (addr_current.Address2)) AS "Address2",
       LTRIM (RTRIM (addr_current.City)) AS "City",
       LTRIM (RTRIM (addr_current.Zip)) AS "Zip",
       LTRIM (RTRIM (addr_current.State)) AS "State",
       LTRIM (RTRIM (addr_current.Country)) AS "Country",
       tele.PHONE AS "PrimaryMobile",
       REPLACE (
          CASE
             WHEN email.EMAIL_PRIMARY IS NULL THEN email.EMAIL_ALT
             ELSE email.EMAIL_PRIMARY
          END,
          ' ',
          '')
          AS "PrimaryEmail",
       REPLACE (email.EMAIL_ALT, ' ', '') AS "AlternateEmail",
       CASE
          WHEN sex_birth.SPBPERS_SEX = 'F' THEN 0
          WHEN sex_birth.SPBPERS_SEX = 'M' THEN 1
          ELSE 3
       END
          AS "Gender",
       sex_birth.BirthYear,
       enrolled.STUDENT_NAME_MI AS "MiddleName",
       race_int.RaceEthnicity,
       CASE
          WHEN addr_oe.State <> 'AK' THEN 1
          WHEN addr_oe.State = 'AK' THEN 0
          ELSE 2
       END
          AS "StateInOut",
       race_int.InternationalStudent,
       CASE WHEN finaid.PIDM IS NOT NULL THEN 1 ELSE 0 END
          AS "FAFSASubmitted",
       CASE
          WHEN cast (finaid.PELL_PGI AS DECIMAL (18, 2)) <=
                  :pell_eligible_rate
          THEN
             1
          ELSE
             0
       END
          AS "PellEligible",
       finaid.PELL_PGI AS "EFC",
       CASE
          WHEN cast (finaid.UNMET_NEED AS DECIMAL (18, 2)) < 0 THEN 0
          ELSE FLOOR (cast (finaid.UNMET_NEED AS DECIMAL (18, 2)))
       END
          AS "UnmetNeed",
       CASE WHEN fed_aid_awarded.PIDM IS NOT NULL THEN 1 ELSE 0 END
          AS "FedAidReceived",                           /*paid, not awarded*/
       CASE
          WHEN     FINAID.MOTHER_HI_GRADE IS NULL
               AND FINAID.FATHER_HI_GRADE IS NULL
               AND FINAID.PIDM IS NOT NULL
          THEN
             2
          WHEN FINAID.MOTHER_HI_GRADE IS NULL AND FINAID.FATHER_HI_GRADE <> 3
          THEN
             1
          WHEN FINAID.FATHER_HI_GRADE IS NULL AND FINAID.MOTHER_HI_GRADE <> 3
          THEN
             1
          WHEN FINAID.MOTHER_HI_GRADE <> 3 AND FINAID.FATHER_HI_GRADE <> 3
          THEN
             1
          ELSE
             0
       END
          AS "FirstGenStudent",
       CASE
          WHEN (SELECT DISTINCT vet_benefits.pidm
                  FROM rptp.mapworks.vet_benefits vet_benefits
                 WHERE enrolled.PIDM = vet_benefits.pidm)
                  IS NOT NULL
          THEN
             1
          ELSE
             0
       END
          AS "MilitaryBenefitsUS",
       high_school.HighSchoolGPA,
       high_school.HighSchoolPercentile,
       high_school.HighSchoolGradYear,
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'EACO')
          AS "ACTComposite",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'EAEN')
          AS "ACTEnglish",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'EAMA')
          AS "ACTMath",
       NULL AS "ACTWriting",                -- we don't have one (Peggy Byers)
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'EASR')
          AS "ACTScience",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'EARE')
          AS "ACTReading",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'SATM')
          AS "SATMath",
       NULL AS "SATComposite",              -- we don't have one (Peggy Byers)
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'SATW')
          AS "SATWriting",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'SATC')
          AS "SATCriticalRead",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'AASS')
          AS "ACCUPLACERSentence",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'AAAR')
          AS "ACCUPLACERArithmetic",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'AAEA')
          AS "ACCUPLACERAlgebra",
       (SELECT LTS_SCORE
          FROM rptp.mapworks.test_scores test_scores
         WHERE LTS_PIDM = ENROLLED.PIDM AND LTS_CODE = 'AARC')
          AS "ACCUPLACERReading",
       FORMAT(adm_latest.APPLICATION_DATE, 'MM/dd/yyyy', 'en-US') AS "ApplicationDate",
       FORMAT(adm_latest.DECISION_DATE, 'MM/dd/yyyy','en-US') AS "AdmissionDate",
       SUBSTRING (adm_latest.APPLICATION_TERM, 1, 4) AS "EnrollYear",
       adm_latest.APPLICATION_TERM AS "EnrollTerm",
       CASE
          WHEN adm_latest.STUDENT_TYPE IN ('F', 'G') THEN 0
          WHEN adm_latest.STUDENT_TYPE IN ('T') THEN 1
          WHEN adm_latest.STUDENT_TYPE IN ('R', 'C') THEN 2
          ELSE NULL
       END
          AS "EnrollType",
       CASE
          WHEN enrolled.CLASS_STANDING = 'ND'
          THEN
             0
          WHEN enrolled.CLASS_STANDING IN ('FR',
                                           'JR',
                                           'PD',
                                           'SO',
                                           'SR')
          THEN
             1
          ELSE
             2
       END
          AS "DegreeSeeking",
       CASE
          WHEN enrolled.CLASS_STANDING = 'FR' THEN 0
          WHEN enrolled.CLASS_STANDING = 'SO' THEN 1
          WHEN enrolled.CLASS_STANDING = 'JR' THEN 2
          WHEN enrolled.CLASS_STANDING = 'SR' THEN 3
          WHEN enrolled.CLASS_STANDING LIKE 'G%' THEN 4
          ELSE 6
       END
          AS "ClassLevel",
       enrolled.STVMAJR_CIPC_CODE AS "MajorCIP",
       CASE
          WHEN (SELECT honors.PIDM
                  FROM rptp.mapworks.honors honors
                 WHERE enrolled.PIDM = honors.PIDM)
                  IS NOT NULL
          THEN
             1
          ELSE
             0
       END
          AS "HonorsStudent",
       CASE WHEN athletes.PIDM IS NOT NULL THEN 1 ELSE 0 END
          AS "AthleteStudent",
       athletes.AthleteScholarship AS "AthleteScholarship",
       athletes.AthleteSport AS "AthleteSport",
       CASE
          WHEN     :current_term >= 201603
               AND enrolled.CLASS_STANDING IN ('FR', 'SO')
          THEN
             1
          ELSE
             NULL
       END
          AS "RetentionTrack",
       CASE
          WHEN :current_term LIKE '%01'
          THEN
             CASE
                WHEN (SELECT prev_fall.PIDM
                        FROM rptp.mapworks.prev_fall prev_fall
                       WHERE prev_fall.PIDM = enrolled.PIDM)
                        IS NOT NULL
                THEN
                   1
                ELSE
                   NULL /* null because we can only ascertain whether they have continued, not will */
             END
          ELSE
             NULL
       END
          AS "PersistMidYear",
       CASE
          WHEN (SELECT prev_ay.PIDM
                  FROM rptp.mapworks.prev_ay prev_ay
                 WHERE prev_ay.PIDM = enrolled.PIDM)
                  IS NOT NULL
          THEN
             1
          ELSE
             0
       END
          AS "RetainYear2",
       CASE
          WHEN (SELECT prev_2ay.PIDM
                  FROM rptp.mapworks.prev_2ay prev_2ay
                 WHERE prev_2ay.PIDM = enrolled.PIDM)
                  IS NOT NULL
          THEN
             1
          ELSE
             0
       END
          AS "RetainYear3",
       cred_cum_preyear_acad.CREDITS AS "PreYearCredTotal",
       cred_cum_preyear_rem.CREDITS AS "PreYearRemCredEarned",
       prev_ay_gpa.GPA AS "PreYearCumGPA",
       CASE
          WHEN ftpt.MAU_FTPT LIKE 'F%' THEN 0
          WHEN ftpt.MAU_FTPT LIKE 'P%' THEN 1
          ELSE NULL
       END
          AS "EnrollTimeStatus",
       CASE
          WHEN (SELECT TOP 1
                       StudentNumber
                  FROM csv.dbo.housing housing
                 WHERE     housing.StudentNumber = enrolled.STUDENT_ID
                       AND housing.TermNumericCode = enrolled.TERM_CODE)
                  IS NOT NULL
          THEN
             1
          ELSE
             0
       END
          AS "CampusResident",
       cred_preterm_acad.CREDITS AS "StartTermCredTotal",
       cred_preterm_rem.CREDITS AS "StartTermCredRem",
       end_term.EndTermGPA,
       end_term.EndTermCreditsEarned,
       end_term.EndTermCumGPA,
       end_term.EndTermCumCreditsEarned,
       end_term.EndTermRemCredPass,
       CASE
          WHEN not_sap.PIDM IS NOT NULL THEN 0
          WHEN fed_aid_awarded.PIDM IS NULL THEN NULL
          ELSE 1
       END
          AS "SAP",
       enrolled.PRIM_DEGREE_CODE AS "EdGoalISP2",
       CASE WHEN sex_birth.SPBPERS_CONFID = 'Y' THEN 1 ELSE 0 END
          AS "ConfidentialFlagISP1",
       enrolled.PRIM_MAJR_DESC AS "PrimaryMajorISP3",
       CASE
          WHEN enrolled.PRIM_MAJR IN ('GENP', 'UDCL', 'EXPM')
          THEN
             'UAA General Education'
          ELSE
             REPLACE (enrolled.PRIM_COLL_DESC, ',', '')
       END
          AS "PrimaryCollegeISP4",
       enrolled.CLASS_STANDING AS "ClassStandingISP5"
  FROM rptp.mapworks.enrolled enrolled
       LEFT JOIN rptp.mapworks.username username
          ON enrolled.PIDM = username.PIDM
       LEFT JOIN rptp.mapworks.addr_current addr_current
          ON enrolled.PIDM = addr_current.PIDM
       LEFT JOIN rptp.mapworks.addr_oe addr_oe
          ON enrolled.PIDM = addr_oe.PIDM
       LEFT JOIN rptp.mapworks.tele tele ON enrolled.PIDM = tele.PIDM
       LEFT JOIN rptp.mapworks.email email ON enrolled.PIDM = email.PIDM
       LEFT JOIN rptp.mapworks.sex_birth sex_birth
          ON enrolled.PIDM = sex_birth.PIDM
       LEFT JOIN rptp.mapworks.race_int race_int
          ON enrolled.PIDM = race_int.PIDM
       LEFT JOIN rptp.mapworks.finaid finaid ON enrolled.PIDM = finaid.PIDM
       LEFT JOIN rptp.mapworks.high_school high_school
          ON enrolled.PIDM = high_school.PIDM
       LEFT JOIN rptp.mapworks.adm_latest adm_latest
          ON adm_latest.STUDENT_PIDM = enrolled.PIDM
       LEFT JOIN rptp.mapworks.prev_ay_gpa prev_ay_gpa
          ON prev_ay_gpa.PIDM = enrolled.PIDM
       LEFT JOIN rptp.mapworks.ftpt ftpt ON ftpt.PIDM = Enrolled.pidm
       LEFT JOIN rptp.mapworks.athletes athletes
          ON enrolled.PIDM = athletes.PIDM
       LEFT JOIN rptp.mapworks.cred_cum_preyear_acad cred_cum_preyear_acad
          ON enrolled.PIDM = cred_cum_preyear_acad.PIDM
       LEFT JOIN rptp.mapworks.cred_cum_preyear_rem cred_cum_preyear_rem
          ON enrolled.PIDM = cred_cum_preyear_rem.PIDM
       LEFT JOIN rptp.mapworks.cred_preterm_acad cred_preterm_acad
          ON cred_preterm_acad.PIDM = enrolled.PIDM
       LEFT JOIN rptp.mapworks.cred_preterm_rem cred_preterm_rem
          ON cred_preterm_rem.PIDM = enrolled.PIDM
       LEFT JOIN rptp.mapworks.end_term end_term
          ON end_term.PIDM = enrolled.PIDM
       LEFT JOIN rptp.mapworks.not_sap not_sap
          ON not_sap.PIDM = enrolled.PIDM
       LEFT JOIN rptp.mapworks.fed_aid_awarded fed_aid_awarded
          ON fed_aid_awarded.PIDM = enrolled.PIDM/* -- end -- */
                                                 ;
