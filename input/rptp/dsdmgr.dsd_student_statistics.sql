SELECT stats.FISCAL_YEAR,
       stats.TERM_CODE TERM_CODE_IND,
       stats.MAU,
       stats.ACADEMIC_ORGANIZATION,
       stats.HOME_CAMPUS,
       stats.ACCREDITED_INSTITUTION,
       stats.STUDENT_PIDM STUDENT_PIDM_IND,
       stats.STUDENT_ID STUDENT_ID_IND,
       stats.CREDIT_HOURS,
       stats.CREDIT_HOURS_W_AUDIT,
       stats.UA_DEGREE,
       stats.UA_MAJOR,
       stats.UA_CONCENTRATION,
       stats.UA_FTPT,
       stats.UA_FTPT_W_AUDIT,
       stats.UA_CLASS_STAND,
       stats.UA_TYPE,
       stats.MAU_DEGREE,
       stats.MAU_MAJOR,
       stats.MAU_CONCENTRATION,
       stats.MAU_FTPT,
       stats.MAU_FTPT_W_AUDIT,
       stats.MAU_CLASS_STAND,
       stats.MAU_TYPE,
       stats.AO_DEGREE,
       stats.AO_MAJOR,
       stats.AO_CONCENTRATION,
       stats.AO_FTPT,
       stats.AO_FTPT_W_AUDIT,
       stats.AO_CLASS_STAND,
       stats.AO_TYPE
  FROM DSDMGR.DSD_STUDENT_STATISTICS stats
  WHERE stats.MAU = 'UAA'
  AND stats.FISCAL_YEAR > 2012