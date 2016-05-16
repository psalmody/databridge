SELECT DISTINCT
       pop.TERM_CODE,
       pop.UAID,
       pop.FIRSTNAME,
       pop.LASTNAME,
       pop.FTPT,
       pop.CLASS_STAND,
       pop.GENDER,
       CASE
          WHEN pop.AGE < 18 THEN '0-17'
          WHEN pop.AGE >= 18 AND pop.AGE <= 22 THEN '18-22'
          WHEN pop.AGE >= 23 AND pop.AGE <= 27 THEN '23-27'
          WHEN pop.AGE >= 28 AND pop.AGE <= 32 THEN '28-32'
          WHEN pop.AGE >= 33 AND pop.AGE <= 37 THEN '33-37'
          WHEN pop.AGE >= 38 AND pop.AGE <= 42 THEN '38-42'
          WHEN pop.AGE >= 43 AND pop.AGE <= 47 THEN '43-47'
          WHEN pop.AGE >= 48 AND pop.AGE <= 52 THEN '48-52'
          WHEN pop.AGE >= 53 AND pop.AGE <= 57 THEN '53-57'
          WHEN pop.AGE >= 58 THEN '58+'
       END
          AS AGE,
       pop.IPEDS_RACE_ETHNICITY,
       pop.HOME_CAMPUS,
       CASE
          WHEN housing.StudentNumber IS NOT NULL THEN 'On campus'
          WHEN housing_kpc.StudentNumber IS NOT NULL THEN 'On campus'
          ELSE 'Off campus'
       END
          AS ON_OFF_CAMPUS,
       pop.PREFERRED_EMAIL
  FROM oracle.surveys.population_open pop
       LEFT JOIN csv.dbo.housing housing
          ON     pop.UAID = housing.StudentNumber
             AND pop.TERM_CODE = housing.TermNumericCode
       LEFT JOIN csv.housing.kpc_201601 housing_kpc
          ON housing_kpc.StudentNumber = pop.UAID