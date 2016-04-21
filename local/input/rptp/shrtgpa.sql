SELECT SHRTGPA_PIDM PIDM_IND,
       SHRTGPA_TERM_CODE TERM_CODE_IND,
       SHRTGPA_LEVL_CODE LEVL_CODE,
       SHRTGPA_GPA_TYPE_IND TYPE_ND,
       SHRTGPA_TRIT_SEQ_NO TRIT_SEQ_NO,
       SHRTGPA_TRAM_SEQ_NO TRAM_SEQ_NO,
       SHRTGPA_HOURS_ATTEMPTED HOURS_ATTEMPTED,
       SHRTGPA_HOURS_EARNED HOURS_EARNED,
       SHRTGPA_GPA_HOURS G_HOURS,
       SHRTGPA_QUALITY_POINTS QUALITY_POINTS,
       SHRTGPA_GPA GPA,
       SHRTGPA_HOURS_PASSED HOURS_PASSED
  FROM SHRTGPA
 WHERE     SHRTGPA_LEVL_CODE IN ('UA',
                                 'GA',
                                 'UV',
                                 'GV')
       AND SHRTGPA_TERM_CODE = :term_code