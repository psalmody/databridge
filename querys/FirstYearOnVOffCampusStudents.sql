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
             WHERE     SHRTGPA.SHRTGPA_TERM_CODE <= :term
                   AND SHRTGPA.SHRTGPA_GPA_TYPE_IND = 'I'
                   AND SHRTGPA.SHRTGPA_LEVL_CODE IN ('UA', 'GA')
            GROUP BY shrtgpa.shrtgpa_pidm)
SELECT TO_NUMBER (spriden.spriden_id) "StudentID_IND",
       SHRTGPA.SHRTGPA_GPA "GPA",
       SHRTGPA.SHRTGPA_HOURS_ATTEMPTED "CreditsAttempted",
       SHRTGPA.SHRTGPA_HOURS_EARNED "CreditsEarned",
       SHRTGPA.SHRTGPA_GPA_HOURS "GPAHours",
       cumcredits.HOURS_EARNED AS "CumulativeHoursEarned"
  FROM shrtgpa
       LEFT JOIN SPRIDEN
          ON     SHRTGPA.SHRTGPA_PIDM = SPRIDEN.SPRIDEN_PIDM
             AND SPRIDEN.SPRIDEN_CHANGE_IND IS NULL
             AND SPRIDEN.SPRIDEN_ID LIKE '3%'
       LEFT JOIN cumcredits ON spriden.spriden_pidm = cumcredits.shrtgpa_pidm
 WHERE     1 = 1
       AND SHRTGPA.SHRTGPA_TERM_CODE = :term
       AND SHRTGPA.SHRTGPA_GPA_TYPE_IND = 'I'
       AND SHRTGPA.SHRTGPA_LEVL_CODE IN ('UA', 'GA')

/* -- end -- */
