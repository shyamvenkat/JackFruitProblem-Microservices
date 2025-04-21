Microservices Integrated with this team:
i) Email Notification
ii) SMS Notification

How it is done:

The microservices which we have implemented run locally on the system. To make it accessable globally we use bore, which makes the port on which the microservice is running on to global. Bore issues a new port on which it runs and using it the api can be called. 

This is done for both sms and email noti., where they call the "bore-url/send-suds-email" and "bore-url/send-suds-sms".

So whenever the action is done(confirm/submit button is clicked), it calls the respective api and a communication is formed. 

