Microservices Integrated with this team:
i) SMS Notification
ii) Email Notification

How it is done:

The microservices which we have implemented run locally on the system. To make it accessable "globally" we use bore, which makes the port on which the microservice is running on to global. Bore issues a new port on which it runs and using it the api can be called. 

This is done for both sms and email noti., where they call the "bore-url/send-quote-sms" and "bore-url/send-quote-email".

