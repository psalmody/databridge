SELECT pop.TERM_CODE,
       pop.UAID,
       pop.FIRSTNAME,
       pop.LASTNAME,
       pop.FTPT,
       pop.CLASS_STAND,
       pop.GENDER,
       pop.AGE,
       pop.IPEDS_RACE_ETHNICITY,
       pop.HOME_CAMPUS,
       CASE
          WHEN housing.StudentNumber IS NULL THEN 'Off campus'
          ELSE 'On campus'
       END
          AS ON_OFF_CAMPUS,
       pop.PREFERRED_EMAIL
  FROM rptp.surveys.population_open pop
       LEFT JOIN csv.dbo.housing housing
          ON     pop.UAID = housing.StudentNumber
             AND pop.TERM_CODE = housing.TermNumericCode