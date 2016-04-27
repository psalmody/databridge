SELECT SA.externalId,
       SA.firstName,
       SA.lastName,
       SA.email
  FROM rptp.employees.student_affairs SA
       INNER JOIN rptp.employees.ferpa_certified FERPA
          ON FERPA.AuthUsername = SA.externalId